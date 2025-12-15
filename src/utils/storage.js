import { browserAPI } from "./browser.js";

export function getLocalStorage(key, defaultValue) {
  return localStorage.getItem(key) || defaultValue;
}

export function setLocalStorage(key, value) {
  localStorage.setItem(key, value);
}

export async function getSyncStorage(keys) {
  return browserAPI.storage.sync.get(keys);
}

export async function setSyncStorage(data) {
  return browserAPI.storage.sync.set(data);
}

export async function getLocalBrowserStorage(keys) {
  return browserAPI.storage.local.get(keys);
}

export async function setLocalBrowserStorage(data) {
  return browserAPI.storage.local.set(data);
}
