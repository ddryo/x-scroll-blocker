# タスクアーカイブ

完了したタスクの履歴。

## M1: プロジェクト基盤構築（2026-02-08 完了）

### T-M1-1: 開発環境セットアップ

| 項目 | 内容 |
|------|------|
| マイルストーン | M1 |
| 依存 | なし |
| 要件ID | なし |

Vite + TypeScript による Chrome 拡張機能の開発環境を構築。ビルド、開発サーバー、リント/フォーマットの設定を行い、開発の土台を整えた。

**作業内容:**
- `package.json` を作成し、必要な依存パッケージをインストール（vite, typescript, @crxjs/vite-plugin 等）
- `tsconfig.json` を作成（strict mode 有効、Chrome Extension 型定義を含む）
- `vite.config.ts` を作成（Chrome 拡張向けビルド設定）
- ESLint + Prettier の設定ファイルを作成
- `.gitignore` に `node_modules/`, `dist/` 等を追加

### T-M1-2: manifest.json の作成

| 項目 | 内容 |
|------|------|
| マイルストーン | M1 |
| 依存 | T-M1-1 |
| 要件ID | なし |

Manifest V3 形式の manifest.json を作成。Content Script と Service Worker の登録、最小限の権限設定を行った。

**作業内容:**
- manifest.json を作成（Manifest V3 形式）
- `host_permissions` に対象ドメインを設定
- `permissions` に `storage` を設定
- `content_scripts`, `background.service_worker`, `action` を設定

### T-M1-3: 共通型定義と定数ファイルの作成

| 項目 | 内容 |
|------|------|
| マイルストーン | M1 |
| 依存 | T-M1-1 |
| 要件ID | なし |

プロジェクト全体で使用する TypeScript 型定義（Settings, SiteConfig 等）と定数（デフォルト設定値）を定義した。

**作業内容:**
- `src/shared/types.ts` に Settings 型、SiteConfig インターフェースを定義
- `src/shared/constants.ts` にデフォルト設定値を定義（閾値: 10、全サイト有効）
- `src/content/sites/types.ts` に SiteConfig インターフェースの詳細を定義
- メッセージング用の型定義

### T-M1-4: chrome.storage ラッパーの実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M1 |
| 依存 | T-M1-2 |
| 要件ID | FR-008 |

chrome.storage.sync の読み書きをラップするユーティリティモジュールを実装。デフォルト値のマージや型安全なアクセスを提供した。

**作業内容:**
- `src/shared/storage.ts` を作成
- `getSettings()`, `saveSettings()`, `onSettingsChanged()` 関数を実装

---

## M2: コアスクロールブロック機能（2026-02-08 完了）

### T-M2-1: SiteConfig インターフェースとサイト検出ロジックの実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M1-3 |
| 要件ID | FR-009 |

現在のページがどのサイトに該当するかを判定し、対応する SiteConfig を返すロジックを実装した。

**作業内容:**
- `src/content/sites/types.ts` に SiteConfig インターフェースの完全な定義
- サイト登録用のレジストリを作成
- `getCurrentSiteConfig(hostname)` 関数を実装

### T-M2-2: スクロール距離監視モジュールの実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M2-1 |
| 要件ID | FR-001 |

スクロールコンテナに throttle 付きのスクロールイベントリスナーを設置し、スクロール距離を画面高さの倍数で計測するモジュールを実装した。

**作業内容:**
- `src/content/scroll-monitor.ts` を作成
- throttle ユーティリティ関数を実装（100ms 間隔）
- `ScrollMonitor` クラスを実装（start, reset, stop メソッド）

### T-M2-3: スクロールブロッカーとオーバーレイ UI の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M2-2 |
| 要件ID | FR-002, FR-010 |

スクロール閾値到達時にスクロールを停止し、メッセージと「続きを見る」ボタンを含むオーバーレイを表示。Shadow DOM でカプセル化した。

**作業内容:**
- `src/content/overlay.ts` を作成（Shadow DOM ホスト要素、オーバーレイ UI）
- `src/content/blocker.ts` を作成（block/unblock メソッド）
- 半透明背景のオーバーレイデザイン

### T-M2-4: ブロック解除とカウンターリセット機能の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M2-3 |
| 要件ID | FR-003 |

「続きを見る」ボタンのクリックイベントを処理し、スクロールブロックを解除。解除後はカウンターをリセットし、再ブロック可能にした。

**作業内容:**
- ボタンクリック時: `blocker.unblock()` → `scrollMonitor.reset()` のフロー実装
- ブロック→解除→再ブロックのサイクル動作確認

### T-M2-5: フィードページ判定と SPA 遷移検知モジュールの実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M2-1 |
| 要件ID | FR-004, FR-005 |

現在の URL がフィードページかどうかを判定し、SPA のページ遷移を検知するモジュールを実装した。

**作業内容:**
- `src/content/page-detector.ts` を作成
- `isFeedPage(url, siteConfig)` 関数を実装
- SPA 遷移検知（History API ラップ + popstate + MutationObserver 補助）

### T-M2-6: Content Script エントリーポイントの統合

| 項目 | 内容 |
|------|------|
| マイルストーン | M2 |
| 依存 | T-M1-4, T-M2-4, T-M2-5 |
| 要件ID | FR-001, FR-002, FR-003, FR-004 |

各モジュールを統合し、Content Script のエントリーポイントとして全体のライフサイクルを制御するようにした。

**作業内容:**
- `src/content/index.ts` を作成
- 初期化フロー: サイト検出→設定読み込み→フィード判定→監視開始
- ページ遷移時フロー: 監視停止→ブロック解除→再判定→再開始
- 設定変更時フロー: chrome.storage.onChanged で即時反映

---

## M3: サイト固有対応（X, YouTube, TikTok）（2026-02-08 完了）

### T-M3-1: X (Twitter) 固有設定の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M3 |
| 依存 | T-M2-6 |
| 要件ID | FR-009, FR-004 |

X (Twitter) の DOM 構造を分析し、SiteConfig を実装した。

**作業内容:**
- `src/content/sites/x.ts` を作成
- スクロールコンテナ特定、フィード URL パターン定義（home 等）
- 除外パターン定義（/status/, /search, /settings 等）

### T-M3-2: YouTube 固有設定の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M3 |
| 依存 | T-M2-6 |
| 要件ID | FR-009, FR-004 |

YouTube の DOM 構造を分析し、SiteConfig を実装した。

**作業内容:**
- `src/content/sites/youtube.ts` を作成
- スクロールコンテナ特定、フィード URL パターン定義（home, trending 等）
- 除外パターン定義（/watch, /results, /channel/ 等）

### T-M3-3: TikTok 固有設定の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M3 |
| 依存 | T-M2-6 |
| 要件ID | FR-009, FR-004 |

TikTok の DOM 構造を分析し、SiteConfig を実装した。

**作業内容:**
- `src/content/sites/tiktok.ts` を作成
- スクロールコンテナ特定、フィード URL パターン定義（top, foryou 等）
- 除外パターン定義（/search, /@user/video/ 等）

### T-M3-4: 各サイトでの動作確認と調整

| 項目 | 内容 |
|------|------|
| マイルストーン | M3 |
| 依存 | T-M3-1, T-M3-2, T-M3-3 |
| 要件ID | FR-001 - FR-005 |

3サイト（X, YouTube, TikTok）すべてで実際にスクロールブロック機能を動作させ、問題点を修正した。

**作業内容:**
- 各サイトでの手動テスト（ブロック発動、解除、再ブロック、ページ遷移）
- DOM 構造変更への耐性確認
- エッジケース対応

---

## M4: ポップアップ UI と設定機能（2026-02-08 完了）

### T-M4-1: ポップアップ HTML/CSS の作成

| 項目 | 内容 |
|------|------|
| マイルストーン | M4 |
| 依存 | T-M1-4 |
| 要件ID | FR-006 |

拡張機能のポップアップ UI を作成。サイト別 ON/OFF トグルを含む設定画面を実装した。

**作業内容:**
- `src/popup/index.html`, `src/popup/popup.css`, `src/popup/popup.ts` を作成
- UI: ヘッダー、サイト別トグル（X / YouTube / TikTok）
- chrome.storage.sync との連携

### T-M4-2: 閾値カスタマイズ UI の追加

| 項目 | 内容 |
|------|------|
| マイルストーン | M4 |
| 依存 | T-M4-1 |
| 要件ID | FR-007 |

ポップアップ UI にスクロール閾値のカスタマイズ機能を追加した。

**作業内容:**
- 閾値設定セクション追加（スライダー/数値入力）
- 設定範囲: 3 - 50（画面高さの倍数）
- 変更時に chrome.storage.sync に保存

### T-M4-3: ポップアップと Content Script 間の設定同期の実装

| 項目 | 内容 |
|------|------|
| マイルストーン | M4 |
| 依存 | T-M4-2 |
| 要件ID | FR-006, FR-007, FR-008 |

ポップアップでの設定変更を Content Script に即座に反映する仕組みを実装した。

**作業内容:**
- chrome.storage.onChanged リスナーで設定変更検知
- サイト無効化時: 監視停止 + ブロック解除
- サイト有効化時: 監視開始
- 閾値変更時: 即時反映
- 複数タブ対応

---

## M5: 統合テストと仕上げ（2026-02-08 完了）

### T-M5-1: パフォーマンス検証

| 項目 | 内容 |
|------|------|
| マイルストーン | M5 |
| 依存 | T-M3-4, T-M4-3 |
| 要件ID | NFR-001, NFR-002 |

拡張機能が対象サイトのパフォーマンスに与える影響を検証し、最適化した。

**作業内容:**
- Chrome DevTools Performance タブでの計測
- throttle 動作確認（100ms 間隔）
- MutationObserver 監視範囲の確認
- メモリリーク検証

### T-M5-2: UX 検証

| 項目 | 内容 |
|------|------|
| マイルストーン | M5 |
| 依存 | T-M3-4, T-M4-3 |
| 要件ID | NFR-006 |

オーバーレイ表示時のユーザー体験を検証し、サイトの基本操作を妨げないことを確認した。

**作業内容:**
- ナビゲーション操作可能性の確認
- メッセージ・ボタンの適切さ確認
- レスポンシブ対応、ダークモード/ライトモード確認

### T-M5-3: アイコン・ストア掲載情報の準備と最終ビルド

| 項目 | 内容 |
|------|------|
| マイルストーン | M5 |
| 依存 | T-M5-1, T-M5-2 |
| 要件ID | なし |

Chrome Web Store への公開に向けて、アイコン、説明文、スクリーンショットなどの掲載情報を準備し、最終ビルドを生成した。

**作業内容:**
- 拡張機能アイコンの作成（16x16, 32x32, 48x48, 128x128）
- manifest.json にアイコン設定
- Chrome Web Store 用の説明文作成
- 本番ビルド生成・最終確認
