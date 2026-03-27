export type SavedDeliveryAddress = {
  id: string;
  label: "HOME" | "WORK" | "OTHER";
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
};

export type DeliveryLocationBook = {
  selectedId: string | null;
  addresses: SavedDeliveryAddress[];
};

export const DELIVERY_BOOK_KEY = "tt_delivery_location_book";
export const DELIVERY_PROMPT_SEEN_KEY = "tt_delivery_location_prompt_seen";
export const DELIVERY_BOOK_UPDATED_EVENT = "tt_delivery_book_updated";
const LEGACY_LOCATION_KEY = "tt_user_location";

function isClient() {
  return typeof window !== "undefined";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeBook(raw: Partial<DeliveryLocationBook> | null): DeliveryLocationBook {
  if (!raw || typeof raw !== "object") {
    return { selectedId: null, addresses: [] };
  }

  const addresses = Array.isArray(raw.addresses)
    ? raw.addresses.filter((item) => {
        return (
          item &&
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.name === "string" &&
          typeof item.addressLine === "string" &&
          typeof item.city === "string" &&
          typeof item.state === "string" &&
          typeof item.pincode === "string"
        );
      })
    : [];

  return {
    selectedId: typeof raw.selectedId === "string" ? raw.selectedId : null,
    addresses,
  };
}

function fromLegacyLocation(): DeliveryLocationBook {
  if (!isClient()) return { selectedId: null, addresses: [] };

  const legacy = safeJsonParse<{
    city?: string;
    state?: string;
    pincode?: string;
    address?: string;
  }>(window.localStorage.getItem(LEGACY_LOCATION_KEY));

  if (!legacy?.pincode && !legacy?.address) {
    return { selectedId: null, addresses: [] };
  }

  const id = `addr_${Date.now()}`;
  const migrated: SavedDeliveryAddress = {
    id,
    label: "HOME",
    name: "My Address",
    addressLine: legacy.address || "",
    city: legacy.city || "",
    state: legacy.state || "",
    pincode: (legacy.pincode || "").replace(/\D/g, "").slice(0, 6),
  };

  return {
    selectedId: id,
    addresses: [migrated],
  };
}

export function readDeliveryLocationBook(): DeliveryLocationBook {
  if (!isClient()) return { selectedId: null, addresses: [] };

  const parsed = safeJsonParse<Partial<DeliveryLocationBook>>(
    window.localStorage.getItem(DELIVERY_BOOK_KEY)
  );
  const normalized = normalizeBook(parsed);

  if (normalized.addresses.length > 0) {
    return normalized;
  }

  const migrated = fromLegacyLocation();
  if (migrated.addresses.length > 0) {
    writeDeliveryLocationBook(migrated);
    return migrated;
  }

  return normalized;
}

export function writeDeliveryLocationBook(book: DeliveryLocationBook) {
  if (!isClient()) return;
  window.localStorage.setItem(DELIVERY_BOOK_KEY, JSON.stringify(book));
  window.dispatchEvent(new Event(DELIVERY_BOOK_UPDATED_EVENT));
}

export function getSelectedDeliveryAddress(book: DeliveryLocationBook): SavedDeliveryAddress | null {
  if (!book.selectedId) return book.addresses[0] ?? null;
  return book.addresses.find((item) => item.id === book.selectedId) ?? book.addresses[0] ?? null;
}

export function upsertAddress(book: DeliveryLocationBook, address: SavedDeliveryAddress, selectAddress = true): DeliveryLocationBook {
  const exists = book.addresses.some((item) => item.id === address.id);
  const addresses = exists
    ? book.addresses.map((item) => (item.id === address.id ? address : item))
    : [address, ...book.addresses];

  return {
    selectedId: selectAddress ? address.id : book.selectedId,
    addresses,
  };
}
