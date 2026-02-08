/**
 * X (Twitter) 固有設定
 *
 * twitter.com と x.com の両方に対応する。
 *
 * スクロールコンテナ:
 *   X のタイムラインは主にページ全体のスクロール（document.scrollingElement）で
 *   スクロールされる。CSS セレクタでは primaryColumn を指定しつつ、
 *   scrollContainerFinder で実際にスクロール可能な要素を探索する。
 *
 * フィード URL パターン:
 *   - /home (ホームタイムライン)
 *   - / (ルート。ログイン済みの場合はホームと同等)
 *   - /explore (トレンド/探索)
 *   上記は常時フィード扱い。
 *
 * オプショナルフィードパターン（設定で有効/無効を切り替え可能）:
 *   - /search (検索ページ)
 *   - /{username} (プロフィールページ)
 *
 * @see spec.md - FR-009, FR-004
 */

import type { SiteConfig } from "./types";

/**
 * スクロール可能な要素を探索する
 *
 * X のタイムラインでは、primaryColumn を含む親要素の中に
 * overflow-y: auto/scroll が設定されたスクロールコンテナが存在する。
 * DOM 構造の変更に対応するため、primaryColumn から上方向に探索して
 * 実際にスクロール可能な要素を特定する。
 *
 * フォールバックとして document.scrollingElement を使用する。
 */
function findScrollContainer(): Element | null {
  const primaryColumn = document.querySelector(
    '[data-testid="primaryColumn"]',
  );
  if (!primaryColumn) return document.scrollingElement;

  // primaryColumn から親要素を辿り、スクロール可能な要素を探す
  let current: Element | null = primaryColumn;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }

  // フォールバック: ページ全体のスクロール要素
  return document.scrollingElement;
}

export const xConfig: SiteConfig = {
  name: "x",
  hostPattern: /^(www\.)?(x\.com|twitter\.com)$/,
  feedUrlPatterns: [/^\/home\/?$/, /^\/$/, /^\/explore\/?$/],
  scrollContainerSelector: '[data-testid="primaryColumn"]',
  scrollContainerFinder: findScrollContainer,
  optionalFeedPatterns: [
    {
      key: "search",
      label: "検索",
      patterns: [/^\/search/],
    },
    {
      key: "profile",
      label: "プロフィール",
      patterns: [
        /^\/(?!home$|explore$|search|settings|messages|notifications|i\/|compose|tos$|privacy$|login$|logout$|hashtag\/)[a-zA-Z0-9_]{1,15}(\/(?:with_replies|media|likes|highlights))?\/?$/,
      ],
    },
  ],
};
