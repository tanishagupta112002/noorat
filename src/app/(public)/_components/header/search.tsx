// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Search as SearchIcon } from "lucide-react";

// export default function Search() {
//   return (
//     <div className="w-full max-w-7xl mx-auto flex flex-row items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 shadow-md">

//       {/* Search Input */}
//       <div className="flex-1 w-full">
//         <Input
//           type="text"
//           placeholder="Search outfits or describe your design..."
//           className="h-10 rounded-lg border-primary focus:ring-1 focus:ring-primary text-sm bg-accent-foreground"
//         />
//       </div>

//       {/* Occasion */}
//       <div className="w-full sm:w-40 ">
//         <Select>
//           <SelectTrigger className="h-10 rounded-lg text-sm border-primary bg-accent-foreground">
//             <SelectValue placeholder="Occasion" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Wedding">Wedding</SelectItem>
//             <SelectItem value="Haldi">Haldi</SelectItem>
//             <SelectItem value="Mehndi">Mehndi</SelectItem>
//             <SelectItem value="Sangeet">Sangeet</SelectItem>
//             <SelectItem value="Cocktail">Cocktail</SelectItem>
//             <SelectItem value="Birthday">Birthday</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Category */}
//       <div className="w-full sm:w-40">
//         <Select>
//           <SelectTrigger className="h-10 rounded-lg text-sm border-primary bg-accent-foreground">
//             <SelectValue placeholder="Category" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Casual">Casual</SelectItem>
//             <SelectItem value="Ethnic">Ethnic</SelectItem>
//             <SelectItem value="Western">Western</SelectItem>
//             <SelectItem value="Bridal">Bridal</SelectItem>
//             <SelectItem value="Gown">Gown</SelectItem>
//             <SelectItem value="Saree">Saree</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Search Button */}
//       <Button
//         size="sm"
//         className="h-10 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg"
//       >
//         <SearchIcon className="w-4 h-4" />
//       </Button>

//     </div>
//   );
// }



"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Camera } from "lucide-react";

export default function Search() {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // camera click -> open file picker
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // when image selected
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected image:", file);

    // yaha API call ya AI image search laga sakti ho
  };

  return (
    <div
      className="
      w-full max-w-7xl mx-auto 
      flex flex-row items-center gap-1.5  
      rounded-xl border border-border bg-background 
      px-1.5 py-2 sm:px-2 md:px-3 lg:px-4 shadow-md
    "
    >
      {/* Search Input */}
      <div className="flex-1 min-w-30 relative">

        <Input
          type="text"
          placeholder="Search outfits or describe your design..."
          className="h-9 sm:h-10 rounded-lg border-primary focus:ring-1 focus:ring-primary text-sm bg-accent-foreground pr-10"
        />

        {/* hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* camera icon */}
        <button
          type="button"
          onClick={handleCameraClick}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <Camera className="w-6 h-6" />
        </button>

      </div>

      {/* Search Button */}
      <Button
        size="sm"
        className="h-9 sm:h-10 px-2.5 sm:px-3 md:px-4 bg-primary hover:bg-primary/90 text-white rounded-lg shrink-0"
      >
        <SearchIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}