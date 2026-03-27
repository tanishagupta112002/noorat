import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;

  // ✅ allow onboarding always
  if (pathname.startsWith("/become-a-provider/onboarding")) {
    return NextResponse.next();
  }

  // ❌ REMOVE this (signup logic confusion)
  // if (pathname.startsWith("/become-a-provider/signup")) return NextResponse.next();

  if (pathname.startsWith("/become-a-provider")) {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      url.pathname = "/auth";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/become-a-provider/:path*"],
};