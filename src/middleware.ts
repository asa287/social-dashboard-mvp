
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// Trigger Vercel rebuild with new env vars

export default clerkMiddleware(async (auth, req) => {
    const { userId, redirectToSignIn } = await auth();
    if (!userId && isProtectedRoute(req)) {
        return redirectToSignIn();
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
