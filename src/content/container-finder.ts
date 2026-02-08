/**
 * スクロールコンテナ検出モジュール
 *
 * SPA サイトではスクロールコンテナがページ読み込み後に遅延生成される場合がある。
 * MutationObserver + ポーリングでコンテナが DOM に追加されるのを待機する。
 *
 * @see spec.md - FR-009: サイト固有スクロールコンテナ検出
 */

import type { SiteConfig } from "./sites/types";

/** スクロールコンテナ待機の最大時間（ms） */
export const CONTAINER_WAIT_TIMEOUT = 5000;

/** スクロールコンテナ待機のポーリング間隔（ms） */
export const CONTAINER_POLL_INTERVAL = 500;

/** 待機リソースの管理オブジェクト */
export interface ContainerWaitHandle {
  /** 待機結果を取得する Promise */
  promise: Promise<Element | null>;
  /** 待機を中断する */
  cancel: () => void;
}

/**
 * スクロールコンテナを即時検索する
 *
 * SiteConfig の scrollContainerSelector で検索し、
 * 見つからない場合は scrollContainerFinder を試す。
 * サイト固有のセレクタで見つからない場合は null を返す。
 *
 * @param siteConfig - サイト固有設定
 * @returns スクロールコンテナ要素、見つからない場合は null
 */
export function findScrollContainer(siteConfig: SiteConfig): Element | null {
  // scrollContainerFinder がある場合はそちらを優先（スクロール可能な要素を返す）
  if (siteConfig.scrollContainerFinder) {
    const byFinder = siteConfig.scrollContainerFinder();
    if (byFinder) return byFinder;
  }

  // CSS セレクタで検索
  const bySelector = document.querySelector(
    siteConfig.scrollContainerSelector,
  );
  if (bySelector) return bySelector;

  return null;
}

/**
 * スクロールコンテナが DOM に追加されるのを待機する
 *
 * MutationObserver で body の childList を監視し、
 * コンテナが見つかったら resolve する。
 * ポーリングも併用して MutationObserver で拾えない変更にも対応する。
 * タイムアウト経過後は document.scrollingElement にフォールバックする。
 *
 * @param siteConfig - サイト固有設定
 * @returns 待機ハンドル（Promise + キャンセル関数）
 */
export function waitForScrollContainer(
  siteConfig: SiteConfig,
): ContainerWaitHandle {
  // まず即時検索
  const immediate = findScrollContainer(siteConfig);
  if (immediate) {
    return {
      promise: Promise.resolve(immediate),
      cancel: () => {},
    };
  }

  let observer: MutationObserver | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let resolved = false;

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  let resolvePromise: (value: Element | null) => void;

  const promise = new Promise<Element | null>((resolve) => {
    resolvePromise = resolve;
  });

  const finish = (element: Element | null) => {
    if (resolved) return;
    resolved = true;
    cleanup();
    resolvePromise(element);
  };

  // MutationObserver で DOM 変更を監視
  observer = new MutationObserver(() => {
    const container = findScrollContainer(siteConfig);
    if (container) {
      finish(container);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // ポーリングによる補助的な検索
  intervalId = setInterval(() => {
    if (resolved) {
      clearInterval(intervalId!);
      return;
    }
    const container = findScrollContainer(siteConfig);
    if (container) {
      finish(container);
    }
  }, CONTAINER_POLL_INTERVAL);

  // タイムアウト: フォールバックコンテナで解決
  timeoutId = setTimeout(() => {
    const fallback = document.scrollingElement ?? document.documentElement;
    finish(fallback);
  }, CONTAINER_WAIT_TIMEOUT);

  const cancel = () => {
    if (!resolved) {
      resolved = true;
      cleanup();
      resolvePromise(null);
    }
  };

  return { promise, cancel };
}
