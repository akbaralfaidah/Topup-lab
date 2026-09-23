import { randomUUID } from "node:crypto";

export function requestIdFrom(headers: Headers) {
  const value = headers.get("x-request-id");
  return value &&
    /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      value,
    )
    ? value
    : randomUUID();
}
