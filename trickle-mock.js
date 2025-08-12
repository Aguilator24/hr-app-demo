
/**
 * Minimal mock of Trickle client for static demos.
 * Persists data in localStorage using collections based on `prefix`.
 * Collections examples: "user", `document:<userId>`, "vacation", etc.
 * 
 * Exposes:
 *  - trickleListObjects(prefix, limit = 100, includeData = true)
 *  - trickleCreateObject(prefix, objectData)
 *  - trickleUpdateObject(prefix, objectId, partialData)
 *  - trickleDeleteObject(prefix, objectId)
 * 
 * Also seeds two demo users if the "user" collection is empty:
 *   admin@demo.com / admin123   (role: admin)
 *   empleado@demo.com / demo123 (role: employee)
 */

(function () {
  const STORAGE_PREFIX = "trickle:";

  function _key(prefix) {
    return STORAGE_PREFIX + String(prefix);
  }

  function _load(prefix) {
    try {
      const raw = localStorage.getItem(_key(prefix));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("trickle mock: load error", e);
      return [];
    }
  }

  function _save(prefix, items) {
    try {
      localStorage.setItem(_key(prefix), JSON.stringify(items));
    } catch (e) {
      console.error("trickle mock: save error", e);
    }
  }

  function _genId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  async function trickleListObjects(prefix, limit = 100, includeData = true) {
    const items = _load(prefix).slice(0, limit);
    return { items };
  }

  async function trickleCreateObject(prefix, objectData) {
    const items = _load(prefix);
    const objectId = _genId();
    const entry = { objectId, objectData, createdAt: Date.now() };
    items.unshift(entry);
    _save(prefix, items);
    return entry;
  }

  async function trickleUpdateObject(prefix, objectId, partialData) {
    const items = _load(prefix);
    const idx = items.findIndex((x) => x.objectId === objectId);
    if (idx === -1) throw new Error("Object not found");
    items[idx].objectData = { ...items[idx].objectData, ...partialData };
    items[idx].updatedAt = Date.now();
    _save(prefix, items);
    return items[idx];
  }

  async function trickleDeleteObject(prefix, objectId) {
    let items = _load(prefix);
    const before = items.length;
    items = items.filter((x) => x.objectId !== objectId);
    if (items.length === before) throw new Error("Object not found");
    _save(prefix, items);
    return { ok: true };
  }

  // Seed demo users on first run
  (function seedUsers() {
    const users = _load("user");
    if (users.length > 0) return;
    const demo = [
      {
        name: "Admin Demo",
        email: "admin@demo.com",
        password: "admin123",
        role: "admin",
      },
      {
        name: "Empleado Demo",
        email: "empleado@demo.com",
        password: "demo123",
        role: "employee",
      },
    ];
    const seeded = demo.map((u) => ({
      objectId: _genId(),
      objectData: u,
      createdAt: Date.now(),
    }));
    _save("user", seeded);
    console.info(
      "trickle mock: seeded demo users -> admin@demo.com/admin123, empleado@demo.com/demo123"
    );
  })();

  // Expose globally
  window.trickleListObjects = trickleListObjects;
  window.trickleCreateObject = trickleCreateObject;
  window.trickleUpdateObject = trickleUpdateObject;
  window.trickleDeleteObject = trickleDeleteObject;
})();
