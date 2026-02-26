import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname === "/login") {
      return Response.redirect(new URL("/home", req.nextUrl));
    }
    return;
  }

  // Protected routes — redirect to login if not authed
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // Root redirect
  if (pathname === "/") {
    return Response.redirect(new URL("/home", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
