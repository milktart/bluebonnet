import { redirect } from "@sveltejs/kit";
const load = async ({ cookies }) => {
  const sessionId = cookies.get("connect.sid");
  if (!sessionId) {
    throw redirect(303, "/login");
  }
  return {};
};
export {
  load
};
