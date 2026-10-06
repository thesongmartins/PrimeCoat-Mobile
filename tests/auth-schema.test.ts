/// <reference types="node" />
import { test } from "node:test";
import assert from "node:assert/strict";
import { signUpSchema } from "../lib/auth-schema";

const valid = { fullName: "Ada Obi", email: "  Ada@Example.com ", password: "paint1234", confirmPassword: "paint1234" };

const firstError = (input: unknown, path: string) =>
  signUpSchema.safeParse(input).error?.issues.find((i) => i.path[0] === path)?.message;

test("a valid sign-up is accepted and the email is trimmed and lowercased", () => {
  const parsed = signUpSchema.parse(valid);
  assert.equal(parsed.email, "ada@example.com");
  assert.equal(parsed.fullName, "Ada Obi");
});

test("passwords need 8+ characters with a letter and a number", () => {
  assert.equal(firstError({ ...valid, password: "abc1", confirmPassword: "abc1" }, "password"), "Use at least 8 characters");
  assert.equal(
    firstError({ ...valid, password: "abcdefgh", confirmPassword: "abcdefgh" }, "password"),
    "Include at least one letter and one number",
  );
});

test("mismatched passwords are reported on confirmPassword", () => {
  assert.equal(firstError({ ...valid, confirmPassword: "paint12345" }, "confirmPassword"), "Passwords don't match");
});

test("name and email are required", () => {
  assert.equal(firstError({ ...valid, fullName: " " }, "fullName"), "Enter your full name");
  assert.equal(firstError({ ...valid, email: "not-an-email" }, "email"), "Enter a valid email address");
});
