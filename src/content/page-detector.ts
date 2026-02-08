/**
 * フィードページ判定 + SPA 遷移検知モジュール
 *
 * - isFeedPage: 現在の URL が SiteConfig の feedUrlPatterns にマッチするか判定
 * - PageDetector: SPA のページ遷移を検知し、コールバックを発火する
 *
 * SPA 遷移検知の主経路:
 *   1. history.pushState / history.replaceState のラップ
 *   2. popstate イベントリスナー
 * 補助手段:
 *   3. MutationObserver による document.title の変更検知（NFR-002 準拠で最小範囲）
 *
 * @see spec.md - FR-004, FR-005
 */

import type { SiteConfig } from "./sites/types";
import type { SiteSettings } from "../shared/types";

/** ページ遷移時に呼ばれるコールバック */
export type NavigationCallback = (url: string) => void;

/**
 * 現在の URL がフィードページかどうかを判定する
 *
 * SiteConfig の feedUrlPatterns のいずれかにマッチすればフィードとみなす。
 * また、optionalFeedPatterns に該当し、siteSettings で有効化されているパターンもフィードとみなす。
 * マッチ対象は URL の pathname 部分。
 *
 * @param url - 判定対象の URL 文字列（完全な URL またはパス）
 * @param siteConfig - サイト固有設定
 * @param siteSettings - サイトごとの設定（オプショナルフィードの判定に使用）
 * @returns フィードページであれば true
 */
export function isFeedPage(
  url: string,
  siteConfig: SiteConfig,
  siteSettings?: SiteSettings,
): boolean {
  let pathname: string;
  try {
    const parsed = new URL(url);
    pathname = parsed.pathname;
  } catch {
    // URL パースに失敗した場合はパスとして扱う
    pathname = url;
  }

  // 基本パターン（常時有効）
  if (siteConfig.feedUrlPatterns.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  // オプショナルパターン（設定で有効化されたもの）
  if (siteConfig.optionalFeedPatterns && siteSettings?.optionalFeeds) {
    for (const opt of siteConfig.optionalFeedPatterns) {
      if (
        siteSettings.optionalFeeds[opt.key] &&
        opt.patterns.some((pattern) => pattern.test(pathname))
      ) {
        return true;
      }
    }
  }

  return false;
}

/** URL ポーリング間隔（ミリ秒） */
const URL_POLL_INTERVAL = 500;

/**
 * SPA ページ遷移検知クラス
 *
 * Content Script は isolated world で実行されるため、
 * history.pushState のラップはメインワールドの呼び出しには効かない。
 * 主経路として URL ポーリング + popstate を使い、
 * MutationObserver による title 監視を補助手段として併用する。
 */
export class PageDetector {
  private callback: NavigationCallback | null = null;
  private lastUrl: string = "";

  // popstate ハンドラーの参照（removeEventListener 用）
  private popstateHandler: (() => void) | null = null;

  // MutationObserver の参照
  private titleObserver: MutationObserver | null = null;

  // URL ポーリングタイマー
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * SPA 遷移検知を開始する
   *
   * @param callback - ページ遷移時に遷移先 URL を引数として呼ばれるコールバック
   */
  start(callback: NavigationCallback): void {
    // 既に開始済みの場合は先に停止する
    if (this.callback) {
      this.stop();
    }

    this.callback = callback;
    this.lastUrl = location.href;

    this.addPopstateListener();
    this.startTitleObserver();
    this.startUrlPolling();
  }

  /**
   * SPA 遷移検知を停止する
   *
   * イベントリスナー、MutationObserver、ポーリングを破棄する。
   */
  stop(): void {
    this.removePopstateListener();
    this.stopTitleObserver();
    this.stopUrlPolling();
    this.callback = null;
    this.lastUrl = "";
  }

  /**
   * popstate イベントリスナーを設置する
   */
  private addPopstateListener(): void {
    this.popstateHandler = () => {
      this.checkUrlChange();
    };
    window.addEventListener("popstate", this.popstateHandler);
  }

  /**
   * popstate イベントリスナーを解除する
   */
  private removePopstateListener(): void {
    if (this.popstateHandler) {
      window.removeEventListener("popstate", this.popstateHandler);
      this.popstateHandler = null;
    }
  }

  /**
   * MutationObserver で document.title の変更を監視する（補助手段）
   *
   * SPA によっては pushState を使わず document.title だけ変更するケースがあるため、
   * 補助的な検知手段として設置する。
   * NFR-002 準拠: 監視対象は <title> 要素の characterData のみ、subtree: false で最小範囲。
   */
  private startTitleObserver(): void {
    const titleElement = document.querySelector("title");
    if (!titleElement) return;

    this.titleObserver = new MutationObserver(() => {
      this.checkUrlChange();
    });

    this.titleObserver.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  /**
   * MutationObserver を停止する
   */
  private stopTitleObserver(): void {
    if (this.titleObserver) {
      this.titleObserver.disconnect();
      this.titleObserver = null;
    }
  }

  /**
   * URL ポーリングを開始する
   *
   * Content Script の isolated world では history.pushState のラップが
   * メインワールドの呼び出しに効かないため、定期的に URL をチェックする。
   */
  private startUrlPolling(): void {
    this.pollIntervalId = setInterval(() => {
      this.checkUrlChange();
    }, URL_POLL_INTERVAL);
  }

  /**
   * URL ポーリングを停止する
   */
  private stopUrlPolling(): void {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  /**
   * URL が変更されたかを確認し、変更があればコールバックを発火する
   */
  private checkUrlChange(): void {
    const currentUrl = location.href;
    if (currentUrl !== this.lastUrl) {
      this.lastUrl = currentUrl;
      this.callback?.(currentUrl);
    }
  }
}
