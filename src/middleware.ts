import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isOnLoginPage = pathname.startsWith("/login");
  const isOnApiAuth = pathname.startsWith("/api/auth");

  if (isOnApiAuth) return;

  if (!isLoggedIn && !isOnLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isOnLoginPage) {
    return Response.redirect(new URL("/ai-chat", req.nextUrl));
  }

  // 어드민 페이지 접근 제어
  if (isLoggedIn && pathname.startsWith("/admin")) {
    const role = (req.auth as any)?.user?.role;
    if (role !== "ADMIN") {
      return Response.redirect(new URL("/ai-chat", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
