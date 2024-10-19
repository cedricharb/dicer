import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/utils/supabase/server";

// List of paths that require authentication
const protectedPaths = ["/dice-sets", "/dice-tracker", "/profile", "/settings"];

// List of known paths (including public ones)
const knownPaths = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  ...protectedPaths,
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession();

  const path = req.nextUrl.pathname;

  // Check if the current path is in the list of protected paths
  const isProtectedPath = protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  // Check if the current path is a known path
  const isKnownPath = knownPaths.some((knownPath) =>
    path.startsWith(knownPath)
  );

  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Redirect authenticated users to /dice-sets if they try to access the root path
  if (session && path === "/") {
    return NextResponse.redirect(new URL("/dice-sets", req.url));
  }

  // Redirect to root for unknown paths
  if (!isKnownPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
