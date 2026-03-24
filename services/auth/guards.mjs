export function decideProtectedRouteRedirect(pathname, session) {
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/workflows") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/settings");

  if (!requiresAuth) {
    return { allow: true, redirectTo: null };
  }

  if (!session) {
    return { allow: false, redirectTo: "/login" };
  }

  if (!session.workspaceId || !session.onboardingComplete) {
    return { allow: false, redirectTo: "/onboarding" };
  }

  return { allow: true, redirectTo: null };
}

export function decideAuthPageRedirect(pathname, session) {
  const isAuthPage = pathname === "/login" || pathname === "/onboarding";
  if (!isAuthPage || !session) {
    return { allow: true, redirectTo: null };
  }

  if (!session.workspaceId || !session.onboardingComplete) {
    return pathname === "/onboarding" ? { allow: true, redirectTo: null } : { allow: false, redirectTo: "/onboarding" };
  }

  return { allow: false, redirectTo: "/dashboard" };
}
