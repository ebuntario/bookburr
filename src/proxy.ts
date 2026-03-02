import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes (join preview is public so unauthenticated users see session info)
  const isJoinPreview = /^\/sessions\/[^/]+\/join$/.test(pathname);
  if (pathname === "/login" || pathname.startsWith("/api/auth") || isJoinPreview) {
    if (isLoggedIn && pathname === "/login" && !isJoinPreview) {
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|brand|robots\\.txt|og-image\\.png).*)",
  ],
};
