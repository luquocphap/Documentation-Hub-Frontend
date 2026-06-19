const WORKSPACE_PATH_PATTERN = /^\/workspaces\/[^/?#]+(?:[/?#].*)?$/;

export function normalizeWorkspaceRedirect(
  value: string | null | undefined
): string | undefined {
  if (!value || value.startsWith("//")) {
    return undefined;
  }

  return WORKSPACE_PATH_PATTERN.test(value)
    ? value
    : undefined;
}

export function buildWorkspaceRedirectQuery(
  redirectTo: string | undefined
): string {
  if (!redirectTo) {
    return "";
  }

  return `?${new URLSearchParams({ redirectTo }).toString()}`;
}
