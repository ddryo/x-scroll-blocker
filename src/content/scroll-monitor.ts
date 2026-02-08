/**
 * スクロール距離監視モジュール
 *
 * スクロールコンテナに throttle 付きのスクロールイベントリスナーを設置し、
 * スクロール距離を画面高さの倍数で計測する。閾値に到達したときにコールバックを呼び出す。
 *
 * @see spec.md - FR-001: スクロール距離監視
 * @see spec.md - NFR-001: throttle 間隔 100ms 以下
 */

/** コールバック関数の型 */
export type ThresholdCallback = () => void;

/**
 * throttle ユーティリティ関数
 *
 * 指定した間隔（ms）で関数の実行を制限する。
 * 最初の呼び出しは即時実行し、以降は間隔が経過するまで実行を遅延する。
 *
 * @param fn - 実行する関数
 * @param interval - throttle 間隔（ミリ秒）
 * @returns throttle されたラッパー関数
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
): T {
  let lastCallTime = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: unknown[]) => {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (elapsed >= interval) {
      // 間隔が経過済み: 即時実行
      lastCallTime = now;
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      fn(...args);
    } else if (timerId === null) {
      // 間隔内でタイマー未設定: 残り時間後に実行をスケジュール
      timerId = setTimeout(() => {
        lastCallTime = Date.now();
        timerId = null;
        fn(...args);
      }, interval - elapsed);
    }
  };

  return throttled as T;
}

/** throttle 間隔（ミリ秒） - NFR-001 準拠 */
const THROTTLE_INTERVAL = 100;

/**
 * コンテナがドキュメントレベルのスクロール要素かどうかを判定する
 *
 * document.scrollingElement / document.documentElement / document.body の場合、
 * scroll イベントは要素自体ではなく window で発火するため、
 * イベントリスナーの設置先を切り替える必要がある。
 */
export function isDocumentScroller(element: Element): boolean {
  if (typeof document === "undefined") return false;
  return (
    element === document.scrollingElement ||
    element === document.documentElement ||
    element === document.body
  );
}

/**
 * スクロール距離監視クラス
 *
 * スクロールコンテナのスクロールイベントを監視し、
 * スクロール距離が閾値（画面高さの倍数）に達したときにコールバックを呼び出す。
 */
export class ScrollMonitor {
  /** 累積スクロール距離（px） */
  private accumulatedDistance = 0;

  /** 前回のスクロール位置 */
  private lastScrollTop = 0;

  /** 監視対象のコンテナ */
  private container: Element | null = null;

  /** 閾値（画面高さの倍数） */
  private threshold = 0;

  /** 閾値到達時のコールバック */
  private onThresholdReached: ThresholdCallback | null = null;

  /** throttle されたスクロールハンドラ */
  private throttledHandler: (() => void) | null = null;

  /** バインドされたイベントリスナー（解除用に保持） */
  private boundListener: (() => void) | null = null;

  /** window にリスナーを付けたかどうか */
  private usesWindowListener = false;

  /**
   * スクロール監視を開始する
   *
   * @param container - 監視対象のスクロールコンテナ
   * @param threshold - 閾値（画面高さの倍数）
   * @param onThresholdReached - 閾値到達時に呼ばれるコールバック
   */
  start(
    container: Element,
    threshold: number,
    onThresholdReached: ThresholdCallback,
  ): void {
    // 既存の監視を停止
    this.stop();

    this.container = container;
    this.threshold = threshold;
    this.onThresholdReached = onThresholdReached;
    this.accumulatedDistance = 0;
    this.lastScrollTop = container.scrollTop;

    this.throttledHandler = throttle(() => {
      this.handleScroll();
    }, THROTTLE_INTERVAL);

    this.boundListener = this.throttledHandler;

    // document.scrollingElement 等の場合は window でリッスン
    this.usesWindowListener = isDocumentScroller(container);
    if (this.usesWindowListener) {
      window.addEventListener("scroll", this.boundListener);
    } else {
      this.container.addEventListener("scroll", this.boundListener);
    }
  }

  /**
   * スクロール距離カウンターをリセットする
   *
   * 閾値到達後にブロック解除されたときなどに使用する。
   */
  reset(): void {
    this.accumulatedDistance = 0;
    if (this.container) {
      this.lastScrollTop = this.container.scrollTop;
    }
  }

  /**
   * スクロール監視を停止する
   *
   * イベントリスナーを解除し、内部状態をクリアする。
   */
  stop(): void {
    if (this.boundListener) {
      if (this.usesWindowListener) {
        window.removeEventListener("scroll", this.boundListener);
      } else if (this.container) {
        this.container.removeEventListener("scroll", this.boundListener);
      }
    }
    this.container = null;
    this.threshold = 0;
    this.onThresholdReached = null;
    this.throttledHandler = null;
    this.boundListener = null;
    this.accumulatedDistance = 0;
    this.lastScrollTop = 0;
    this.usesWindowListener = false;
  }

  /**
   * 現在のスクロール距離を画面高さの倍数で取得する
   *
   * @returns スクロール距離（画面高さの倍数）
   */
  getScrollDistance(): number {
    const viewportHeight = window.innerHeight;
    if (viewportHeight === 0) return 0;
    return this.accumulatedDistance / viewportHeight;
  }

  /**
   * スクロールイベントのハンドラ
   *
   * scrollTop の変化量を累積し、閾値に到達したらコールバックを呼ぶ。
   */
  private handleScroll(): void {
    if (!this.container || !this.onThresholdReached) return;

    const currentScrollTop = this.container.scrollTop;
    const delta = currentScrollTop - this.lastScrollTop;
    this.lastScrollTop = currentScrollTop;
    if (delta <= 0) return;
    this.accumulatedDistance += delta;

    const viewportHeight = window.innerHeight;
    if (viewportHeight === 0) return;

    const scrolledScreens = this.accumulatedDistance / viewportHeight;
    if (scrolledScreens >= this.threshold) {
      this.onThresholdReached();
    }
  }
}
