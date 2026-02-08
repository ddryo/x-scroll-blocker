/**
 * Content Script エントリーポイント
 *
 * 各モジュール（page-detector, scroll-monitor, blocker, overlay, storage, sites/registry, container-finder）を統合し、
 * Content Script 全体のライフサイクルを制御する。
 *
 * ライフサイクル:
 *   1. ページ読み込み時に初期化（サイト検出 -> 設定読み込み -> フィード判定 -> 監視開始）
 *   2. SPA 遷移時にリセット（監視停止 -> ブロック解除 -> 再判定 -> 必要なら再開始）
 *   3. 設定変更時に即時反映（無効化 -> 停止+解除 / 閾値変更 -> 再設定）
 *
 * @see spec.md - FR-001, FR-002, FR-003, FR-004
 */

import { getCurrentSiteConfig } from "./sites/registry";
import type { SiteConfig } from "./sites/types";
import { isFeedPage, PageDetector } from "./page-detector";
import { ScrollMonitor } from "./scroll-monitor";
import { block, unblock, isBlocked } from "./blocker";
import { destroyOverlay } from "./overlay";
import { getSettings, onSettingsChanged } from "../shared/storage";
import type { Settings } from "../shared/types";
import {
  findScrollContainer,
  waitForScrollContainer,
} from "./container-finder";
import type { ContainerWaitHandle } from "./container-finder";

/** 現在のサイト設定 */
let currentSiteConfig: SiteConfig | null = null;

/** 現在の設定 */
let currentSettings: Settings | null = null;

/** スクロール監視インスタンス */
const scrollMonitor = new ScrollMonitor();

/** ページ遷移検知インスタンス */
const pageDetector = new PageDetector();

/** 設定変更リスナー解除関数 */
let unsubscribeSettings: (() => void) | null = null;

/** 現在のコンテナ待機ハンドル */
let currentWaitHandle: ContainerWaitHandle | null = null;

/**
 * スクロールコンテナに対してスクロール監視を実際に設定する
 *
 * @param container - スクロールコンテナ要素
 * @param settings - 現在の設定
 */
function attachScrollMonitor(container: Element, settings: Settings): void {
  scrollMonitor.start(container, settings.threshold, () => {
    // 閾値到達: スクロールをブロック
    block(container, () => {
      // ブロック解除時: カウンターをリセットして監視続行
      scrollMonitor.reset();
    });
  });
}

/**
 * スクロール監視を開始する
 *
 * フィードページであれば、スクロールコンテナを取得して ScrollMonitor を開始する。
 * コンテナが見つからない場合は MutationObserver + タイムアウトで待機する。
 * 閾値到達時に blocker.block() を呼び出す。
 *
 * @param siteConfig - サイト固有設定
 * @param settings - 現在の設定
 */
async function startMonitoring(
  siteConfig: SiteConfig,
  settings: Settings,
): Promise<void> {
  // フィードページでなければ何もしない
  if (!isFeedPage(location.href, siteConfig, settings.sites[siteConfig.name]))
    return;

  // サイトが無効化されていれば何もしない
  if (!settings.sites[siteConfig.name].enabled) return;

  // まずサイト固有セレクタで即時検索を試みる
  const immediate = findScrollContainer(siteConfig);
  if (immediate) {
    attachScrollMonitor(immediate, settings);
    return;
  }

  // サイト固有セレクタで見つからない場合は非同期で待機
  const waitHandle = waitForScrollContainer(siteConfig);
  currentWaitHandle = waitHandle;

  const container = await waitHandle.promise;
  // 自分のハンドルが最新の場合のみクリア（SPA 高速遷移時のレースコンディション対策）
  if (currentWaitHandle === waitHandle) {
    currentWaitHandle = null;
  }

  if (!container) return;

  // 待機中に状態が変わっていないか確認（SPA 遷移や設定変更による中断）
  if (currentSiteConfig !== siteConfig || currentSettings !== settings) return;
  if (!isFeedPage(location.href, siteConfig, settings.sites[siteConfig.name]))
    return;
  if (!settings.sites[siteConfig.name].enabled) return;

  attachScrollMonitor(container, settings);
}

/**
 * スクロール監視を停止し、ブロック状態を解除する
 */
function stopMonitoring(): void {
  // コンテナ待機中であればキャンセル
  if (currentWaitHandle) {
    currentWaitHandle.cancel();
    currentWaitHandle = null;
  }

  scrollMonitor.stop();

  if (isBlocked()) {
    unblock();
  }

}

/**
 * SPA ページ遷移時のハンドラ
 *
 * 既存の監視を停止し、新しいページで再判定して必要なら再開始する。
 *
 * @param _url - 遷移先の URL
 */
function handleNavigation(_url: string): void {
  if (!currentSiteConfig || !currentSettings) return;

  // 既存の監視とブロックを停止
  stopMonitoring();

  // 新しいページで再開始
  startMonitoring(currentSiteConfig, currentSettings);
}

/**
 * 設定変更時のハンドラ
 *
 * サイトが無効化された場合は監視停止+ブロック解除。
 * 閾値が変更された場合は新しい閾値で監視を再設定。
 *
 * @param newSettings - 変更後の設定
 */
function handleSettingsChanged(newSettings: Settings): void {
  if (!currentSiteConfig) return;

  const previousSettings = currentSettings;
  currentSettings = newSettings;

  const siteEnabled = newSettings.sites[currentSiteConfig.name].enabled;
  const wasEnabled =
    previousSettings?.sites[currentSiteConfig.name].enabled ?? true;

  // サイトが無効化された場合: 監視停止 + ブロック解除
  if (wasEnabled && !siteEnabled) {
    stopMonitoring();
    return;
  }

  // サイトが有効化された場合: 監視を開始
  if (!wasEnabled && siteEnabled) {
    startMonitoring(currentSiteConfig, newSettings);
    return;
  }

  // optionalFeeds が変更された場合: 監視を再設定
  const prevOptFeeds = JSON.stringify(
    previousSettings?.sites[currentSiteConfig.name].optionalFeeds ?? {},
  );
  const newOptFeeds = JSON.stringify(
    newSettings.sites[currentSiteConfig.name].optionalFeeds ?? {},
  );
  if (siteEnabled && prevOptFeeds !== newOptFeeds) {
    stopMonitoring();
    startMonitoring(currentSiteConfig, newSettings);
    return;
  }

  // 閾値が変更された場合: 現在のページがフィードなら監視を再設定
  if (
    siteEnabled &&
    previousSettings &&
    previousSettings.threshold !== newSettings.threshold
  ) {
    stopMonitoring();
    startMonitoring(currentSiteConfig, newSettings);
  }
}

/**
 * Content Script の初期化
 *
 * 1. ホスト名からサイト設定を取得
 * 2. chrome.storage.sync から設定を読み込み
 * 3. フィードページ判定 + 監視開始
 * 4. SPA 遷移検知の開始
 * 5. 設定変更リスナーの登録
 */
async function initialize(): Promise<void> {
  // サイト設定を取得
  const siteConfig = getCurrentSiteConfig(location.hostname);
  if (!siteConfig) return; // 対象サイトでなければ何もしない

  currentSiteConfig = siteConfig;

  // 設定を読み込み
  currentSettings = await getSettings();

  // フィード判定 + 監視開始
  startMonitoring(siteConfig, currentSettings);

  // SPA 遷移検知を開始
  pageDetector.start(handleNavigation);

  // 設定変更リスナーを登録
  unsubscribeSettings = onSettingsChanged(handleSettingsChanged);
}

/**
 * クリーンアップ処理
 *
 * 全てのリスナーと監視を解除する。
 */
function cleanup(): void {
  stopMonitoring();
  pageDetector.stop();
  destroyOverlay();

  if (unsubscribeSettings) {
    unsubscribeSettings();
    unsubscribeSettings = null;
  }

  currentSiteConfig = null;
  currentSettings = null;
}

// Content Script を初期化
initialize();

// ページ非表示時にクリーンアップ（unload は Permissions-Policy で非推奨）
window.addEventListener("pagehide", cleanup);
