/** Render a small accessible notice without coupling components to the app. */
export function notice(message, kind = "info") {
  const element = document.createElement("p");
  element.className = `notice notice-${kind}`;
  element.setAttribute("role", "status");
  element.textContent = message;
  return element;
}
