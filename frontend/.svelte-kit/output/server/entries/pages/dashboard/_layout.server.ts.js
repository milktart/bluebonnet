import { redirect } from "@sveltejs/kit";
const load = async ({ cookies }) => {
  const sessionId = cookies.get("connect.sid");
  console.log("[DASHBOARD +LAYOUT.SERVER] Load function called");
  console.log("[DASHBOARD +LAYOUT.SERVER] Session ID:", sessionId ? "EXISTS" : "MISSING");
  if (!sessionId) {
    console.log("[DASHBOARD +LAYOUT.SERVER] No session ID - redirecting to /login");
    throw redirect(303, "/login");
  }
  console.log("[DASHBOARD +LAYOUT.SERVER] User authenticated, allowing dashboard access");
  return {};
};
export {
  load
};
