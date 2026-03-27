// app/page.tsx (ya app/home/page.tsx agar route group use kar rahe ho)
import Home from "./_components/home/home";

export default function HomePage() {
  return <Home />;
}

// Optional: Metadata for SEO
export const metadata = {
  title: "Noorat - Rent Designer Ethnic Wear Affordably",
  description: "Premium lehengas, sarees, anarkalis & more with doorstep delivery in Dabra.",
};