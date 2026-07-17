import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_SESSION_STORAGE_KEY,
  SESSION_DOMAIN_STORAGE_KEYS,
  parseSessionDomain,
  selectSessionDomainCopy,
  serializeSessionDomain,
  sessionValueSignature,
} from "../app/session-state.ts";

test("keeps independently edited session domains on separate storage keys", () => {
  assert.equal(LEGACY_SESSION_STORAGE_KEY, "paiku-session-v1");
  assert.equal(new Set(Object.values(SESSION_DOMAIN_STORAGE_KEYS)).size, 4);
  assert.notEqual(SESSION_DOMAIN_STORAGE_KEYS.match, SESSION_DOMAIN_STORAGE_KEYS.compare);
  assert.notEqual(SESSION_DOMAIN_STORAGE_KEYS.tour, SESSION_DOMAIN_STORAGE_KEYS.catalog);
});

test("round-trips one domain without accepting corrupt or future envelopes", () => {
  const value = { slots: [{ slot: 0, id: "wilson-blade-98-v9" }] };
  assert.deepEqual(parseSessionDomain(serializeSessionDomain(value)), value);
  assert.equal(parseSessionDomain("not-json"), null);
  assert.equal(parseSessionDomain('{"version":2,"value":[]}'), null);
  assert.equal(parseSessionDomain('{"version":1}'), null);
});

test("uses a stable semantic signature for storage-event de-duplication", () => {
  const value = [{ slot: 0, id: "a" }, { slot: 2, id: "b" }];
  assert.equal(sessionValueSignature(value), sessionValueSignature(structuredClone(value)));
  assert.notEqual(sessionValueSignature(value), sessionValueSignature([{ slot: 0, id: "a" }]));
});

test("keeps tab-local domains session-first but migrates Compare local-first", () => {
  const sessionCopy = { source: "session", compareIds: ["old-tab-basket"] };
  const localCopy = { source: "local", compareIds: ["new-shared-basket"] };

  assert.strictEqual(selectSessionDomainCopy("match", sessionCopy, localCopy), sessionCopy);
  assert.strictEqual(selectSessionDomainCopy("tour", sessionCopy, localCopy), sessionCopy);
  assert.strictEqual(selectSessionDomainCopy("catalog", sessionCopy, localCopy), sessionCopy);
  assert.strictEqual(selectSessionDomainCopy("compare", sessionCopy, localCopy), localCopy);
  assert.strictEqual(selectSessionDomainCopy("compare", sessionCopy, null), sessionCopy);
  assert.strictEqual(selectSessionDomainCopy("match", null, localCopy), localCopy);
});
