// import Image from "next/image";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
//   CardFooter,
// } from "@/components/ui/card";

// // Placeholder data – in real app you would fetch this from DB / API
// const featuredRentals = [
//   {
//     id: 1,
//     title: "Royal Red Lehenga",
//     description: "Heavy embroidery with zari work",
//     price: "₹2,499 / 4 days",
//     image: "/images/rentals/royal-red-lehenga.jpg", // ← add real paths later
//   },
//   {
//     id: 2,
//     title: "Pastel Anarkali",
//     description: "Light & elegant pastel tones",
//     price: "₹1,799 / 3 days",
//     image: "/images/rentals/pastel-anarkali.jpg",
//   },
//   {
//     id: 3,
//     title: "Golden Saree Set",
//     description: "Party-ready with blouse & accessories",
//     price: "₹1,499 / 5 days",
//     image: "/images/rentals/golden-saree-set.jpg",
//   },
// ];

// export default function Home() {
//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Hero Section */}
//       <section className="relative  bg-gradient-to-br from-background to-accent/10 py-16 md:py-24 lg:py-32 overflow-hidden">
//         <div className="container mx-auto px-4 relative z-10">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
//             {/* Left – Text + CTA */}
//             <div className="text-center lg:text-left space-y-8">
//               <div className="mb-6 flex justify-center lg:justify-start">
//                 <Image
//                   src="/images/logo.png"
//                   alt="TaniTwirl Logo"
//                   width={140}
//                   height={140}
//                   priority
//                   className=" object-contain  "
//                 />
//               </div>

//               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
//                 Rent Designer Ethnic Wear
//                 <br />
//                 <span className="text-primary">Affordably & Stylishly</span>
//               </h1>

//               <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
//                 Premium lehengas, sarees, anarkalis & more — delivered to your
//                 doorstep in Dabra and nearby cities.
//               </p>

//               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8">
//                 <Button asChild size="lg" className="text-lg px-8 py-6">
//                   <Link href="/rentals">Browse Rentals</Link>
//                 </Button>
//                 <Button
//                   asChild
//                   variant="outline"
//                   size="lg"
//                   className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10"
//                 >
//                   <Link href="/custom-requests">Custom Request</Link>
//                 </Button>
//               </div>

//               <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
//                 <div className="flex items-center gap-2">
//                   <span className="text-primary">✓</span> Free Delivery
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-primary">✓</span> Easy Returns
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="text-primary">✓</span> Verified Tailors
//                 </div>
//               </div>
//             </div>

//             {/* Right – Hero Image */}
//             <div className="relative  overflow-hidden  w-full h-[600px]">
//               <Image
//                 src="/images/heroin.png"
//                 alt="..."
//                 fill
//                 className="object-cover"
//                 priority
//               />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Featured Rentals */}
//       <section className="py-16 md:py-24 bg-background">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl md:text-4xl font-bold mb-4">
//               Featured Rentals
//             </h2>
//             <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//               Popular picks loved by our customers this wedding season
//             </p>
//           </div>

//           <div className="text-center mt-12">
//             <Button asChild variant="outline" size="lg">
//               <Link href="/rentals">View All Rentals →</Link>
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/* Final CTA */}
//       <section className="py-16 bg-primary/5">
//         <div className="container mx-auto px-4 text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">
//             Ready to Twirl?
//           </h2>
//           <p className="text-lg mb-8 max-w-2xl mx-auto">
//             Join hundreds of happy customers renting designer wear without
//             breaking the bank.
//           </p>
//           <Button size="lg" asChild>
//             <Link href="/sign-up">Get Started →</Link>
//           </Button>
//         </div>
//       </section>
//     </div>
//   );
// }


// app/page.tsx (ya app/home/page.tsx agar route group use kar rahe ho)
import Home from "./_components/home/home";

export default function HomePage() {
  return <Home />;
}

// Optional: Metadata for SEO
export const metadata = {
  title: "TaniTwirl - Rent Designer Ethnic Wear Affordably",
  description: "Premium lehengas, sarees, anarkalis & more with doorstep delivery in Dabra.",
};