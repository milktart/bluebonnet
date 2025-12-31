import { redirect } from "@sveltejs/kit";
const handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/dashboard")) {
    const sessionId = event.cookies.get("connect.sid");
    const allCookies = event.request.headers.get("cookie") || "";
    if (!sessionId) {
      throw redirect(303, "/login");
    }
    try {
      let apiBase = "http://app:3001";
      const verifyResponse = await fetch(`${apiBase}/auth/verify-session`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Cookie": allCookies
        }
      });
      if (!verifyResponse.ok) {
        throw redirect(303, "/login");
      }
    } catch (error) {
      if (error && typeof error === "object" && "location" in error) {
        throw error;
      }
    }
  }
  return resolve(event);
};
export {
  handle
};
