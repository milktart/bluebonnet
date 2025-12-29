import { redirect } from "@sveltejs/kit";
const load = async ({ cookies }) => {
  const sessionId = cookies.get("connect.sid");
  console.log("[DASHBOARD +PAGE.SERVER] Load function called");
  console.log("[DASHBOARD +PAGE.SERVER] Session ID:", sessionId ? "EXISTS" : "MISSING");
  if (!sessionId) {
    console.log("[DASHBOARD +PAGE.SERVER] No session ID - redirecting to /login");
    throw redirect(303, "/login");
  }
  console.log("[DASHBOARD +PAGE.SERVER] User authenticated, allowing page load");
  return {};
};
export {
  load
};
