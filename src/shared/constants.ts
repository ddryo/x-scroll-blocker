/**
 * デフォルト設定値
 *
 * chrome.storage.sync に保存される設定のデフォルト値を定義する。
 */

import type { Settings } from "./types";

/** chrome.storage.sync で使用するストレージキー */
export const STORAGE_KEY = "settings" as const;

/** デフォルト設定値 */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  sites: {
    x: { enabled: true, optionalFeeds: {} },
  },
  threshold: 10,
} as const;
