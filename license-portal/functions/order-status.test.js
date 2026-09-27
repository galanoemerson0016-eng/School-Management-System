const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateOrderStatusQuery } = require("./order-status-service");

test("validates and normalizes valid email and proofId", () => {
  const result = validateOrderStatusQuery({
    email: "  Teacher.Maria@DepEd.gov.ph ",
    proofId: "  GCASH-982184-REF  ",
  });
  assert.deepEqual(result, {
    targetEmail: "teacher.maria@deped.gov.ph",
    targetProofId: "gcash-982184-ref",
  });
});

test("rejects missing or empty inputs", () => {
  assert.throws(() => validateOrderStatusQuery(null), /Missing or invalid required fields/);
  assert.throws(() => validateOrderStatusQuery({}), /Missing or invalid required fields/);
  assert.throws(() => validateOrderStatusQuery({ email: "", proofId: "123" }), /Missing or invalid required fields/);
  assert.throws(() => validateOrderStatusQuery({ email: "test@example.com", proofId: "  " }), /Missing or invalid required fields/);
});

test("rejects invalid email formats", () => {
  assert.throws(() => validateOrderStatusQuery({ email: "invalid-email", proofId: "ref-123" }), /valid email address/);
});

test("rejects oversized inputs to prevent denial of service", () => {
  const longEmail = "a".repeat(250) + "@test.com";
  assert.throws(() => validateOrderStatusQuery({ email: longEmail, proofId: "ref-1" }), /Missing or invalid required fields/);
  const longProofId = "x".repeat(161);
  assert.throws(() => validateOrderStatusQuery({ email: "valid@test.com", proofId: longProofId }), /Missing or invalid required fields/);
});
