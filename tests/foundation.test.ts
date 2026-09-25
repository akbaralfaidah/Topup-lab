import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnvironment } from "../src/server/config/schema";
import { errorResponse, AppError } from "../src/server/http/errors";
import { requestIdFrom } from "../src/server/http/request-id";
import { checkReadiness } from "../src/server/health/readiness";
import { stateTransition } from "../src/lib/motion/transitions";
import { duration, distance, spring } from "../src/lib/motion/tokens";

const valid = {
  NODE_ENV: "test",
  APP_MODE: "demo",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://dev:local@localhost:5432/topuplab",
  REDIS_URL: "redis://localhost:6379",
  TARGET_ENCRYPTION_ACTIVE_KEY_ID: "v1",
  TARGET_ENCRYPTION_KEYS: JSON.stringify({
    v1: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  }),
  QUOTE_HMAC_KEY:
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  GUEST_HMAC_KEY:
    "0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
};

test("environment accepts isolated test configuration", () => {
  assert.equal(parseEnvironment(valid).APP_MODE, "demo");
});
test("missing values and wrong protocols fail without exposing secrets", () => {
  const secret = "sensitive-credential";
  for (const input of [
    {},
    { ...valid, DATABASE_URL: `https://user:${secret}@example.com` },
    { ...valid, APP_MODE: "invalid" },
  ]) {
    assert.throws(
      () => parseEnvironment(input),
      (error: unknown) =>
        error instanceof Error &&
        !error.message.includes(secret) &&
        error.message.startsWith("Invalid server environment:"),
    );
  }
});
test("production refuses HTTP and placeholder or absent infrastructure passwords", () => {
  assert.throws(() =>
    parseEnvironment({
      ...valid,
      NODE_ENV: "production",
      APP_URL: "https://topuplab.example",
      DATABASE_URL:
        "postgresql://user:local-development-only@localhost:5432/topuplab",
      REDIS_URL: "redis://:local-development-only@localhost:6379",
    }),
  );
  assert.throws(() => parseEnvironment({ ...valid, NODE_ENV: "production" }));
  assert.throws(() =>
    parseEnvironment({
      ...valid,
      NODE_ENV: "production",
      APP_URL: "https://topuplab.example",
      DATABASE_URL:
        "postgresql://user:REPLACE_WITH_UNIQUE_PASSWORD@postgres:5432/topuplab",
      REDIS_URL: "redis://redis:6379",
    }),
  );
  assert.equal(
    parseEnvironment({
      ...valid,
      NODE_ENV: "production",
      APP_URL: "https://topuplab.example",
      DATABASE_URL:
        "postgresql://user:long-test-only-password@postgres:5432/topuplab",
      REDIS_URL: "redis://:long-test-only-password@redis:6379",
    }).NODE_ENV,
    "production",
  );
});
test("malformed URLs and percent escapes cannot leak credentials through parser errors", () => {
  for (const url of [
    "postgresql://user:private-password@[bad/db",
    "postgresql://user:%E0%A4@localhost/db",
  ]) {
    assert.throws(
      () =>
        parseEnvironment({
          ...valid,
          NODE_ENV: "production",
          DATABASE_URL: url,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /^Invalid server environment:/);
        assert.ok(!JSON.stringify(error).includes("private-password"));
        assert.ok(!error.message.includes(url));
        return true;
      },
    );
  }
});
test("errors never expose stack traces or unknown exception text", async () => {
  const response = errorResponse(
    new Error("postgresql://secret@internal/path"),
    "test-id",
  );
  assert.equal(response.status, 500);
  assert.equal(response.headers.get("x-request-id"), "test-id");
  const body = await response.json();
  assert.equal(body.error.code, "INTERNAL_ERROR");
  assert.equal(body.error.requestId, "test-id");
  assert.ok(!JSON.stringify(body).includes("secret"));
});
test("known errors preserve stable codes and appropriate HTTP status", async () => {
  const response = errorResponse(
    new AppError("SERVICE_UNAVAILABLE", 503, "Layanan belum siap."),
    "test-id",
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "SERVICE_UNAVAILABLE");
});
test("request IDs accept UUID v4 and reject log injection and unbounded input", () => {
  const validId = "0698ae17-7637-4f3d-b8dd-12a1428344e0";
  assert.equal(
    requestIdFrom(new Headers({ "x-request-id": validId })),
    validId,
  );
  for (const value of ["untrusted", "x".repeat(10000), '{"fake":"log"}']) {
    assert.match(
      requestIdFrom(new Headers({ "x-request-id": value })),
      /^[a-f0-9-]{36}$/,
    );
  }
});
test("readiness checks both dependencies and reports failures honestly", async () => {
  let redisCalled = false;
  const unavailable = await checkReadiness({
    database: async () => {
      throw new Error("offline");
    },
    redis: async () => {
      redisCalled = true;
    },
  });
  assert.equal(redisCalled, true);
  assert.deepEqual(unavailable, {
    ready: false,
    dependencies: { database: false, redis: true },
  });
  assert.equal(
    (
      await checkReadiness({
        database: async () => 1,
        redis: async () => "PONG",
      })
    ).ready,
    true,
  );
  assert.equal(
    (
      await checkReadiness({
        database: async () => 1,
        redis: async () => {
          throw new Error("offline");
        },
      })
    ).ready,
    false,
  );
});
test("motion policy makes reduced-motion transitions immediate and keeps durations bounded", () => {
  assert.equal(stateTransition(true).duration, 0);
  assert.equal(stateTransition(false).duration, duration.normal);
  assert.ok(Object.values(duration).every((value) => value < 0.4));
  assert.ok(Object.values(spring).every((value) => value.duration < 0.4));
  assert.ok(distance.maximum <= 24);
});
