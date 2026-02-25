export const CONSENT_KEY = "yws_pipeda_consent";
export const CONSENT_VERSION = "1";

export const DEFAULT_PREFS = Object.freeze({
  necessary: true,
  analytics: false,
  marketing: false
});

const PREF_KEYS = ["necessary", "analytics", "marketing"];
const VENDOR_TYPES = ["script"];
const VENDOR_CATEGORY_MAP = {
  functional: "necessary",
  necessary: "necessary",
  analytics: "analytics",
  marketing: "marketing"
};

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function normalizePrefs(prefs) {
  const source = isObject(prefs) ? prefs : {};
  return {
    necessary: true,
    analytics: source.analytics === true,
    marketing: source.marketing === true
  };
}

export function createConsentPayload(prefs, timestamp = new Date().toISOString()) {
  return {
    version: CONSENT_VERSION,
    timestamp,
    prefs: normalizePrefs(prefs)
  };
}

export function isConsentPayload(value) {
  if (!isObject(value)) return false;
  if (value.version !== CONSENT_VERSION) return false;
  if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp))) return false;
  if (!isObject(value.prefs)) return false;
  if (!PREF_KEYS.every((key) => key in value.prefs)) return false;
  if (value.prefs.necessary !== true) return false;
  if (typeof value.prefs.analytics !== "boolean") return false;
  if (typeof value.prefs.marketing !== "boolean") return false;
  return true;
}

export function parseConsentValue(rawValue) {
  if (typeof rawValue !== "string" || !rawValue.length) return null;
  try {
    const parsed = JSON.parse(rawValue);
    return isConsentPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readStoredConsent(storageKey = CONSENT_KEY) {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const rawValue = window.localStorage.getItem(storageKey);
  return parseConsentValue(rawValue);
}

export function writeStoredConsent(prefs, storageKey = CONSENT_KEY) {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const payload = createConsentPayload(prefs);
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
  return payload;
}

export function hasStoredConsent(storageKey = CONSENT_KEY) {
  return readStoredConsent(storageKey) !== null;
}

export function clearStoredConsent(storageKey = CONSENT_KEY) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(storageKey);
}

export function loadScriptOnce(vendor) {
  if (typeof document === "undefined") return false;
  if (!isObject(vendor)) return false;
  if (vendor.type !== "script") return false;
  if (typeof vendor.src !== "string" || !vendor.src.trim()) return false;

  const scriptId = typeof vendor.id === "string" ? vendor.id.trim() : "";
  const scriptSrc = vendor.src.trim();

  if (scriptId && document.getElementById(scriptId)) return false;
  if (!scriptId && document.querySelector(`script[src="${scriptSrc}"]`)) return false;

  const script = document.createElement("script");
  if (scriptId) script.id = scriptId;
  script.src = scriptSrc;

  const attrs = isObject(vendor.attrs) ? vendor.attrs : {};
  Object.entries(attrs).forEach(([key, value]) => {
    if (typeof key !== "string" || !key.trim()) return;
    if (typeof value !== "string") return;
    const attrName = key.trim();
    script.setAttribute(attrName, value);
    if ((attrName === "async" || attrName === "defer") && value !== "false") {
      script[attrName] = true;
    }
  });

  document.head.appendChild(script);
  return true;
}

export function normalizeVendorCategory(category) {
  if (typeof category !== "string") return null;
  const key = category.trim().toLowerCase();
  return VENDOR_CATEGORY_MAP[key] ?? null;
}

export function normalizeVendor(vendor) {
  if (!isObject(vendor)) return null;

  const key = typeof vendor.key === "string" ? vendor.key.trim() : "";
  const id = typeof vendor.id === "string" ? vendor.id.trim() : "";
  const src = typeof vendor.src === "string" ? vendor.src.trim() : "";
  const type = typeof vendor.type === "string" ? vendor.type.trim().toLowerCase() : "";
  const category = normalizeVendorCategory(vendor.category);

  if (!key || !id || !src) return null;
  if (!VENDOR_TYPES.includes(type)) return null;
  if (!category) return null;

  const attrsSource = isObject(vendor.attrs) ? vendor.attrs : {};
  const attrs = {};
  Object.entries(attrsSource).forEach(([attrKey, attrValue]) => {
    if (typeof attrKey !== "string" || typeof attrValue !== "string") return;
    const trimmedKey = attrKey.trim();
    if (!trimmedKey) return;
    attrs[trimmedKey] = attrValue;
  });

  return {
    key,
    id,
    src,
    type,
    category,
    attrs
  };
}

export function normalizeVendors(vendors) {
  if (!Array.isArray(vendors)) return [];
  const seenIds = new Set();
  return vendors
    .map((vendor) => normalizeVendor(vendor))
    .filter((vendor) => {
      if (!vendor) return false;
      if (seenIds.has(vendor.id)) return false;
      seenIds.add(vendor.id);
      return true;
    });
}

export function isCategoryAllowed(prefs, category) {
  const normalizedCategory = normalizeVendorCategory(category);
  if (!normalizedCategory) return false;
  if (normalizedCategory === "necessary") return true;
  const resolved = normalizePrefs(prefs);
  return resolved[normalizedCategory] === true;
}

export function getAllowedVendors(vendors, prefs) {
  return normalizeVendors(vendors).filter((vendor) => isCategoryAllowed(prefs, vendor.category));
}

export function loadAllowedVendors(vendors, prefs) {
  const allowedVendors = getAllowedVendors(vendors, prefs);
  const loaded = [];

  allowedVendors.forEach((vendor) => {
    const didLoad = loadScriptOnce(vendor);
    if (didLoad) loaded.push(vendor.key);
  });

  return {
    loaded,
    allowed: allowedVendors.map((vendor) => vendor.key)
  };
}
