/**
 * SiteConfig インターフェース定義
 *
 * サイト固有設定を統一的に扱うための型を定義する。
 *
 * @see spec.md - データモデル: SiteConfig
 */

import type { SiteId } from "../../shared/types";

/** サイト固有設定 */
export interface SiteConfig {
  /** サイト識別名（SiteId と対応） */
  name: SiteId;

  /** ホスト名マッチパターン（例: /^(www\.)?x\.com$/ ） */
  hostPattern: RegExp;

  /** フィードページ判定用 URL パターン（いずれかにマッチすればフィードとみなす） */
  feedUrlPatterns: RegExp[];

  /** スクロールコンテナの CSS セレクタ */
  scrollContainerSelector: string;

  /** セレクタで取得できない場合の代替取得関数 */
  scrollContainerFinder?: () => Element | null;

  /** 設定で有効/無効を切り替えられるフィードパターン */
  optionalFeedPatterns?: {
    key: string;
    label: string;
    patterns: RegExp[];
  }[];
}
