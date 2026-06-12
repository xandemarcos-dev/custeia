import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rotas públicas (acessíveis sem login).
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // exige login em todo o resto
  }
});

export const config = {
  matcher: [
    // Pula arquivos internos do Next e estáticos, exceto se vierem em query.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|txt|xml|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre roda em rotas de API.
    "/(api|trpc)(.*)",
    // Sempre roda nas rotas internas do Clerk.
    "/__clerk/(.*)",
  ],
};
