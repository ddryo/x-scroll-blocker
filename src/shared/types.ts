/**
 * 共通型定義
 *
 * プロジェクト全体で使用する TypeScript 型定義を集約する。
 */

/** サイト識別子 */
export type SiteId = "x";

/** サイトごとの有効/無効設定 */
export interface SiteSettings {
  /** ブロック有効/無効 */
  enabled: boolean;
  /** オプショナルフィード別の有効/無効設定 */
  optionalFeeds?: Record<string, boolean>;
}

/**
 * 拡張機能の設定（chrome.storage.sync に保存）
 *
 * @see spec.md - データモデル: Settings
 */
export interface Settings {
  /** サイト別の有効/無効設定 */
  sites: Record<SiteId, SiteSettings>;
  /** スクロール閾値（画面高さの倍数） */
  threshold: number;
}
