import { NextRequest, NextResponse } from "next/server";

type LocationSuggestion = {
  placeId: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
};

type PostalApiResponse = {
  Status: "Success" | "Error";
  PostOffice: Array<{
    Name: string;
    District: string;
    State: string;
    Block: string;
    Division: string;
    Pincode: string;
  }> | null;
};

async function searchViaPostalApi(q: string) {
  const raw = q.trim();
  const lowered = raw.toLowerCase();
  const words = lowered.split(/\s+/).filter(Boolean);
  const stopWords = new Set(["road", "rd", "street", "st", "near", "colony", "nagar", "area"]);
  const meaningfulWords = words.filter((w) => !stopWords.has(w));

  const candidates = Array.from(
    new Set([
      raw,
      meaningfulWords.join(" "),
      meaningfulWords.slice(-2).join(" "),
      meaningfulWords.slice(-1).join(" "),
      words.slice(-1).join(" "),
    ].filter(Boolean))
  );

  const all: LocationSuggestion[] = [];
  for (const candidate of candidates) {
    const isPincode = /^[1-9][0-9]{5}$/.test(candidate);
    const url = isPincode
      ? `https://api.postalpincode.in/pincode/${encodeURIComponent(candidate)}`
      : `https://api.postalpincode.in/postoffice/${encodeURIComponent(candidate)}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) continue;

    const [data] = (await res.json()) as [PostalApiResponse];
    if (data.Status !== "Success" || !Array.isArray(data.PostOffice)) continue;

    const mapped = data.PostOffice.map((item, idx) => {
      const addressLine = [item.Name, item.Block, item.Division].filter(Boolean).join(", ");
      const city = item.District || "";
      const state = item.State || "";
      const pincode = (item.Pincode || "").replace(/\D/g, "").slice(0, 6);

      return {
        placeId: `postal-${candidate}-${pincode}-${idx}`,
        addressLine,
        city,
        state,
        pincode,
        description: [addressLine, city, state, pincode].filter(Boolean).join(", "),
      } satisfies LocationSuggestion;
    }).filter((item) => item.addressLine.length > 0);

    all.push(...mapped);
    if (all.length >= 30) break;
  }

  const deduped = Array.from(
    new Map(all.map((item) => [`${item.addressLine.toLowerCase()}|${item.pincode}`, item])).values()
  );
  return deduped.slice(0, 30);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await searchViaPostalApi(q);
  return NextResponse.json({ suggestions, provider: "postal" });
}
