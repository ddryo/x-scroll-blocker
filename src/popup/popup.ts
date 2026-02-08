/**
 * ポップアップ エントリーポイント
 *
 * X のトグルと閾値スライダーの状態を chrome.storage.sync から読み込み、
 * 操作時に設定を保存する。
 */

import type { Settings } from "../shared/types";
import { getSettings, saveSettings } from "../shared/storage";

/**
 * 設定をトグル UI に反映する
 */
export function applySettingsToUI(settings: Settings): void {
  const toggle = document.getElementById("toggle-x") as HTMLInputElement | null;
  if (toggle) {
    toggle.checked = settings.sites.x.enabled;
  }

  // ステータステキストの更新
  const statusText = document.getElementById("status-text");
  if (statusText) {
    statusText.textContent = settings.sites.x.enabled ? "オン" : "オフ";
    statusText.classList.toggle("is-off", !settings.sites.x.enabled);
  }

  // オプショナルフィードトグルの反映
  const toggleSearch = document.getElementById(
    "toggle-search",
  ) as HTMLInputElement | null;
  const toggleProfile = document.getElementById(
    "toggle-profile",
  ) as HTMLInputElement | null;
  if (toggleSearch) {
    toggleSearch.checked = settings.sites.x.optionalFeeds?.search ?? false;
  }
  if (toggleProfile) {
    toggleProfile.checked = settings.sites.x.optionalFeeds?.profile ?? false;
  }

  // 閾値スライダーに値を反映
  const slider = document.getElementById(
    "threshold-slider",
  ) as HTMLInputElement | null;
  const valueDisplay = document.getElementById("threshold-value");
  if (slider) {
    slider.value = String(settings.threshold);
  }
  if (valueDisplay) {
    valueDisplay.textContent = `${settings.threshold} 画面分`;
  }
}

/**
 * トグル変更イベントを設定する
 */
export function setupToggleListeners(currentSettings: Settings): void {
  const toggle = document.getElementById("toggle-x") as HTMLInputElement | null;
  if (toggle) {
    toggle.addEventListener("change", async () => {
      currentSettings.sites.x.enabled = toggle.checked;
      await saveSettings(currentSettings);

      // ステータステキストの更新
      const statusText = document.getElementById("status-text");
      if (statusText) {
        statusText.textContent = toggle.checked ? "オン" : "オフ";
        statusText.classList.toggle("is-off", !toggle.checked);
      }
    });
  }

  const toggleSearch = document.getElementById(
    "toggle-search",
  ) as HTMLInputElement | null;
  if (toggleSearch) {
    toggleSearch.addEventListener("change", async () => {
      if (!currentSettings.sites.x.optionalFeeds) {
        currentSettings.sites.x.optionalFeeds = {};
      }
      currentSettings.sites.x.optionalFeeds.search = toggleSearch.checked;
      await saveSettings(currentSettings);
    });
  }

  const toggleProfile = document.getElementById(
    "toggle-profile",
  ) as HTMLInputElement | null;
  if (toggleProfile) {
    toggleProfile.addEventListener("change", async () => {
      if (!currentSettings.sites.x.optionalFeeds) {
        currentSettings.sites.x.optionalFeeds = {};
      }
      currentSettings.sites.x.optionalFeeds.profile = toggleProfile.checked;
      await saveSettings(currentSettings);
    });
  }
}

/**
 * 閾値スライダーの変更イベントを設定する
 */
export function setupThresholdListener(currentSettings: Settings): void {
  const slider = document.getElementById(
    "threshold-slider",
  ) as HTMLInputElement | null;
  const valueDisplay = document.getElementById("threshold-value");

  if (!slider) return;

  // input イベントで値表示をリアルタイム更新
  slider.addEventListener("input", () => {
    if (valueDisplay) {
      valueDisplay.textContent = `${slider.value} 画面分`;
    }
  });

  // change イベントで設定を保存
  slider.addEventListener("change", async () => {
    currentSettings.threshold = Number(slider.value);
    await saveSettings(currentSettings);
  });
}

/**
 * ポップアップの初期化
 */
export async function initPopup(): Promise<void> {
  // ストレージから現在の設定を読み込む
  const settings = await getSettings();

  // トグル UI に反映
  applySettingsToUI(settings);

  // トグル変更リスナーを設定
  setupToggleListeners(settings);

  // 閾値スライダーのリスナーを設定
  setupThresholdListener(settings);
}

// DOMContentLoaded で初期化
document.addEventListener("DOMContentLoaded", () => {
  initPopup();
});
