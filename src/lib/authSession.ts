const AUTH_FLAG_KEY = "isLoggedIn";

export function hasAuthenticatedSession() {
  return localStorage.getItem(AUTH_FLAG_KEY) === "true";
}

export function markAuthenticatedSession() {
  localStorage.setItem(AUTH_FLAG_KEY, "true");
}

export function clearAuthenticatedSession() {
  localStorage.removeItem(AUTH_FLAG_KEY);
}
