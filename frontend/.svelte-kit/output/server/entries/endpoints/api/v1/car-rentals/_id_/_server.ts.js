import { json } from "@sveltejs/kit";
function getBackendUrl() {
  return "";
}
async function proxyToBackend(method, path, request) {
  const backendUrl = `${getBackendUrl()}${path}`;
  const fetchOptions = { method, credentials: "include", headers: { "Content-Type": "application/json" } };
  if (request) {
    try {
      const body = await request.text();
      if (body) fetchOptions.body = body;
    } catch (err) {
      console.error("Error reading request body:", err);
    }
    const cookies = request.headers.get("cookie");
    if (cookies) fetchOptions.headers = { ...fetchOptions.headers, cookie: cookies };
  }
  const response = await fetch(backendUrl, fetchOptions);
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return json(data, { status: response.status });
  } else {
    const text = await response.text();
    return new Response(text, { status: response.status });
  }
}
const GET = async ({ params }) => proxyToBackend("GET", `/api/v1/car-rentals/${params.id}`);
const PUT = async ({ params, request }) => proxyToBackend("PUT", `/api/v1/car-rentals/${params.id}`, request);
const DELETE = async ({ params }) => proxyToBackend("DELETE", `/api/v1/car-rentals/${params.id}`);
export {
  DELETE,
  GET,
  PUT
};
