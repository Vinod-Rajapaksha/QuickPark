export const config = {
  runtime: "edge",
};

export default async function handler(request) {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return new Response(
      JSON.stringify({
        error: "Server Configuration Error: BACKEND_API_URL is missing.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let backendUri;
  try {
    backendUri = new URL(backendUrl);
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Server Configuration Error: BACKEND_API_URL is invalid.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) {
    return new Response(
      JSON.stringify({
        error: "Forbidden: Only /api/ requests can be proxied.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const targetUrl = new URL(url.pathname + url.search, backendUri.origin);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const proxyOptions = {
    method: request.method,
    headers: headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    proxyOptions.body = request.body;
  }

  const proxyRequest = new Request(targetUrl.toString(), proxyOptions);

  try {
    const response = await fetch(proxyRequest);
    return response;
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Bad Gateway: Unable to reach the backend API.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
