"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSelectedDeliveryAddress,
  readDeliveryLocationBook,
  type SavedDeliveryAddress,
  writeDeliveryLocationBook,
} from "@/lib/delivery-location";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PaymentMethod = "UPI" | "CARD" | "COD";

type CheckoutButtonProps = {
  total: number;
};

type RazorpayInitResponse = {
  success: boolean;
  mode?: "COD_COMPLETED" | "ONLINE_PENDING";
  error?: string;
  razorpay?: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: unknown) => void) => void;
    };
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function CheckoutButton({ total }: CheckoutButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");
  const [savedAddresses, setSavedAddresses] = useState<SavedDeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedDeliveryAddress | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressIsValid = useMemo(() => {
    if (!selectedAddress) return false;

    const hasAddressLine = selectedAddress.addressLine.trim().length > 0;
    const hasPincode = /^\d{6}$/.test(selectedAddress.pincode.trim());

    return hasAddressLine && hasPincode;
  }, [selectedAddress]);

  const payLabel = useMemo(() => {
    if (paymentMethod === "COD") {
      return "Confirm Order";
    }
    return `Pay Rs. ${formatPrice(total)}`;
  }, [paymentMethod, total]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      const book = readDeliveryLocationBook();
      setSavedAddresses(book.addresses);
      setSelectedAddress(getSelectedDeliveryAddress(book));
      setStep("address");
      setAddressConfirmed(false);
      setPaymentMethod("UPI");
      setError(null);
      return;
    }

    setSubmitting(false);
  }

  function selectAddress(addressId: string) {
    const book = readDeliveryLocationBook();
    const nextBook = {
      ...book,
      selectedId: addressId,
    };

    writeDeliveryLocationBook(nextBook);
    setSavedAddresses(nextBook.addresses);
    setSelectedAddress(getSelectedDeliveryAddress(nextBook));
    setAddressConfirmed(false);
    setError(null);
  }

  function getCheckoutPayload() {
    return {
      paymentMethod,
      deliveryAddress: {
        name: selectedAddress?.name || "",
        addressLine: selectedAddress?.addressLine || "",
        city: selectedAddress?.city || "",
        state: selectedAddress?.state || "",
        pincode: selectedAddress?.pincode || "",
      },
    };
  }

  async function ensureRazorpayScriptLoaded() {
    if (window.Razorpay) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Razorpay"));
      document.body.appendChild(script);
    });
  }

  async function openRazorpayAndVerify(initData: RazorpayInitResponse) {
    if (!initData.razorpay) {
      throw new Error("Unable to initialize Razorpay checkout");
    }

    await ensureRazorpayScriptLoaded();

    if (!window.Razorpay) {
      throw new Error("Razorpay SDK not available");
    }

    const RazorpayCtor = window.Razorpay;

    await new Promise<void>((resolve, reject) => {
      const rzp = new RazorpayCtor({
        key: initData.razorpay?.keyId,
        amount: initData.razorpay?.amount,
        currency: initData.razorpay?.currency,
        name: initData.razorpay?.name,
        description: initData.razorpay?.description,
        order_id: initData.razorpay?.orderId,
        prefill: initData.razorpay?.prefill,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/checkout/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...getCheckoutPayload(),
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData?.success) {
              throw new Error(verifyData?.error || "Payment verification failed");
            }

            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment was cancelled"));
          },
        },
        theme: {
          color: "#111827",
        },
      });

      rzp.on("payment.failed", (failed: unknown) => {
        const message =
          typeof failed === "object" &&
          failed !== null &&
          "error" in failed &&
          typeof (failed as { error?: { description?: unknown } }).error?.description === "string"
            ? (failed as { error?: { description?: string } }).error?.description
            : "Payment failed. Please try again.";
        reject(new Error(message));
      });

      rzp.open();
    });
  }

  async function completeCheckout() {
    if (!selectedAddress) {
      setError("Please select a delivery address first.");
      return;
    }

    if (!addressIsValid) {
      setError("Selected address is incomplete. Please choose another saved address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/checkout/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getCheckoutPayload()),
      });

      const data = (await res.json()) as RazorpayInitResponse;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to complete checkout");
      }

      if (data.mode === "ONLINE_PENDING") {
        await openRazorpayAndVerify(data);
      }

      setOpen(false);
      router.push("/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete checkout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-sm bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
        >
          Proceed to Checkout
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-140">
        <DialogHeader>
          <DialogTitle>
            {step === "address" ? "Confirm Delivery Address" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "address"
              ? "Please confirm where you want the order delivered."
              : "Choose a payment method to place your order."}
          </DialogDescription>
        </DialogHeader>

        {step === "address" ? (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
              {selectedAddress ? (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{selectedAddress.name}</p>
                  <p className="text-muted-foreground">{selectedAddress.addressLine}</p>
                  <p className="text-muted-foreground">
                    {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No delivery address selected yet.
                </p>
              )}
            </div>

            {savedAddresses.length > 0 ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-sm font-medium text-foreground">Choose saved address</p>
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {savedAddresses.map((address) => {
                    const active = selectedAddress?.id === address.id;
                    const valid = address.addressLine.trim().length > 0 && /^\d{6}$/.test(address.pincode.trim());

                    return (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm ${active ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <input
                          type="radio"
                          name="checkout-address"
                          checked={active}
                          onChange={() => selectAddress(address.id)}
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{address.name || "Saved Address"}</p>
                          <p className="text-muted-foreground">{address.addressLine}</p>
                          <p className="text-muted-foreground">
                            {address.city ? `${address.city}, ` : ""}
                            {address.state ? `${address.state} - ` : ""}
                            {address.pincode}
                          </p>
                          {!valid ? (
                            <p className="text-xs text-destructive">
                              Incomplete address. Please select a different one.
                            </p>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {savedAddresses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add a delivery address from the location selector in header, then retry checkout.
              </p>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={addressConfirmed}
                onChange={(e) => setAddressConfirmed(e.target.checked)}
                disabled={!selectedAddress || !addressIsValid}
              />
              I confirm this delivery address is correct.
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Select payment method</p>
              <div className="grid gap-2">
                {(["UPI", "CARD", "COD"] as PaymentMethod[]).map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {method === "UPI" ? "UPI / Wallet" : method === "CARD" ? "Credit / Debit Card" : "Cash on Delivery"}
                    </span>
                    <input
                      type="radio"
                      name="payment-method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Online payments are processed securely via Razorpay.
            </p>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payable amount</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {step === "address" ? (
            <button
              type="button"
              className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedAddress || !addressIsValid || !addressConfirmed}
              onClick={() => setStep("payment")}
            >
              Continue to Payment
            </button>
          ) : (
            <div className="flex w-full items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-sm border border-border px-4 py-2 text-sm font-medium text-foreground"
                onClick={() => setStep("address")}
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="button"
                className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={completeCheckout}
                disabled={submitting}
              >
                {submitting ? "Processing..." : payLabel}
              </button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
