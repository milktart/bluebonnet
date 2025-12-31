import { redirect } from "@sveltejs/kit";
const GET = async ({ request, cookies }) => {
  try {
    const logoutUrl = "/auth/logout";
    await fetch(logoutUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        "Cookie": request.headers.get("cookie") || ""
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
  cookies.delete("connect.sid", { path: "/" });
  throw redirect(303, "/login");
};
export {
  GET
};
