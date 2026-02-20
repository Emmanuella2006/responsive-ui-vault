const KEY = "book&vault:data";
const SETTINGS_KEY = "book&vault:settings";

export const load = () =>
  JSON.parse(localStorage.getItem(KEY) || "[]");

export const save = data =>
  localStorage.setItem(KEY, JSON.stringify(data));

export const loadSettings = () =>
  JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");

export const saveSettings = settings =>
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));