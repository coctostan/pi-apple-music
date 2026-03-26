import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LibraryCache } from "../src/cache.js";

void describe("LibraryCache", () => {
  void it("returns null on cache miss", () => {
    const cache = new LibraryCache(60000);
    assert.equal(cache.get("nonexistent"), null);
  });

  void it("returns cached data on hit", () => {
    const cache = new LibraryCache(60000);
    cache.set("songs:50", "cached song data");
    assert.equal(cache.get("songs:50"), "cached song data");
  });

  void it("expires entries after TTL", async () => {
    const cache = new LibraryCache(50); // 50ms TTL
    cache.set("songs:50", "data");
    assert.equal(cache.get("songs:50"), "data"); // still valid

    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(cache.get("songs:50"), null); // expired
  });

  void it("clears all entries", () => {
    const cache = new LibraryCache(60000);
    cache.set("songs:50", "songs data");
    cache.set("artists:50", "artists data");
    assert.equal(cache.size(), 2);

    cache.clear();
    assert.equal(cache.size(), 0);
    assert.equal(cache.get("songs:50"), null);
    assert.equal(cache.get("artists:50"), null);
  });

  void it("returns correct size", () => {
    const cache = new LibraryCache(60000);
    assert.equal(cache.size(), 0);
    cache.set("a", "1");
    assert.equal(cache.size(), 1);
    cache.set("b", "2");
    assert.equal(cache.size(), 2);
    cache.set("a", "updated"); // overwrite doesn't increase size
    assert.equal(cache.size(), 2);
  });

  void it("returns null oldestAge when empty", () => {
    const cache = new LibraryCache(60000);
    assert.equal(cache.oldestAge(), null);
  });

  void it("returns correct oldestAge", async () => {
    const cache = new LibraryCache(60000);
    cache.set("first", "data");
    await new Promise((resolve) => setTimeout(resolve, 20));
    cache.set("second", "data");

    const age = cache.oldestAge();
    assert.ok(age !== null && age >= 20, "Oldest age should be at least 20ms");
  });

  void it("returns correct stats", () => {
    const cache = new LibraryCache(60000);

    const emptyStats = cache.stats();
    assert.equal(emptyStats.entries, 0);
    assert.equal(emptyStats.oldestAgeSec, null);

    cache.set("songs:50", "data");
    cache.set("artists:25", "data");
    const stats = cache.stats();
    assert.equal(stats.entries, 2);
    assert.ok(stats.oldestAgeSec !== null && stats.oldestAgeSec >= 0);
  });

  void it("keeps different keys independent", () => {
    const cache = new LibraryCache(60000);
    cache.set("songs:50", "songs data");
    cache.set("songs:25", "songs data limited");
    cache.set("artists:50", "artists data");

    assert.equal(cache.get("songs:50"), "songs data");
    assert.equal(cache.get("songs:25"), "songs data limited");
    assert.equal(cache.get("artists:50"), "artists data");
    assert.equal(cache.get("albums:50"), null);
  });
});
