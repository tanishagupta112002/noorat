"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Crosshair,
  Home,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  DELIVERY_PROMPT_SEEN_KEY,
  getSelectedDeliveryAddress,
  readDeliveryLocationBook,
  type DeliveryLocationBook,
  type SavedDeliveryAddress,
  upsertAddress,
  writeDeliveryLocationBook,
} from "@/lib/delivery-location";

type GoogleLocationSuggestion = {
  placeId: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
};

type RecommendedAddress = {
  source: "user-profile" | "provider-profile";
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function addressSignature(address: Pick<SavedDeliveryAddress, "addressLine" | "city" | "state" | "pincode">) {
  return [
    normalizeText(address.addressLine),
    normalizeText(address.city),
    normalizeText(address.state),
    (address.pincode || "").replace(/\D/g, "").slice(0, 6),
  ].join("|");
}

function dedupeAndMergeAddresses(
  currentAddresses: SavedDeliveryAddress[],
  recommended: RecommendedAddress[]
): SavedDeliveryAddress[] {
  const seen = new Set<string>();
  const result: SavedDeliveryAddress[] = [];

  for (const item of currentAddresses) {
    const sig = addressSignature(item);
    if (seen.has(sig)) continue;
    seen.add(sig);
    result.push(item);
  }

  for (const item of recommended) {
    const candidate: SavedDeliveryAddress = {
      id: createId(),
      label: "OTHER",
      name: "",
      addressLine: item.addressLine,
      city: item.city,
      state: item.state,
      pincode: item.pincode,
    };

    const sig = addressSignature(candidate);
    if (seen.has(sig)) continue;
    seen.add(sig);
    result.push(candidate);
  }

  return result;
}

function shortAddress(address: SavedDeliveryAddress) {
  const line = [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
  return line || "Address not added";
}

function createId() {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function DeliveryLocationStrip() {
  const pathname = usePathname();
  const isVisible = pathname === "/" || /^\/rentals\/item\/[^/]+\/?$/.test(pathname);

  const [mounted, setMounted] = useState(false);
  const [book, setBook] = useState<DeliveryLocationBook>({ selectedId: null, addresses: [] });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState<GoogleLocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newPincode, setNewPincode] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const savedBook = readDeliveryLocationBook();
    setBook(savedBook);

    void (async () => {
      try {
        const response = await fetch("/api/delivery/recommended-addresses", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { addresses?: RecommendedAddress[] };
        if (!Array.isArray(data.addresses) || data.addresses.length === 0) return;

        setBook((prev) => {
          const nextAddresses = dedupeAndMergeAddresses(prev.addresses, data.addresses || []);
          if (nextAddresses.length === prev.addresses.length) return prev;

          const next: DeliveryLocationBook = {
            selectedId: prev.selectedId,
            addresses: nextAddresses,
          };

          writeDeliveryLocationBook(next);
          return next;
        });
      } catch {
        // Ignore recommendation fetch failures and keep local behavior.
      }
    })();

    const seenPrompt = window.localStorage.getItem(DELIVERY_PROMPT_SEEN_KEY) === "1";
    if (!seenPrompt) {
      setDrawerOpen(true);
      window.localStorage.setItem(DELIVERY_PROMPT_SEEN_KEY, "1");
    }
  }, [isVisible]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    let controller: AbortController | null = null;

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      controller = new AbortController();
      try {
        const res = await fetch(`/api/delivery/location-suggestions?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: GoogleLocationSuggestion[] };
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        if (!controller?.signal.aborted) {
          setSearching(false);
        }
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      controller?.abort();
    };
  }, [query]);

  const selected = useMemo(() => getSelectedDeliveryAddress(book), [book]);

  const filteredAddresses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return book.addresses;
    return book.addresses.filter((item) => {
      const blob = `${item.name} ${item.addressLine} ${item.city} ${item.state} ${item.pincode}`.toLowerCase();
      return blob.includes(q);
    });
  }, [book.addresses, query]);

  if (!isVisible) {
    return null;
  }

  function persist(next: DeliveryLocationBook) {
    setBook(next);
    writeDeliveryLocationBook(next);
  }

  function selectAddress(id: string) {
    const next = { ...book, selectedId: id };
    persist(next);
    setDrawerOpen(false);
  }

  function deleteAddress(id: string) {
    const nextAddresses = book.addresses.filter((item) => item.id !== id);
    const nextSelectedId = book.selectedId === id ? nextAddresses[0]?.id ?? null : book.selectedId;
    persist({ selectedId: nextSelectedId, addresses: nextAddresses });
  }

  async function useCurrentLocation() {
    setMessage("");

    if (!("geolocation" in navigator)) {
      setMessage("Location not supported in this browser.");
      return;
    }

    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`
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
        setMessage("Could not detect pincode. Please add manually.");
        return;
      }

      const duplicate = book.addresses.find((item) => {
        return addressSignature(item) ===
          addressSignature({
            addressLine: data.display_name || "",
            city,
            state,
            pincode,
          });
      });

      if (duplicate) {
        persist({ ...book, selectedId: duplicate.id });
        setDrawerOpen(false);
        return;
      }

      const nextAddress: SavedDeliveryAddress = {
        id: createId(),
        label: "HOME",
        name: "",
        addressLine: data.display_name || "",
        city,
        state,
        pincode,
      };

      const nextBook = upsertAddress(book, nextAddress, true);
      persist(nextBook);
      setDrawerOpen(false);
    } catch {
      setMessage("Location denied/unavailable. Please add address manually.");
    } finally {
      setLocating(false);
    }
  }

  function handleAddAddress() {
    if (!newAddress.trim() || !/^[1-9][0-9]{5}$/.test(newPincode.trim())) {
      setMessage("Full address and valid pincode are required.");
      return;
    }

    const nextAddress: SavedDeliveryAddress = {
      id: createId(),
      label: "HOME",
      name: "",
      addressLine: newAddress.trim(),
      city: "",
      state: "",
      pincode: newPincode.trim(),
    };

    const nextBook = upsertAddress(book, nextAddress, true);
    persist(nextBook);

    setShowAddForm(false);
    setNewAddress("");
    setNewPincode("");
    setMessage("");
    setDrawerOpen(false);
  }

  function addSuggestion(item: GoogleLocationSuggestion) {
    const newAddr: SavedDeliveryAddress = {
      id: createId(),
      label: "OTHER",
      name: "",
      addressLine: item.addressLine,
      city: item.city,
      state: item.state,
      pincode: item.pincode,
    };

    const duplicate = book.addresses.find(
      (a) => addressSignature(a) === addressSignature(newAddr)
    );

    if (duplicate) {
      persist({ ...book, selectedId: duplicate.id });
    } else {
      const nextBook = upsertAddress(book, newAddr, true);
      persist(nextBook);
    }

    setSuggestions([]);
    setQuery("");
    setDrawerOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-foreground"
      >
        <MapPin className="h-4 w-4" />
        {selected ? (
          <>
            <span className="max-w-60 truncate font-semibold lg:max-w-90">
              Deliver to {shortAddress(selected)}
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold">Location not set</span>
            <span className="text-primary">Select delivery location</span>
          </>
        )}
        <ChevronRight className="h-4 w-4 text-primary" />
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed inset-0 z-9998 transition-opacity duration-200 ${
                drawerOpen ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0 pointer-events-none"
              }`}
            >
              <div
                className={`ml-auto flex h-dvh w-full max-w-md flex-col bg-white px-5 py-10 shadow-2xl z-9999 transform transition-transform duration-300 ease-out ${
                  drawerOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Select delivery address</h3>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by area, street name, pin code"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searching && (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
                  {suggestions.map((item) => (
                    <button
                      key={item.placeId}
                      type="button"
                      onClick={() => addSuggestion(item)}
                      className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition hover:bg-muted"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.addressLine}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searching && query.trim().length >= 3 && suggestions.length === 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground shadow-lg">
                  No exact location found for this query. Try area name or pincode.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              <span className="text-sm font-semibold">Use my current location</span>
            </button>

            <div className="mt-4 flex-1 overflow-y-auto border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">Saved addresses</p>
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </button>
              </div>

              {showAddForm ? (
                <div className="mt-3 space-y-3 rounded-xl border border-border p-4">
                  <input
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="House no, street, colony"
                    className="h-11 w-full rounded-md border border-input px-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Pincode"
                      className="h-11 w-full rounded-md border border-input px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 space-y-3 pb-3">
                {filteredAddresses.length > 0 ? (
                  filteredAddresses.map((item) => {
                    const active = selected?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`w-full rounded-xl p-3 transition ${active ? "bg-muted" : "hover:bg-muted/60"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => selectAddress(item.id)}
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                          >
                            <Home className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
                            <p className="line-clamp-3 text-sm text-muted-foreground">{shortAddress(item)}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteAddress(item.id)}
                            aria-label="Delete address"
                            className="shrink-0 rounded-md p-1.5 text-destructive transition hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No saved address found.</p>
                )}
              </div>
            </div>

            {message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
