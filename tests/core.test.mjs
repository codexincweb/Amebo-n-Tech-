import test from "node:test";
import assert from "node:assert/strict";

function makeSlug(input) {
  const slug = input
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "post-fallback";
}

test("slug strips punctuation and normalizes whitespace", () => {
  assert.equal(makeSlug("  Hello, Amebo 'n Tech! "), "hello-amebo-n-tech");
});

test("slug normalizes common accented characters", () => {
  assert.equal(makeSlug("Café & Technology"), "cafe-technology");
});

test("empty titles receive a safe fallback", () => {
  assert.equal(makeSlug("!!!"), "post-fallback");
});
