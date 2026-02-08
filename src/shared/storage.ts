/**
 * chrome.storage ラッパー
 *
 * chrome.storage.sync の読み書きをラップし、
 * デフォルト値のマージと型安全なアクセスを提供する。
 */

import type { Settings } from "./types";
import { DEFAULT_SETTINGS, STORAGE_KEY } from "./constants";

/** 閾値の最小値 */
const THRESHOLD_MIN = 3;

/** 閾値の最大値 */
const THRESHOLD_MAX = 50;

/** 閾値を有効範囲（3-50）に正規化する */
function normalizeThreshold(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_SETTINGS.threshold;
  return Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, Math.round(num)));
}

/** DEFAULT_SETTINGS の深いコピーを返す */
function createDefaultSettings(): Settings {
  return {
    sites: {
      x: {
        ...DEFAULT_SETTINGS.sites.x,
        optionalFeeds: { ...DEFAULT_SETTINGS.sites.x.optionalFeeds },
      },
    },
    threshold: DEFAULT_SETTINGS.threshold,
  };
}

/**
 * chrome.storage.sync から設定を読み込む。
 * 保存されていないフィールドにはデフォルト値がマージされる。
 */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<Settings> | undefined;

  if (!stored) {
    return createDefaultSettings();
  }

  return {
    sites: {
      x: {
        ...DEFAULT_SETTINGS.sites.x,
        ...stored.sites?.x,
        optionalFeeds: {
          ...DEFAULT_SETTINGS.sites.x.optionalFeeds,
          ...stored.sites?.x?.optionalFeeds,
        },
      },
    },
    threshold: normalizeThreshold(stored.threshold),
  };
}

/**
 * chrome.storage.sync に設定を保存する。
 * 閾値は有効範囲（3-50）に正規化してから保存する。
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const normalized: Settings = {
    ...settings,
    threshold: normalizeThreshold(settings.threshold),
  };
  await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
}

/**
 * 設定変更を監視するリスナーを登録する。
 * コールバックには変更後の新しい Settings が渡される。
 *
 * @returns リスナーを解除する関数
 */
export function onSettingsChanged(
  callback: (newSettings: Settings) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "sync" || !(STORAGE_KEY in changes)) {
      return;
    }

    const change = changes[STORAGE_KEY];
    const newValue = change.newValue as Partial<Settings> | undefined;

    // 削除された場合はデフォルト値を返す
    if (!newValue) {
      callback(createDefaultSettings());
      return;
    }

    // デフォルト値とマージして返す
    const merged: Settings = {
      sites: {
        x: {
          ...DEFAULT_SETTINGS.sites.x,
          ...newValue.sites?.x,
          optionalFeeds: {
            ...DEFAULT_SETTINGS.sites.x.optionalFeeds,
            ...newValue.sites?.x?.optionalFeeds,
          },
        },
      },
      threshold: normalizeThreshold(newValue.threshold),
    };

    callback(merged);
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
