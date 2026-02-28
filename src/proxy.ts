import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (isLoggedIn && pathname === "/login") {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      const target = callbackUrl?.startsWith("/") ? callbackUrl : "/home";
      return Response.redirect(new URL(target, req.nextUrl));
    }
    return;
  }

  // Protected routes — redirect to login if not authed
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    if (pathname.startsWith("/")) {
      loginUrl.searchParams.set("callbackUrl", pathname);
    }
    return Response.redirect(loginUrl);
  }

  // Root redirect
  if (pathname === "/") {
    return Response.redirect(new URL("/home", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|robots\\.txt|og-image\\.png).*)",
  ],
};
