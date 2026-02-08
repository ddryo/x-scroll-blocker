// Service Worker エントリーポイント

/**
 * Content Script からのメッセージを処理する
 *
 * 対応メッセージ:
 * - { type: "CLOSE_TAB" }: 送信元タブを閉じる
 */
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "CLOSE_TAB" && sender.tab?.id != null) {
    chrome.tabs.remove(sender.tab.id);
  }
});
