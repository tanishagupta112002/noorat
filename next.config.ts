import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "25mb",
		},
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-accordion",
			"@radix-ui/react-alert-dialog",
			"@radix-ui/react-avatar",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-label",
			"@radix-ui/react-progress",
			"@radix-ui/react-select",
			"@radix-ui/react-separator",
			"@radix-ui/react-slot",
			"sonner",
		],
	},

	images: {
		remotePatterns: [
			// Vercel Blob storage – all stores (correct domain)
			{
				protocol: "https",
				hostname: "*.public.blob.vercel-storage.com",
			},
			// Vercel Blob CDN alias
			{
				protocol: "https",
				hostname: "public.blob.vercel-storage.com",
			},
			// Production app URL (covers same-origin absolute URLs in seeded data)
			{
				protocol: "https",
				hostname: "noorat-two.vercel.app",
			},
			// Any *.vercel.app preview deployments
			{
				protocol: "https",
				hostname: "*.vercel.app",
			},
		],
	},
};

export default nextConfig;
