// ============================================================
// AstroVault — Next.js Middleware
// Request-level enforcement: role validation, access control,
// rate limiting, request ID injection, and Clerk Auth
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// --- Simple in-memory rate limiter ---
const rateBuckets: Map<string, { count: number; resetAt: number }> = new Map();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  RED: { max: 20, windowMs: 60000 },
  BLUE: { max: 60, windowMs: 60000 },
  SYSTEM: { max: 120, windowMs: 60000 },
};

// Protected API paths and their allowed roles
const ROUTE_ACCESS: Record<string, string[]> = {
  "/api/gateway/submit": ["RED", "SYSTEM"],
  "/api/threat/analyze": ["RED", "SYSTEM"],
  "/api/threat/logs": ["BLUE", "SYSTEM"],
  "/api/audit": ["BLUE", "SYSTEM"],
  "/api/audit/verify": ["BLUE", "SYSTEM"],
  "/api/llm": ["SYSTEM"],
};

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/red-team(.*)',
  '/blue-team(.*)',
  '/audit(.*)',
  '/sessions(.*)',
  '/threats(.*)',
  '/system(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Enforce Clerk Authentication on dashboard routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const { pathname } = request.nextUrl;

  // Only apply custom logic to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip health and events (public endpoints)
  if (pathname === "/api/health" || pathname === "/api/events" || pathname === "/api/gateway") {
    return NextResponse.next();
  }

  // --- Role Extraction ---
  const role = (request.headers.get("x-team-role") || "SYSTEM").toUpperCase();
  if (!["RED", "BLUE", "SYSTEM"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be RED, BLUE, or SYSTEM." },
      { status: 400 }
    );
  }

  // --- Access Control ---
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          {
            error: `Access denied. Role ${role} cannot access ${pathname}.`,
            code: "ROLE_ACCESS_DENIED",
          },
          { status: 403 }
        );
      }
      break;
    }
  }

  // --- Rate Limiting ---
  const bucketKey = `${role}:${request.headers.get("x-forwarded-for") || "local"}`;
  const now = Date.now();
  const limit = RATE_LIMITS[role] || RATE_LIMITS.SYSTEM;

  let bucket = rateBuckets.get(bucketKey);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
    rateBuckets.set(bucketKey, bucket);
  }

  bucket.count++;
  if (bucket.count > limit.max) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // --- Request ID Injection ---
  const requestId = `REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-team-role", role);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
