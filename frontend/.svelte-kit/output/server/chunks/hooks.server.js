import { redirect } from "@sveltejs/kit";
const handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/dashboard")) {
    const sessionId = event.cookies.get("connect.sid");
    const allCookies = event.request.headers.get("cookie") || "";
    console.log("[HOOKS.SERVER] Dashboard access attempt");
    console.log("[HOOKS.SERVER] Session ID from cookies.get():", sessionId ? "EXISTS" : "MISSING");
    console.log("[HOOKS.SERVER] All cookies from header:", allCookies);
    console.log("[HOOKS.SERVER] Pathname:", event.url.pathname);
    if (!sessionId) {
      console.log("[HOOKS.SERVER] No session ID found - redirecting to /login");
      throw redirect(303, "/login");
    }
    try {
      console.log("[HOOKS.SERVER] Session ID found - verifying with backend");
      let apiBase = "http://app:3001";
      console.log("[HOOKS.SERVER] Using backend URL:", apiBase);
      const verifyResponse = await fetch(`${apiBase}/auth/verify-session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Cookie": allCookies
        }
      });
      console.log("[HOOKS.SERVER] Backend verification response:", verifyResponse.status);
      if (!verifyResponse.ok) {
        console.log("[HOOKS.SERVER] Backend returned", verifyResponse.status, "- session is invalid, redirecting to /login");
        throw redirect(303, "/login");
      }
      console.log("[HOOKS.SERVER] Backend verified session is valid - allowing access");
    } catch (error) {
      if (error && typeof error === "object" && "location" in error) {
        console.log("[HOOKS.SERVER] Rethrowing redirect exception");
        throw error;
      }
      console.error("[HOOKS.SERVER] Error verifying session with backend:", error instanceof Error ? error.message : String(error));
      if (error instanceof Error) {
        console.error("[HOOKS.SERVER] Error details:", error.stack);
      }
      console.log("[HOOKS.SERVER] Could not verify with backend, allowing request to proceed");
    }
  }
  return resolve(event);
};
export {
  handle
};
