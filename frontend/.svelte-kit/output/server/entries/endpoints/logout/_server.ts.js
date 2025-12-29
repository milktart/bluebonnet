import { redirect } from "@sveltejs/kit";
const GET = async ({ request, cookies }) => {
  try {
    const host = request.headers.get("host");
    let apiBase = "http://localhost:3000";
    if (host && !host.startsWith("localhost")) {
      const protocol = request.url.startsWith("https") ? "https:" : "http:";
      const hostname = host.split(":")[0];
      apiBase = `${protocol}//${hostname}:3501`;
    }
    await fetch(`${apiBase}/auth/logout`, {
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
