// // src/components/layout/PublicNavbar.tsx
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import { Menu, X, Search, ChevronDown } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
//   SheetHeader,
//   SheetTitle,
//   SheetDescription,
// } from "@/components/ui/sheet";
// import {
//   NavigationMenu,
//   NavigationMenuContent,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger,
//   navigationMenuTriggerStyle,
// } from "@/components/ui/navigation-menu";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { cn } from "@/lib/utils";

// // ── Nav Items ────────────────────────────────────────────────────────────────
// const homeDropdown = [
//   { href: "/", label: "Home" },
//   { href: "/featured", label: "Featured Rentals", badge: "New" },
//   { href: "/trending", label: "Trending Outfits" },
//   { href: "/ai-preview", label: "Try AI Preview", badge: "Free" },
// ];

// const rentalsDropdown = [
//   {
//     category: "Western Wear",
//     items: [
//       { href: "/rentals/western/dresses", label: "Dresses" },
//       { href: "/rentals/western/tops", label: "Tops & Blouses" },
//       { href: "/rentals/western/skirts", label: "Skirts" },
//       { href: "/rentals/western/jumpsuits", label: "Jumpsuits" },
//     ],
//   },
//   {
//     category: "Traditional Wear",
//     items: [
//       { href: "/rentals/ethnic/sarees", label: "Sarees" },
//       { href: "/rentals/ethnic/lehengas", label: "Lehengas" },
//       { href: "/rentals/ethnic/salwar-suits", label: "Salwar Suits" },
//       { href: "/rentals/ethnic/kurtis", label: "Kurtis" },
//     ],
//   },
//   {
//     category: "Other Favorites",
//     items: [
//       { href: "/rentals/party-wear", label: "Party Wear" },
//       { href: "/rentals/casual", label: "Casual" },
//       { href: "/rentals/kids", label: "Kids Wear" },
//       { href: "/rentals/accessories", label: "Accessories" },
//     ],
//   },
// ];

// const customDropdown = [
//   {
//     href: "/custom-requests",
//     label: "Create Custom Request",
//     badge: "AI Powered",
//   },
//   { href: "/custom-requests/how-it-works", label: "How Custom Works" },
//   { href: "/custom-requests/pricing", label: "Pricing & Timeline" },
// ];

// const exploreDropdown = [
//   { href: "/sustainability", label: "Why Rent? Save Money & Planet" },
//   { href: "/how-it-works", label: "How TaniTwirl Works" },
//   { href: "/faq", label: "FAQ" },
//   { href: "/contact", label: "Contact Us" },
// ];

// // ── Component ────────────────────────────────────────────────────────────────
// export function Navbar() {
//   const pathname = usePathname();
//   const [sheetOpen, setSheetOpen] = useState(false);

//   const isActive = (href: string) =>
//     pathname === href ||
//     pathname.startsWith(href + "/") ||
//     pathname.startsWith(href);

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-950/70">
//       <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
//         {/* Logo */}
//         <div className="flex items-center gap-3">
//           <Link href="/">
//             <Image
//               src="/images/logo.png"
//               alt="TaniTwirl Logo"
//               width={48}
//               height={48}
//               priority
//               className="object-contain"
//             />
//           </Link>
//           <Link
//             href="/"
//             className="font-bold text-xl md:text-2xl text-gray-900 dark:text-white"
//           >
//             TaniTwirl
//           </Link>
//         </div>

//         {/* Desktop Navigation */}
//         <NavigationMenu className="hidden md:flex flex-1 justify-center mx-8">
//           <NavigationMenuList className="gap-1 lg:gap-4">
//             {/* Home */}
//             <NavigationMenuItem>
//               <NavigationMenu>
//                 <NavigationMenuTrigger
//                   className={cn(
//                     navigationMenuTriggerStyle(),
//                     "text-base px-4 py-2",
//                   )}
//                 >
//                   Home
//                 </NavigationMenuTrigger>
//                 <NavigationMenuContent className="origin-top-left min-w-[220px]">
//                   <ul className="grid gap-1 p-3">
//                     {homeDropdown.map((item) => (
//                       <li key={item.href}>
//                         <NavigationMenuLink asChild>
//                           <Link
//                             href={item.href}
//                             className={cn(
//                               "block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//                               isActive(item.href) &&
//                                 "bg-accent text-accent-foreground",
//                             )}
//                           >
//                             <div className="flex items-center justify-between">
//                               {item.label}
//                               {item.badge && (
//                                 <Badge
//                                   variant="secondary"
//                                   className="ml-2 text-xs"
//                                 >
//                                   {item.badge}
//                                 </Badge>
//                               )}
//                             </div>
//                           </Link>
//                         </NavigationMenuLink>
//                       </li>
//                     ))}
//                   </ul>
//                 </NavigationMenuContent>
//               </NavigationMenu>
//             </NavigationMenuItem>

//             {/* Rentals */}
//             <NavigationMenuItem>
//               <NavigationMenu>
//                 <NavigationMenuTrigger
//                   className={cn(
//                     navigationMenuTriggerStyle(),
//                     "text-base px-4 py-2",
//                   )}
//                 >
//                   Rentals
//                 </NavigationMenuTrigger>
//                 <NavigationMenuContent className="origin-top-left min-w-[700px] lg:min-w-[900px]">
//                   <div className="grid grid-cols-3 gap-6 p-6">
//                     {rentalsDropdown.map((group) => (
//                       <div key={group.category} className="space-y-3">
//                         <h4 className="font-medium text-base">
//                           {group.category}
//                         </h4>
//                         <ul className="space-y-1.5">
//                           {group.items.map((item) => (
//                             <li key={item.href}>
//                               <Link
//                                 href={item.href}
//                                 className={cn(
//                                   "block text-sm text-muted-foreground hover:text-foreground transition-colors",
//                                   isActive(item.href) &&
//                                     "text-foreground font-medium",
//                                 )}
//                               >
//                                 {item.label}
//                               </Link>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     ))}
//                   </div>
//                 </NavigationMenuContent>
//               </NavigationMenu>
//             </NavigationMenuItem>

//             {/* Custom */}
//             <NavigationMenuItem>
//               <NavigationMenu>
//                 <NavigationMenuTrigger
//                   className={cn(
//                     navigationMenuTriggerStyle(),
//                     "text-base px-4 py-2",
//                   )}
//                 >
//                   Custom
//                 </NavigationMenuTrigger>
//                 <NavigationMenuContent className="origin-top-left min-w-[280px]">
//                   <ul className="grid gap-1 p-3">
//                     {customDropdown.map((item) => (
//                       <li key={item.href}>
//                         <Link
//                           href={item.href}
//                           className={cn(
//                             "flex items-center justify-between select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//                             isActive(item.href) &&
//                               "bg-accent text-accent-foreground",
//                           )}
//                         >
//                           {item.label}
//                           {item.badge && (
//                             <Badge variant="secondary" className="ml-2 text-xs">
//                               {item.badge}
//                             </Badge>
//                           )}
//                         </Link>
//                       </li>
//                     ))}
//                   </ul>
//                 </NavigationMenuContent>
//               </NavigationMenu>
//             </NavigationMenuItem>

//             {/* Explore */}
//             <NavigationMenuItem>
//               <NavigationMenu>
//                 <NavigationMenuTrigger
//                   className={cn(
//                     navigationMenuTriggerStyle(),
//                     "text-base px-4 py-2",
//                   )}
//                 >
//                   Explore
//                 </NavigationMenuTrigger>
//                 <NavigationMenuContent className="origin-top-left min-w-[260px]">
//                   <ul className="grid gap-1 p-3">
//                     {exploreDropdown.map((item) => (
//                       <li key={item.href}>
//                         <Link
//                           href={item.href}
//                           className={cn(
//                             "block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
//                             isActive(item.href) &&
//                               "bg-accent text-accent-foreground",
//                           )}
//                         >
//                           {item.label}
//                         </Link>
//                       </li>
//                     ))}
//                   </ul>
//                 </NavigationMenuContent>
//               </NavigationMenu>
//             </NavigationMenuItem>
//           </NavigationMenuList>
//         </NavigationMenu>

//         {/* Right side – Auth + Search */}
//         <div className="hidden md:flex items-center gap-4">
//           <div className="relative w-64 lg:w-80">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input
//               placeholder="Search outfits or describe your design..."
//               className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/50"
//             />
//           </div>

//           <Button
//             variant="outline"
//             size="sm"
//             asChild
//             className="border-primary/30 hover:border-primary"
//           >
//             <Link href="/sign-in">Sign In</Link>
//           </Button>
//           <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
//             <Link href="/sign-up">Get Started</Link>
//           </Button>
//         </div>

//         {/* Mobile Menu Trigger */}
//         <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
//           <SheetTrigger asChild className="md:hidden">
//             <Button
//               variant="ghost"
//               size="icon"
//               aria-label="Open navigation menu"
//             >
//               <Menu className="h-6 w-6" />
//             </Button>
//           </SheetTrigger>

//           <SheetContent
//             side="left"
//             className="w-[85vw] max-w-sm p-0 border-r bg-background [&>button]:hidden" // default X hide
//           >
//             <div className="flex h-full flex-col">
//               {/* Header */}
//               <div className="flex items-center justify-between border-b px-6 py-5">
//                 <Link
//                   href="/"
//                   className="flex items-center gap-2.5"
//                   onClick={() => setSheetOpen(false)}
//                 >
//                   <Image
//                     src="/images/logo.png"
//                     alt="TaniTwirl Logo"
//                     width={40}
//                     height={40}
//                     className="object-contain"
//                   />
//                   <span className="text-2xl font-bold tracking-tight text-foreground">
//                     TaniTwirl
//                   </span>
//                 </Link>

//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   onClick={() => setSheetOpen(false)}
//                   aria-label="Close menu"
//                 >
//                   <X className="h-6 w-6" />
//                 </Button>
//               </div>

//               {/* Mobile Nav – Sirf 4 main headings, sab collapsible */}
//               <nav className="flex-1 overflow-y-auto px-6 py-8">
//                 {/* Home */}
//                 <div className="mb-6">
//                   {(() => {
//                     const [isOpen, setIsOpen] = useState(false);
//                     return (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setIsOpen(!isOpen)}
//                           className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors"
//                         >
//                           Home
//                           <ChevronDown
//                             className={cn(
//                               "h-5 w-5 transition-transform",
//                               isOpen && "rotate-180",
//                             )}
//                           />
//                         </button>

//                         {isOpen && (
//                           <div className="mt-2 space-y-1 pl-4">
//                             {homeDropdown.map((item) => (
//                               <Link
//                                 key={item.href}
//                                 href={item.href}
//                                 className={cn(
//                                   "flex items-center justify-between py-3 px-4 rounded-lg text-sm transition-colors hover:bg-accent/70",
//                                   isActive(item.href) &&
//                                     "bg-accent/50 font-medium text-foreground",
//                                 )}
//                                 onClick={() => setSheetOpen(false)}
//                               >
//                                 {item.label}
//                                 {item.badge && (
//                                   <Badge
//                                     variant="secondary"
//                                     className="text-xs"
//                                   >
//                                     {item.badge}
//                                   </Badge>
//                                 )}
//                               </Link>
//                             ))}
//                           </div>
//                         )}
//                       </>
//                     );
//                   })()}
//                 </div>

//                 {/* Rentals */}
//                 <div className="mb-6">
//                   {(() => {
//                     const [isOpen, setIsOpen] = useState(false);
//                     return (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setIsOpen(!isOpen)}
//                           className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors"
//                         >
//                           Rentals
//                           <ChevronDown
//                             className={cn(
//                               "h-5 w-5 transition-transform",
//                               isOpen && "rotate-180",
//                             )}
//                           />
//                         </button>

//                         {isOpen && (
//                           <div className="mt-3 space-y-6 pl-2">
//                             {rentalsDropdown.map((group) => (
//                               <div key={group.category}>
//                                 <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                                   {group.category}
//                                 </p>
//                                 <div className="space-y-1">
//                                   {group.items.map((item) => (
//                                     <Link
//                                       key={item.href}
//                                       href={item.href}
//                                       className={cn(
//                                         "block py-3 px-5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground",
//                                         isActive(item.href) &&
//                                           "bg-accent/50 text-foreground font-medium",
//                                       )}
//                                       onClick={() => setSheetOpen(false)}
//                                     >
//                                       {item.label}
//                                     </Link>
//                                   ))}
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </>
//                     );
//                   })()}
//                 </div>

//                 {/* Custom */}
//                 <div className="mb-6">
//                   {(() => {
//                     const [isOpen, setIsOpen] = useState(false);
//                     return (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setIsOpen(!isOpen)}
//                           className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors"
//                         >
//                           Custom
//                           <ChevronDown
//                             className={cn(
//                               "h-5 w-5 transition-transform",
//                               isOpen && "rotate-180",
//                             )}
//                           />
//                         </button>

//                         {isOpen && (
//                           <div className="mt-2 space-y-1 pl-4">
//                             {customDropdown.map((item) => (
//                               <Link
//                                 key={item.href}
//                                 href={item.href}
//                                 className={cn(
//                                   "flex items-center justify-between py-3 px-4 rounded-lg text-sm transition-colors hover:bg-accent/70",
//                                   isActive(item.href) &&
//                                     "bg-accent/50 font-medium text-foreground",
//                                 )}
//                                 onClick={() => setSheetOpen(false)}
//                               >
//                                 {item.label}
//                                 {item.badge && (
//                                   <Badge
//                                     variant="secondary"
//                                     className="text-xs"
//                                   >
//                                     {item.badge}
//                                   </Badge>
//                                 )}
//                               </Link>
//                             ))}
//                           </div>
//                         )}
//                       </>
//                     );
//                   })()}
//                 </div>

//                 {/* Explore */}
//                 <div className="mb-6">
//                   {(() => {
//                     const [isOpen, setIsOpen] = useState(false);
//                     return (
//                       <>
//                         <button
//                           type="button"
//                           onClick={() => setIsOpen(!isOpen)}
//                           className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors"
//                         >
//                           Explore
//                           <ChevronDown
//                             className={cn(
//                               "h-5 w-5 transition-transform",
//                               isOpen && "rotate-180",
//                             )}
//                           />
//                         </button>

//                         {isOpen && (
//                           <div className="mt-2 space-y-1 pl-4">
//                             {exploreDropdown.map((item) => (
//                               <Link
//                                 key={item.href}
//                                 href={item.href}
//                                 className={cn(
//                                   "block py-3 px-4 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground",
//                                   isActive(item.href) &&
//                                     "bg-accent/50 text-foreground font-medium",
//                                 )}
//                                 onClick={() => setSheetOpen(false)}
//                               >
//                                 {item.label}
//                               </Link>
//                             ))}
//                           </div>
//                         )}
//                       </>
//                     );
//                   })()}
//                 </div>
//               </nav>

//               {/* Auth Buttons */}
//               <div className="border-t px-6 py-8 mt-auto space-y-4 bg-muted/30">
//                 <Button
//                   variant="outline"
//                   className="w-full justify-center"
//                   asChild
//                   onClick={() => setSheetOpen(false)}
//                 >
//                   <Link href="/sign-in">Sign In</Link>
//                 </Button>
//                 <Button
//                   className="w-full justify-center"
//                   asChild
//                   onClick={() => setSheetOpen(false)}
//                 >
//                   <Link href="/sign-up">Create Free Account</Link>
//                 </Button>
//               </div>
//             </div>
//           </SheetContent>
//         </Sheet>
//       </div>
//     </header>
//   );
// }


// src/components/layout/header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Search, User, ShoppingBag, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { MobileMenu } from "./mobile-menu";
import { isActive } from "./nav-config";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      {/* Top Bar - Social Media Icons */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-end">
            <div className="flex items-center gap-4">
              {/* TODO: Replace with actual Instagram profile URL */}
              <Link 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 stroke-[1.5px]" />
              </Link>
              {/* TODO: Replace with actual Facebook profile URL */}
              <Link 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 stroke-[1.5px]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Row - Search, Logo, Icons */}
      <div className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Left: Mobile Menu + Search Icon */}
            <div className="flex items-center gap-2">
              <MobileMenu />
              {/* TODO: Implement search functionality */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hidden md:flex"
                aria-label="Search"
                disabled
              >
                <Search className="h-5 w-5 stroke-[1.5px]" />
              </Button>
            </div>

            {/* Center: Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo />
            </div>

            {/* Right: User and Shopping Bag Icons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                asChild
                aria-label="Account"
              >
                <Link href="/sign-in">
                  <User className="h-5 w-5 stroke-[1.5px]" />
                </Link>
              </Button>
              {/* TODO: Implement shopping cart functionality */}
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Shopping bag"
                disabled
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Row - Centered Links */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <NavLinks isActive={(href) => isActive(pathname, href)} />
        </div>
      </div>
    </header>
  );
}