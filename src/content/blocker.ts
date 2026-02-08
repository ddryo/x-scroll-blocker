/**
 * ブロック制御モジュール
 *
 * スクロールコンテナに overflow: hidden を適用してスクロールを停止し、
 * オーバーレイを表示する。解除時にスタイルを復元する。
 *
 * @see spec.md - FR-002: スクロールブロック
 * @see spec.md - FR-003: ブロック解除
 */

import {
  createOverlay,
  showOverlay,
  hideOverlay,
  isOverlayVisible,
} from "./overlay";

/** ブロック対象コンテナの元の overflow スタイルを保持 */
let originalOverflow: string | null = null;

/** 現在ブロック中のコンテナ */
let blockedContainer: Element | null = null;

/** ブロック解除時のコールバック */
type UnblockCallback = () => void;

/**
 * スクロールをブロックする
 *
 * コンテナに overflow: hidden を適用し、オーバーレイを表示する。
 * 既にブロック中の場合は何もしない。
 *
 * @param container - ブロック対象のスクロールコンテナ
 * @param onUnblock - ブロック解除時に呼ばれるコールバック
 */
export function block(container: Element, onUnblock: UnblockCallback): void {
  // 既にブロック中なら何もしない
  if (blockedContainer) return;

  blockedContainer = container;

  // 現在の overflow を保存
  const htmlEl = container as HTMLElement;
  originalOverflow = htmlEl.style.overflow;

  // overflow: hidden を適用してスクロールを停止
  htmlEl.style.overflow = "hidden";

  // オーバーレイを作成・表示
  createOverlay(() => {
    unblock();
    onUnblock();
  });
  showOverlay();
}

/**
 * スクロールブロックを解除する
 *
 * 内部で保持しているブロック対象コンテナの overflow を元に戻し、オーバーレイを非表示にする。
 */
export function unblock(): void {
  if (!blockedContainer) return;

  // overflow を元に戻す
  const htmlEl = blockedContainer as HTMLElement;
  if (originalOverflow !== null) {
    htmlEl.style.overflow = originalOverflow;
  }

  // オーバーレイを非表示
  hideOverlay();

  // 状態をリセット
  originalOverflow = null;
  blockedContainer = null;
}

/**
 * 現在ブロック中かどうかを返す
 *
 * @returns ブロック中なら true
 */
export function isBlocked(): boolean {
  return blockedContainer !== null && isOverlayVisible();
}
