"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getSelectedDeliveryAddress,
  readDeliveryLocationBook,
  type SavedDeliveryAddress,
  upsertAddress,
  writeDeliveryLocationBook,
} from "@/lib/delivery-location";
import { calculateRentalDates } from "@/lib/rental-helpers";
import { useSession } from "@/hooks/user-session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PaymentMethod = "QR_UPI" | "COD";

type CheckoutButtonProps = {
  total: number;
};

type CheckoutResponse = {
  success: boolean;
  mode?: "COD_COMPLETED" | "QR_COMPLETED";
  error?: string;
};

function createAddressId() {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateValue(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function normalizeAddressText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function addressSignature(address: SavedDeliveryAddress) {
  return [
    normalizeAddressText(address.addressLine || ""),
    normalizeAddressText(address.city || ""),
    normalizeAddressText(address.state || ""),
    (address.pincode || "").replace(/\D/g, "").slice(0, 6),
  ].join("|");
}

export function CheckoutButton({ total }: CheckoutButtonProps) {
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user?.id;

  const paymentUpiId = (process.env.NEXT_PUBLIC_PAYMENT_UPI_ID || "").trim();
  const paymentUpiName = (process.env.NEXT_PUBLIC_PAYMENT_UPI_NAME || "noorat").trim();
  const paymentQrImageUrl = (process.env.NEXT_PUBLIC_PAYMENT_QR_IMAGE_URL || "").trim();
  const isQrConfigured = paymentUpiId.length > 0;
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");
  const [savedAddresses, setSavedAddresses] = useState<SavedDeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedDeliveryAddress | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [phone, setPhone] = useState("");
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isQrConfigured ? "QR_UPI" : "COD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep payment amount stable to 2 decimals for UPI and display.
  const payableAmount = useMemo(() => Number(total.toFixed(2)), [total]);

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
    return `I have paid Rs. ${formatPrice(payableAmount)}`;
  }, [paymentMethod, payableAmount]);

  const rentalTimeline = useMemo(() => {
    const orderPlacedAt = new Date();
    const { rentalStartDate, rentalEndDate } = calculateRentalDates(orderPlacedAt);

    const pickupFromCustomerDate = new Date(rentalEndDate);
    pickupFromCustomerDate.setDate(pickupFromCustomerDate.getDate() + 1);

    return {
      deliveryDate: rentalStartDate,
      returnPickupDate: pickupFromCustomerDate,
    };
  }, []);

  const upiPaymentLink = useMemo(() => {
    if (!paymentUpiId) return "";

    const params = new URLSearchParams({
      pa: paymentUpiId,
      pn: paymentUpiName,
      am: payableAmount.toFixed(2),
      cu: "INR",
      tn: "noorat order payment",
    });

    return `upi://pay?${params.toString()}`;
  }, [paymentUpiId, paymentUpiName, payableAmount]);

  const qrImageSrc = useMemo(() => {
    if (paymentQrImageUrl) return paymentQrImageUrl;
    if (!upiPaymentLink) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&ecc=H&data=${encodeURIComponent(upiPaymentLink)}`;
  }, [paymentQrImageUrl, upiPaymentLink]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      const book = readDeliveryLocationBook(userId);
      
      // Fetch saved addresses from database
      fetch("/api/customer/addresses", { signal: AbortSignal.timeout(8000) })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.addresses) {
            // Merge DB + local addresses and remove duplicates by normalized address signature.
            const dbAddresses = (data.addresses as SavedDeliveryAddress[]) || [];
            const signatureMap = new Map<string, SavedDeliveryAddress>();

            for (const address of [...dbAddresses, ...book.addresses]) {
              const signature = addressSignature(address);
              if (!signatureMap.has(signature)) {
                signatureMap.set(signature, address);
              }
            }

            const mergedAddresses = Array.from(signatureMap.values());

            setSavedAddresses(mergedAddresses);

            // Select default address from DB if available, otherwise use localStorage selection
            const defaultFromDb = dbAddresses.find((addr: any) => addr.isDefault);
            if (defaultFromDb) {
              setSelectedAddress(defaultFromDb);
            } else {
              const localSelected = getSelectedDeliveryAddress(book);
              if (!localSelected) {
                setSelectedAddress(mergedAddresses[0] ?? null);
              } else {
                const selectedFromMerged = mergedAddresses.find((addr) => addr.id === localSelected.id);
                setSelectedAddress(selectedFromMerged ?? mergedAddresses[0] ?? null);
              }
            }

            // Prefer latest DB phone if present; fallback to session phone.
            setPhone(typeof data.phone === "string" && data.phone ? data.phone : (session?.user?.phone || ""));
          } else {
            setSavedAddresses(book.addresses);
            setSelectedAddress(getSelectedDeliveryAddress(book));
            setPhone(session?.user?.phone || "");
          }
        })
        .catch(() => {
          // Fallback to localStorage if API fails
          setSavedAddresses(book.addresses);
          setSelectedAddress(getSelectedDeliveryAddress(book));
          setPhone(session?.user?.phone || "");
        });

      setStep("address");
      setAddressConfirmed(false);
      setShowAddAddressForm(false);
      setNewAddressLine("");
      setNewPincode("");
      setPaymentMethod(isQrConfigured ? "QR_UPI" : "COD");
      setError(null);
      return;
    }

    setSubmitting(false);
  }

  function selectAddress(addressId: string) {
    const existingBook = readDeliveryLocationBook(userId);
    const selectedFromState = savedAddresses.find((address) => address.id === addressId) || null;
    const nextBook = {
      ...existingBook,
      selectedId: addressId,
      addresses: savedAddresses,
    };

    writeDeliveryLocationBook(nextBook, userId);
    setSelectedAddress(selectedFromState || getSelectedDeliveryAddress(nextBook));
    setAddressConfirmed(false);
    setError(null);
  }

  function getCheckoutPayload() {
    return {
      paymentMethod,
      phone,
      deliveryAddress: {
        label: selectedAddress?.label || "OTHER",
        name: selectedAddress?.name || "",
        addressLine: selectedAddress?.addressLine || "",
        city: selectedAddress?.city || "",
        state: selectedAddress?.state || "",
        pincode: selectedAddress?.pincode || "",
      },
    };
  }

  function addManualAddress() {
    const line = newAddressLine.trim();
    const pin = newPincode.trim();

    if (!line) {
      setError("Please enter full address.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    const book = readDeliveryLocationBook(userId);
    const address: SavedDeliveryAddress = {
      id: createAddressId(),
      label: "HOME",
      name: "My Address",
      addressLine: line,
      city: "",
      state: "",
      pincode: pin,
    };

    const nextBook = upsertAddress(book, address, true);
    writeDeliveryLocationBook(nextBook, userId);

    // Also save to database so it appears in future checkouts
      fetch("/api/customer/addresses/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: address.name,
        label: address.label,
        addressLine: address.addressLine,
        city: address.city || null,
        state: address.state || null,
        pincode: address.pincode,
      }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {
      // Silently fail - address is still in localStorage
    });

    setSavedAddresses(nextBook.addresses);
    setSelectedAddress(getSelectedDeliveryAddress(nextBook));
    setAddressConfirmed(false);
    setShowAddAddressForm(false);
    setNewAddressLine("");
    setNewPincode("");
    setError(null);
  }

  async function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError("Location not supported in this browser.");
      return;
    }

    setLocating(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Unable to read location details");
      }

      const data = (await response.json()) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          postcode?: string;
        };
      };

      const pincode = (data.address?.postcode || "").replace(/\D/g, "").slice(0, 6);
      const city = data.address?.city || data.address?.town || data.address?.village || "";
      const state = data.address?.state || "";

      if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        setError("Could not detect valid pincode. Please add address manually.");
        return;
      }

      const book = readDeliveryLocationBook(userId);
      const address: SavedDeliveryAddress = {
        id: createAddressId(),
        label: "HOME",
        name: "Current Location",
        addressLine: data.display_name || "",
        city,
        state,
        pincode,
      };

      const nextBook = upsertAddress(book, address, true);
      writeDeliveryLocationBook(nextBook, userId);
      setSavedAddresses(nextBook.addresses);
      setSelectedAddress(getSelectedDeliveryAddress(nextBook));
      setAddressConfirmed(false);
      setShowAddAddressForm(false);
      setError(null);
    } catch {
      setError("Location denied/unavailable. Please add address manually.");
    } finally {
      setLocating(false);
    }
  }

  async function copyToClipboard(value: string, label: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError(`Unable to copy ${label}. Please copy it manually.`);
    }
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

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (paymentMethod === "QR_UPI" && !isQrConfigured) {
      setError("QR payment is currently unavailable. Please continue with Cash on Delivery.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(getCheckoutPayload()),
      });

      const data = (await res.json()) as CheckoutResponse;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to complete checkout");
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

      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">
            {step === "address" ? "Delivery Address" : "Payment Method"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === "address"
              ? "Confirm delivery location"
              : "Select payment method"}
          </DialogDescription>
        </DialogHeader>

        {step === "address" ? (
          <div className="space-y-2">
            <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
              <p className="font-semibold text-foreground text-sm">Rental Timeline</p>
              <p className="mt-0.5 text-muted-foreground">Schedule for this order</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Delivery date</span>
                  <span className="font-medium text-foreground">
                    {formatDateValue(rentalTimeline.deliveryDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Return pickup date</span>
                  <span className="font-medium text-foreground">
                    {formatDateValue(rentalTimeline.returnPickupDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
              <p className="font-semibold text-foreground text-sm">Contact Phone *</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {phone && /^[6-9]\d{9}$/.test(phone) ? "✓ Valid" : "Enter 10-digit mobile starting with 6-9"}
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
              <p className="font-semibold text-foreground text-sm">Delivery Address *</p>
              {selectedAddress ? (
                <div className="mt-2 space-y-0.5">
                  <p className="font-medium text-foreground">{selectedAddress.name}</p>
                  <p className="text-muted-foreground">{selectedAddress.addressLine}</p>
                  <p className="text-muted-foreground">
                    {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No address selected
                </p>
              )}
            </div>

            {savedAddresses.length > 0 ? (
              <div className="space-y-1 rounded-md border border-border p-2">
                <p className="text-xs font-medium text-foreground">Saved addresses</p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {savedAddresses.map((address) => {
                    const active = selectedAddress?.id === address.id;
                    const valid = address.addressLine.trim().length > 0 && /^\d{6}$/.test(address.pincode.trim());

                    return (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-xs ${active ? "border-primary bg-primary/5" : "border-border"}`}
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

            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-sm border border-border px-2 py-1 text-xs font-medium text-foreground"
                  onClick={() => {
                    setShowAddAddressForm((prev) => !prev);
                    setError(null);
                  }}
                >
                  {showAddAddressForm ? "Cancel" : "Add Address"}
                </button>
                <button
                  type="button"
                  className="rounded-sm border border-border px-2 py-1 text-xs font-medium text-foreground disabled:opacity-60"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  {locating ? "Locating..." : "Use Current Location"}
                </button>
              </div>

              {showAddAddressForm ? (
                <div className="space-y-2">
                  <textarea
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    placeholder="Flat, area, street, landmark"
                    className="min-h-16 w-full rounded-md border border-border px-2 py-1.5 text-xs"
                  />
                  <input
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Pincode"
                    className="w-full rounded-md border border-border px-2 py-1.5 text-xs"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    onClick={addManualAddress}
                  >
                    Save Address
                  </button>
                </div>
              ) : null}
            </div>

            {savedAddresses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No saved address found. Use "Add Address" or "Use Current Location".
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
              I confirm this delivery address and mobile {phone || "(not set)"} are correct.
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Payment method</p>
              <div className="grid gap-1">
                {(["QR_UPI", "COD"] as PaymentMethod[]).map((method) => {
                  const disabled = method === "QR_UPI" && !isQrConfigured;

                  return (
                  <label
                    key={method}
                    className={`flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <span>
                      {method === "QR_UPI" ? "Pay via QR" : "Cash on Delivery"}
                    </span>
                    <input
                      type="radio"
                      name="payment-method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      disabled={disabled}
                    />
                  </label>
                )})}
              </div>
            </div>

            {!isQrConfigured ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                QR payment is currently unavailable on this deployment. Cash on Delivery is enabled.
              </p>
            ) : null}

            {paymentMethod === "QR_UPI" ? (
              <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                <p className="font-medium text-foreground text-sm">Scan QR code</p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Pay exact amount, then click "I have paid"
                </p>

                {qrImageSrc ? (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={qrImageSrc}
                      alt="Payment QR code"
                      className="h-48 w-48 rounded-md border border-border bg-white p-2"
                    />
                  </div>
                ) : null}

                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-1 rounded-md border border-border/80 px-1.5 py-1">
                    <span className="truncate">UPI: {paymentUpiId || "N/A"}</span>
                    <button
                      type="button"
                      className="rounded-sm border border-border px-1.5 py-0.5 text-xs whitespace-nowrap"
                      onClick={() => copyToClipboard(paymentUpiId, "UPI")}
                      disabled={!paymentUpiId}
                    >
                      Copy
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1 rounded-md border border-border/80 px-1.5 py-1">
                    <span>Rs. {formatPrice(payableAmount)}</span>
                    <button
                      type="button"
                      className="rounded-sm border border-border px-1.5 py-0.5 text-xs whitespace-nowrap"
                      onClick={() => copyToClipboard(payableAmount.toFixed(2), "amount")}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                Pay cash on delivery
              </p>
            )}

            <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-foreground">Rs. {formatPrice(payableAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive bg-red-50 px-2 py-1 rounded">{error}</p>}

        <DialogFooter className="pt-2 gap-2">
          {step === "address" ? (
            <button
              type="button"
              className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedAddress || !addressIsValid || !addressConfirmed}
              onClick={() => setStep("payment")}
            >
              Continue
            </button>
          ) : (
            <>
              <button
                type="button"
                className="rounded-sm border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                onClick={() => setStep("address")}
                disabled={submitting}
              >
                Back
              </button>
              <button
                type="button"
                className="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={completeCheckout}
                disabled={submitting}
              >
                {submitting ? "Processing" : payLabel}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
