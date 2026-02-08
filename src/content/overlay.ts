/**
 * オーバーレイ UI 生成モジュール
 *
 * スクロールブロック時に表示するオーバーレイ UI を Shadow DOM 内に構築する。
 * Shadow DOM でカプセル化することで、ホストサイトのスタイルとの干渉を防ぐ。
 *
 * @see spec.md - FR-010: オーバーレイ UI
 * @see spec.md - NFR-006: サイトの基本操作を妨げない
 */

/** Shadow DOM ホスト要素の ID */
const HOST_ELEMENT_ID = "isb-overlay-host";

/** オーバーレイの CSS スタイル */
const OVERLAY_STYLES = `
  :host {
    all: initial;
  }

  .isb-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483646;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif;
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .isb-overlay.isb-visible {
    opacity: 1;
  }

  .isb-overlay.isb-hidden {
    display: none;
  }

  .isb-content {
    background: rgba(32, 35, 39, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 48px 40px 40px;
    max-width: 380px;
    width: 88%;
    text-align: center;
    box-shadow:
      0 24px 80px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    pointer-events: auto;
    transform: translateY(8px) scale(0.98);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .isb-overlay.isb-visible .isb-content {
    transform: translateY(0) scale(1);
  }

  .isb-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: rgba(29, 155, 240, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .isb-icon svg {
    width: 24px;
    height: 24px;
    fill: #1d9bf0;
  }

  .isb-message {
    color: #e7e9ea;
    font-size: 17px;
    line-height: 1.5;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .isb-sub-message {
    color: #71767b;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 32px 0;
  }

  .isb-button-container {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .isb-button {
    border: none;
    border-radius: 9999px;
    padding: 12px 28px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
    line-height: 1;
    letter-spacing: -0.01em;
    min-width: 120px;
  }

  .isb-button:focus {
    outline: 2px solid #1d9bf0;
    outline-offset: 2px;
  }

  .isb-button-close {
    background: #e7e9ea;
    color: #0f1419;
  }

  .isb-button-close:hover {
    background: #d6d9db;
  }

  .isb-button-close:active {
    background: #c4c7c9;
  }

  .isb-button-continue {
    background: rgba(255, 255, 255, 0.08);
    color: #71767b;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .isb-button-continue:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #e7e9ea;
  }

  .isb-button-continue:active {
    background: rgba(255, 255, 255, 0.16);
  }
`;

/** コーヒーアイコン SVG @phosphoricons */
const PAUSE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M80,56V24a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,120,64Zm32,0a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,152,64Zm96,56v8a40,40,0,0,1-37.51,39.91,96.59,96.59,0,0,1-27,40.09H208a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16H56.54A96.3,96.3,0,0,1,24,136V88a8,8,0,0,1,8-8H208A40,40,0,0,1,248,120ZM200,96H40v40a80.27,80.27,0,0,0,45.12,72h69.76A80.27,80.27,0,0,0,200,136Zm32,24a24,24,0,0,0-16-22.62V136a95.78,95.78,0,0,1-1.2,15A24,24,0,0,0,232,128Z"></path></svg>`;

/** オーバーレイ要素への参照 */
let hostElement: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let overlayElement: HTMLElement | null = null;

/** 「続きを見る」ボタン押下時のコールバック */
type ContinueCallback = () => void;

/** 最新の onContinue コールバック（再利用時にも常に最新を参照） */
let currentOnContinue: ContinueCallback = () => {};

/** 確認ステップ管理用の要素参照 */
let messageEl: HTMLParagraphElement | null = null;
let subMessageEl: HTMLParagraphElement | null = null;
let continueButtonEl: HTMLButtonElement | null = null;
let isConfirmStep = false;

/**
 * Shadow DOM ホスト要素とオーバーレイ UI を作成する
 *
 * 既にホスト要素が存在する場合は再利用し、コールバックのみ更新する。
 *
 * @param onContinue - 「続きを見る」ボタン押下時のコールバック
 */
export function createOverlay(onContinue: ContinueCallback): void {
  // コールバックは常に最新を保持
  currentOnContinue = onContinue;

  // 既存のホスト要素がある場合は再利用（コールバックは上で更新済み）
  if (hostElement && document.body.contains(hostElement)) {
    return;
  }

  // ホスト要素を作成
  hostElement = document.createElement("div");
  hostElement.id = HOST_ELEMENT_ID;
  // ホスト要素自体はレイアウトに影響を与えない
  hostElement.style.position = "fixed";
  hostElement.style.top = "0";
  hostElement.style.left = "0";
  hostElement.style.width = "0";
  hostElement.style.height = "0";
  hostElement.style.overflow = "visible";
  hostElement.style.zIndex = "2147483646";
  hostElement.style.pointerEvents = "none";

  // Shadow DOM を作成
  shadowRoot = hostElement.attachShadow({ mode: "open" });

  // スタイルを挿入
  const styleEl = document.createElement("style");
  styleEl.textContent = OVERLAY_STYLES;
  shadowRoot.appendChild(styleEl);

  // オーバーレイ UI を構築
  overlayElement = document.createElement("div");
  overlayElement.className = "isb-overlay isb-hidden";

  const contentEl = document.createElement("div");
  contentEl.className = "isb-content";

  const iconEl = document.createElement("div");
  iconEl.className = "isb-icon";
  iconEl.innerHTML = PAUSE_ICON_SVG;

  messageEl = document.createElement("p");
  messageEl.className = "isb-message";
  messageEl.textContent = "やるべきことが、他にありませんか？";

  subMessageEl = document.createElement("p");
  subMessageEl.className = "isb-sub-message";
  subMessageEl.textContent =
    "もう十分でしょう？これ以上時間を無駄にしないで下さい。";

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "isb-button-container";

  const closeButtonEl = document.createElement("button");
  closeButtonEl.className = "isb-button isb-button-close";
  closeButtonEl.textContent = "Xを閉じる";
  closeButtonEl.type = "button";
  closeButtonEl.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
  });

  continueButtonEl = document.createElement("button");
  continueButtonEl.className = "isb-button isb-button-continue";
  continueButtonEl.textContent = "まだ見たい";
  continueButtonEl.type = "button";
  continueButtonEl.addEventListener("click", () => {
    if (!isConfirmStep) {
      // 確認ステップに切り替え
      isConfirmStep = true;
      if (messageEl) messageEl.textContent = "ほんとに？";
      if (subMessageEl)
        subMessageEl.textContent = "まだ時間を無駄にしますか？";
      if (continueButtonEl) continueButtonEl.textContent = "はい、続ける";
    } else {
      // 確認済み → 実際に続行
      currentOnContinue();
    }
  });

  buttonContainer.appendChild(closeButtonEl);
  buttonContainer.appendChild(continueButtonEl);

  contentEl.appendChild(iconEl);
  contentEl.appendChild(messageEl);
  contentEl.appendChild(subMessageEl);
  contentEl.appendChild(buttonContainer);
  overlayElement.appendChild(contentEl);
  shadowRoot.appendChild(overlayElement);

  // DOM に追加
  document.body.appendChild(hostElement);
}

/**
 * オーバーレイを表示する
 *
 * createOverlay() が先に呼ばれている必要がある。
 */
export function showOverlay(): void {
  if (!overlayElement || !hostElement) return;

  // 確認ステップを初期状態にリセット
  isConfirmStep = false;
  if (messageEl) messageEl.textContent = "やるべきことが、他にありませんか？";
  if (subMessageEl)
    subMessageEl.textContent =
      "もう十分でしょう？これ以上時間を無駄にしないで下さい。";
  if (continueButtonEl) continueButtonEl.textContent = "まだ見たい";

  overlayElement.classList.remove("isb-hidden");
  // 次フレームで opacity のトランジションを発火させる
  requestAnimationFrame(() => {
    overlayElement?.classList.add("isb-visible");
  });
}

/**
 * オーバーレイを非表示にする
 */
export function hideOverlay(): void {
  if (!overlayElement || !hostElement) return;

  overlayElement.classList.remove("isb-visible");
  overlayElement.classList.add("isb-hidden");
}

/**
 * オーバーレイを完全に破棄する
 *
 * DOM からホスト要素を削除し、内部参照をクリアする。
 */
export function destroyOverlay(): void {
  if (hostElement && document.body.contains(hostElement)) {
    document.body.removeChild(hostElement);
  }
  hostElement = null;
  shadowRoot = null;
  overlayElement = null;
  messageEl = null;
  subMessageEl = null;
  continueButtonEl = null;
  isConfirmStep = false;
  currentOnContinue = () => {};
}

/**
 * オーバーレイが現在表示中かどうかを返す
 *
 * @returns オーバーレイが表示中なら true
 */
export function isOverlayVisible(): boolean {
  if (!overlayElement) return false;
  return !overlayElement.classList.contains("isb-hidden");
}
