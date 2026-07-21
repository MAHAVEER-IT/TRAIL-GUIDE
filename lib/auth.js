/**
 * Verifies request authorization headers against configured secret keys.
 * Supports both `x-api-key` header and `Authorization: Bearer <token>` header.
 */
export function verifyAuth(request) {
  const secretKey = process.env.API_SECRET_KEY;

  // If secret key is not set in environment, bypass check for local testing
  if (!secretKey) {
    return { authorized: true };
  }

  const apiKeyHeader = request.headers.get("x-api-key");
  const authHeader = request.headers.get("authorization");

  if (apiKeyHeader === secretKey) {
    return { authorized: true };
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token === secretKey) {
      return { authorized: true };
    }
  }

  return { authorized: false, error: "Unauthorized access: Invalid or missing API key / Bearer token" };
}
