export type RentalCategoryOption = {
  label: string;
  href: string;
  aliases?: string[];
};

type RentalCategoryGroup = {
  id: RentalCategoryGroupId;
  href: string;
  labels: string[];
  extraAliases?: string[];
  signals?: string[];
};

type RentalCategoryGroupId = "western" | "ethnic" | "bridal" | "party-wear";

const RENTAL_CATEGORY_GROUPS = [
  {
    id: "western",
    href: "/rentals/western",
    labels: ["Western Wear", "Dresses", "Celebrity Styles", "Date Specials", "Birthday Specials", "Cocktail Party"],
    extraAliases: ["Western", "Western Party Wear", "Cocktail Dresses", "Occasion Dresses", "Birthday Looks", "Celebrity Looks"],
    signals: ["modern", "western"],
  },
  {
    id: "ethnic",
    href: "/rentals/ethnic",
    labels: [
      "Traditional Wear",
      "Sarees",
      "Lehengas",
      "Indo Western",
      "Salwar Suits",
      "Kurtis & Sets",
      "Anarkalis",
      "Lehenga Saree",
      "Heavy Gowns",
      "Mehndi Outfits",
      "Haldi Outfits",
      "Rajasthani Poshak",
    ],
    extraAliases: ["Traditional", "Ethnic", "Ethnic Wear", "Festive Wear", "Wedding Wear", "Occasion Wear", "Saree", "Lehenga", "Kurti", "Gown", "Gowns", "Poshak"],
    signals: ["traditional", "ethnic"],
  },
  {
    id: "bridal",
    href: "/rentals/bridal",
    labels: [
      "Bridal Specials",
      "Bridal Lehengas",
      "Engagement Gowns",
      "Reception Gowns",
      "Reception Gown Saree",
      "Mehndi & Haldi Outfits",
      "Sangeet Dresses",
      "Bridal Sarees",
      "Poshak",
    ],
    extraAliases: ["Wedding Wear", "Bridal Wear", "Traditional Bridal", "Occasion Wear"],
    signals: ["traditional", "bridal", "wedding"],
  },
  {
    id: "party-wear",
    href: "/rentals/party-wear",
    labels: ["Party Wear", "Casual Outfits", "Tops & Blouses", "Jumpsuits", "Skirts", "Shorts", "Co-ord Sets"],
    extraAliases: ["Party & Favorites", "Occasion Wear", "Celebration Wear", "Event Wear", "Casual", "Day Wear", "Everyday Wear", "Skirts & Shorts", "Co-ords", "Co ord Sets"],
    signals: ["modern", "party"],
  },
] as const satisfies readonly RentalCategoryGroup[];

type CategoryNode = {
  groupId: RentalCategoryGroupId;
  label: string;
  signals: Set<string>;
};

const LABEL_SIGNAL_HINTS: Record<string, string[]> = {
  "western wear": ["western", "modern"],
  dresses: ["dress", "party"],
  "celebrity styles": ["celebrity", "party", "modern"],
  "date specials": ["date", "party", "modern"],
  "birthday specials": ["birthday", "party", "modern"],
  "cocktail party": ["cocktail", "party", "modern"],
  "traditional wear": ["traditional", "ethnic"],
  sarees: ["saree", "traditional", "ethnic"],
  lehengas: ["lehenga", "traditional", "ethnic"],
  "indo western": ["fusion", "indo", "modern", "traditional"],
  "salwar suits": ["salwar", "suit", "traditional"],
  "kurtis & sets": ["kurti", "set", "traditional"],
  anarkalis: ["anarkali", "traditional"],
  "lehenga saree": ["lehenga", "saree", "traditional"],
  "heavy gowns": ["gown", "bridal", "wedding", "traditional"],
  "mehndi outfits": ["mehndi", "wedding", "traditional"],
  "haldi outfits": ["haldi", "wedding", "traditional"],
  "rajasthani poshak": ["rajasthani", "poshak", "traditional", "bridal"],
  "bridal specials": ["bridal", "wedding", "traditional"],
  "bridal lehengas": ["bridal", "lehenga", "wedding"],
  "engagement gowns": ["engagement", "gown", "bridal", "wedding"],
  "reception gowns": ["reception", "gown", "bridal", "wedding"],
  "reception gown saree": ["reception", "gown", "saree", "bridal", "wedding"],
  "mehndi & haldi outfits": ["mehndi", "haldi", "bridal", "wedding", "traditional"],
  "sangeet dresses": ["sangeet", "dress", "bridal", "wedding"],
  "bridal sarees": ["bridal", "saree", "wedding"],
  poshak: ["poshak", "bridal", "traditional"],
  "party wear": ["party", "modern"],
  "casual outfits": ["casual", "modern"],
  "tops & blouses": ["top", "blouse", "modern"],
  jumpsuits: ["jumpsuit", "modern", "party"],
  skirts: ["skirt", "modern", "party"],
  shorts: ["short", "modern", "casual"],
  "co-ord sets": ["co-ord", "coord", "set", "modern", "party"],
};

const STOP_WORDS = new Set(["and", "or", "the", "for", "with", "wear", "specials", "special", "sets", "set", "outfits", "outfit"]);

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function buildSignalsForLabel(group: RentalCategoryGroup, label: string) {
  const key = normalizeText(label);
  const signals = new Set<string>([...tokenize(label), ...(group.signals ?? []), ...(LABEL_SIGNAL_HINTS[key] ?? [])]);

  // Small normalization so near-identical fashion words connect reliably.
  if (signals.has("co") || signals.has("coord") || signals.has("co ord")) {
    signals.add("co-ord");
  }
  if (signals.has("gowns")) {
    signals.add("gown");
  }
  if (signals.has("dresses")) {
    signals.add("dress");
  }
  if (signals.has("lehengas")) {
    signals.add("lehenga");
  }
  if (signals.has("sarees")) {
    signals.add("saree");
  }

  return signals;
}

const categoryNodes: CategoryNode[] = RENTAL_CATEGORY_GROUPS.flatMap((group) =>
  group.labels.map((label) => ({
    groupId: group.id,
    label,
    signals: buildSignalsForLabel(group, label),
  })),
);

const groupAliasLookup = new Map<RentalCategoryGroupId, string[]>(
  RENTAL_CATEGORY_GROUPS.map((group) => [group.id, group.extraAliases ?? []]),
);

function countSignalOverlap(a: Set<string>, b: Set<string>) {
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) {
      overlap += 1;
    }
  }
  return overlap;
}

function shouldCrossMatch(node: CategoryNode, candidate: CategoryNode) {
  if (node.groupId === candidate.groupId) {
    return false;
  }

  const overlap = countSignalOverlap(node.signals, candidate.signals);

  // Require stronger semantic overlap for cross-group expansion.
  return overlap >= 2;
}

function buildCategoryAliases(group: RentalCategoryGroup, label: string) {
  const node = categoryNodes.find((entry) => entry.groupId === group.id && entry.label === label);
  const aliasSet = new Set(group.labels.filter((item) => item !== label));

  for (const alias of group.extraAliases ?? []) {
    aliasSet.add(alias);
  }

  if (node) {
    for (const candidate of categoryNodes) {
      if (!shouldCrossMatch(node, candidate)) {
        continue;
      }

      aliasSet.add(candidate.label);
      for (const alias of groupAliasLookup.get(candidate.groupId) ?? []) {
        aliasSet.add(alias);
      }
    }
  }

  aliasSet.delete(label);
  return Array.from(aliasSet);
}

export const RENTAL_CATEGORY_OPTIONS: RentalCategoryOption[] = RENTAL_CATEGORY_GROUPS.flatMap((group) =>
  group.labels.map((label) => ({
    label,
    href: group.href,
    aliases: buildCategoryAliases(group, label),
  }))
);

export const RENTAL_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "Free Size"];

export const RENTAL_COLOR_OPTIONS = [
  "Assorted",
  "Multi Color",
  "Red",
  "Pink",
  "Blue",
  "Green",
  "Yellow",
  "Black",
  "White",
  "Purple",
  "Orange",
  "Maroon",
  "Gold",
  "Silver",
  "Brown",
  "Beige",
  "Cream",
  "Ivory",
  "Grey",
  "Navy",
  "Teal",
  "Turquoise",
  "Mint",
  "Olive",
  "Peach",
  "Coral",
  "Lavender",
  "Magenta",
  "Mustard",
  "Rust",
  "Wine",
];

export const RENTAL_CITY_OPTIONS = [
  "India",
  "Agra",
  "Ahmedabad",
  "Ajmer",
  "Aligarh",
  "Allahabad",
  "Amritsar",
  "Aurangabad",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Dehradun",
  "Delhi",
  "Dhanbad",
  "Faridabad",
  "Ghaziabad",
  "Goa",
  "Gorakhpur",
  "Gurugram",
  "Guwahati",
  "Gwalior",
  "Hubli",
  "Hyderabad",
  "Indore",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jammu",
  "Jamshedpur",
  "Jodhpur",
  "Kanpur",
  "Kochi",
  "Kolkata",
  "Kota",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Mangalore",
  "Meerut",
  "Mohali",
  "Mumbai",
  "Mysuru",
  "Nagpur",
  "Nashik",
  "Noida",
  "Patna",
  "Prayagraj",
  "Pune",
  "Raipur",
  "Rajkot",
  "Ranchi",
  "Siliguri",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Udaipur",
  "Vadodara",
  "Varanasi",
  "Vijayawada",
  "Visakhapatnam",
];
