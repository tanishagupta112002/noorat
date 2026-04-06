import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SubpageConfig = {
  categoryLabel: string;
  section: string;
};

const SUBPAGE_CATEGORY_LABELS: Record<string, SubpageConfig> = {
  western: { categoryLabel: "Western Wear", section: "western" },
  "western/dresses": { categoryLabel: "Dresses", section: "western" },
  "western/frock-dresses": { categoryLabel: "Frock Dresses", section: "western" },
  "western/bodycon-dresses": { categoryLabel: "Bodycon Dresses", section: "western" },
  "western/gowns": { categoryLabel: "Gowns", section: "western" },
  "western/slit-gowns": { categoryLabel: "Slit Gowns", section: "western" },
  "western/cape-gowns": { categoryLabel: "Cape Gowns", section: "western" },
  "western/western-saree-dresses": { categoryLabel: "Western Saree Dresses", section: "western" },
  "western/maxi-dresses": { categoryLabel: "Maxi Dresses", section: "western" },
  "western/mini-dresses": { categoryLabel: "Mini Dresses", section: "western" },
  "western/mermaid-gowns": { categoryLabel: "Mermaid Gowns", section: "western" },
  "celebrity-styles": { categoryLabel: "Celebrity Styles", section: "western" },
  

  ethnic: { categoryLabel: "Traditional Wear", section: "ethnic" },
  traditional: { categoryLabel: "Traditional Wear", section: "ethnic" },
  "traditional-wear": { categoryLabel: "Traditional Wear", section: "ethnic" },
  "ethnic/sarees": { categoryLabel: "Sarees", section: "ethnic" },
  "ethnic/lehengas": { categoryLabel: "Lehengas", section: "ethnic" },
  "ethnic/indo-western": { categoryLabel: "Indo Western", section: "ethnic" },
  "ethnic/salwar-suits": { categoryLabel: "Salwar Suits", section: "ethnic" },
  "ethnic/kurtis": { categoryLabel: "Kurtis & Sets", section: "ethnic" },
  "ethnic/anarkalis": { categoryLabel: "Anarkalis", section: "ethnic" },
  "ethnic/lehenga-saree": { categoryLabel: "Lehenga Saree", section: "ethnic" },
  "ethnic/heavy-gowns": { categoryLabel: "Heavy Gowns", section: "ethnic" },
  "ethnic/mehndi-outfits": { categoryLabel: "Mehndi Outfits", section: "ethnic" },
  "ethnic/haldi-outfits": { categoryLabel: "Haldi Outfits", section: "ethnic" },

  bridal: { categoryLabel: "Bridal Specials", section: "bridal" },
  "bridal-special": { categoryLabel: "Bridal Specials", section: "bridal" },
  "bridal-specials": { categoryLabel: "Bridal Specials", section: "bridal" },
  "bridal/bridal-lehengas": { categoryLabel: "Bridal Lehengas", section: "bridal" },
  "bridal/engagement-gowns": { categoryLabel: "Engagement Gowns", section: "bridal" },
  "bridal/reception-gowns": { categoryLabel: "Reception Gowns", section: "bridal" },
  "bridal/reception-gown-saree": { categoryLabel: "Reception Gown Saree", section: "bridal" },
  "bridal/mehndi-haldi": { categoryLabel: "Mehndi & Haldi Outfits", section: "bridal" },
  "bridal/sangeet-outfits": { categoryLabel: "Sangeet Dresses", section: "bridal" },
  "bridal/bridal-sarees": { categoryLabel: "Bridal Sarees", section: "bridal" },
  "bridal/poshak": { categoryLabel: "Rajasthani Poshak", section: "bridal" },

  
};

function resolveSubpageConfig(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return null;
  }

  const fullPath = slug.join("/").toLowerCase();
  const topLevel = slug[0].toLowerCase();

  return SUBPAGE_CATEGORY_LABELS[fullPath] ?? SUBPAGE_CATEGORY_LABELS[topLevel] ?? null;
}

function buildRentalsHref(config: SubpageConfig, rawParams: Record<string, string | string[] | undefined>) {
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "category" || key === "section") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        next.append(key, item);
      }
      continue;
    }

    if (value) {
      next.append(key, value);
    }
  }

  next.set("category", config.categoryLabel);
  next.set("section", config.section);

  const query = next.toString();
  return query ? `/rentals?${query}` : "/rentals";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = resolveSubpageConfig(slug);

  if (!config) {
    return { title: "Category Not Found | noorat" };
  }

  return {
    title: `${config.categoryLabel} Rentals | noorat`,
    description: `Browse ${config.categoryLabel.toLowerCase()} on noorat rentals with the same filters and listing layout as the main rentals page.`,
  };
}

export default async function CategoriesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const config = resolveSubpageConfig(slug);

  if (!config) {
    notFound();
  }

  permanentRedirect(buildRentalsHref(config, rawParams));
}
