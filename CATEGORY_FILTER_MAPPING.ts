/**
 * STRICT CATEGORY FILTER MAPPING
 * 
 * This file defines EXACTLY what gets shown when a user selects a filter.
 * NO cross-matching, NO siblings, NO generic expansion.
 * 
 * Format:
 * "Selected Label": ["listing category 1", "listing category 2", ...]
 */

export const STRICT_CATEGORY_MAPPING: Record<string, string[]> = {
  // ========== WESTERN WEAR ==========
  
  // Generic - shows ALL western subcategories
  "Western Wear": ["Western Wear", "Dresses", "Frock Dresses", "Bodycon Dresses", "Gowns", "Slit Gowns", "Cape Gowns", "Western Saree Dresses", "Maxi Dresses", "Mini Dresses", "Mermaid Gowns", "Celebrity Styles"],
  
  // Parent categories - show only their direct children
  "Dresses": ["Dresses", "Frock Dresses", "Bodycon Dresses", "Western Saree Dresses", "Maxi Dresses", "Mini Dresses"],
  "Gowns": ["Gowns", "Slit Gowns", "Cape Gowns", "Mermaid Gowns","Engagement Gowns", "Reception Gowns"],
  
  // Specific categories - show ONLY listings with exact label
  "Frock Dresses": ["Frock Dresses"],
  "Bodycon Dresses": ["Bodycon Dresses","Cape Gowns"],
  "Slit Gowns": ["Slit Gowns"],
  "Cape Gowns": ["Cape Gowns"],
  "Western Saree Dresses": ["Western Saree Dresses", "Sarees","Bridal Sarees","Lehenga Saree"],
  "Maxi Dresses": ["Maxi Dresses","Dresses","Bodycon Dresses","Frock Dresses","Mermaid Gowns"],
  "Mini Dresses": ["Mini Dresses"],
  "Mermaid Gowns": ["Mermaid Gowns"],
  "Celebrity Styles": ["Celebrity Styles","Dresses","Gowns","Western Saree Dresses","Maxi Dresses","Mini Dresses","Mermaid Gowns","Slit Gowns","Cape Gowns","Frock Dresses","Bodycon Dresses", "Engagement Gowns", "Reception Gowns","Bridal Sarees","Lehenga Saree"],

  // ========== ETHNIC WEAR ==========
  
  // Generic
  "Traditional Wear": ["Traditional Wear", "Sarees", "Lehengas", "Indo Western", "Salwar Suits", "Kurtis & Sets", "Anarkalis", "Lehenga Saree", "Heavy Gowns", "Mehndi Outfits", "Haldi Outfits"],
  
  // Parent categories
  "Sarees": ["Sarees", "Lehenga Saree","Western Saree Dresses","Bridal Sarees","Reception Saree"],
  "Lehengas": ["Lehengas", "Lehenga Saree"],
  
  // Specific
  "Indo Western": ["Indo Western"],
  "Salwar Suits": ["Salwar Suits"],
  "Kurtis & Sets": ["Kurtis & Sets"],
  "Anarkalis": ["Anarkalis"],
  "Lehenga Saree": ["Lehenga Saree","Western Saree Dresses"],
  "Heavy Gowns": ["Heavy Gowns","Reception Gowns","Engagement Gowns"],
  "Mehndi Outfits": ["Mehndi Outfits"],
  "Haldi Outfits": ["Haldi Outfits"],

  // ========== BRIDAL WEAR ==========
  
  // Generic
  "Bridal Specials": ["Bridal Specials", "Bridal Lehengas", "Engagement Gowns", "Reception Gowns", "Reception Saree", "Mehndi & Haldi Outfits", "Sangeet Dresses", "Bridal Sarees", "Rajasthani Poshak","Traditional Wear", "Sarees", "Lehengas", "Indo Western", "Salwar Suits", "Kurtis & Sets", "Anarkalis", "Lehenga Saree", "Heavy Gowns", "Mehndi Outfits", "Haldi Outfits"],
  
  // Parent categories
  "Bridal Lehengas": ["Bridal Lehengas","Lehengas", "Lehenga Saree"],
  "Bridal Sarees": ["Bridal Sarees", "Sarees", "Lehenga Saree","Western Saree Dresses","Reception Saree"],
  
  // Specific
  "Engagement Gowns": ["Engagement Gowns","Heavy Gowns","Reception Gowns"],
  "Reception Gowns": ["Reception Gowns","Heavy Gowns","Engagement Gowns"],
  "Reception Saree": ["Reception Saree","Bridal Sarees","Sarees","Lehenga Saree","Western Saree Dresses"],
  "Mehndi & Haldi Outfits": ["Mehndi & Haldi Outfits","Mehndi Outfits","Haldi Outfits"],
  "Sangeet Dresses": ["Sangeet Dresses","Bridal Specials", "Bridal Lehengas", "Engagement Gowns", "Reception Gowns", "Reception Saree", "Mehndi & Haldi Outfits", "Sangeet Dresses", "Bridal Sarees", "Rajasthani Poshak","Traditional Wear", "Sarees", "Lehengas", "Indo Western", "Salwar Suits", "Kurtis & Sets", "Anarkalis", "Lehenga Saree", "Heavy Gowns", "Mehndi Outfits", "Haldi Outfits"],
  "Rajasthani Poshak": ["Rajasthani Poshak"],
};

/**
 * OCCASION-BASED COLOR RECOMMENDATIONS
 * 
 * Maps occasion categories to their traditional/preferred colors
 */
export const OCCASION_COLOR_RECOMMENDATIONS: Record<string, string[]> = {
  "Mehndi Outfits": [
    // Greens
    "Green", "Light Green", "Sea Green", "Lime Green", "Forest Green",
    "Sage Green", "Mint Green", "Emerald", "Olive", "Mint",
    // Oranges
    "Orange", "Burnt Orange",
    // Golds & Yellows
    "Gold", "Yellow", "Light Yellow", "Lemon Yellow", "Mustard",
  ],
  "Haldi Outfits": [
    // Yellows
    "Yellow", "Light Yellow", "Lemon Yellow", "Mustard",
    // Oranges
    "Orange", "Burnt Orange",
    // Golds
    "Gold",
  ],
  "Mehndi & Haldi Outfits": [
    // Greens
    "Green", "Light Green", "Sea Green", "Lime Green", "Forest Green",
    "Sage Green", "Mint Green", "Emerald", "Olive", "Mint",
    // Yellows
    "Yellow", "Light Yellow", "Lemon Yellow", "Mustard",
    // Oranges
    "Orange", "Burnt Orange",
    // Golds
    "Gold",
  ],
};

/**
 * Usage in filtering:
 * 
 * if (userSelectedLabel in STRICT_CATEGORY_MAPPING) {
 *   allowedCategories = STRICT_CATEGORY_MAPPING[userSelectedLabel];
 *   filteredListings = listings.filter(listing => 
 *     allowedCategories.includes(listing.category)
 *   );
 * }
 * 
 * For suggested colors on occasion pages:
 * if (userSelectedLabel in OCCASION_COLOR_RECOMMENDATIONS) {
 *   suggestedColors = OCCASION_COLOR_RECOMMENDATIONS[userSelectedLabel];
 *   // pre-highlight or pre-select these colors
 * }
 */
