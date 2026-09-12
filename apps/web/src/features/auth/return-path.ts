/** A return path is only navigation. The server still authorizes every resource. */
export function safeReturnPath(
  input: string | null,
  projectIds: readonly string[],
): string | null {
  const fallback = projectIds[0]
    ? `/projects/${encodeURIComponent(projectIds[0])}`
    : null;
  if (
    !input ||
    !input.startsWith("/projects/") ||
    input.includes("\\") ||
    /[\u0000-\u001f]/.test(input)
  )
    return fallback;
  try {
    const url = new URL(input, "https://ground.invalid");
    const project = url.pathname.split("/")[2];
    if (
      url.origin !== "https://ground.invalid" ||
      !project ||
      !projectIds.includes(decodeURIComponent(project))
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
