# プロジェクト仕様書

## 1. 概要

### 目的

SNS（X, YouTube, TikTok）の無限スクロールを強制的に中断し、ユーザーが意識的に「続きを見る」操作をしない限りスクロールを再開できないようにする Chrome 拡張機能を開発する。無限スクロールによる無意識の長時間利用を防ぎ、ユーザーのデジタルウェルビーイングを支援する。

### 対象ユーザー

- SNS の無限スクロールで時間を浪費していると感じている人
- 自分のスクリーンタイムを意識的にコントロールしたい人


## 2. 機能要件

| ID | 機能名 | 説明 | 優先度 | MVP |
|----|--------|------|--------|-----|
| FR-001 | スクロール距離監視 | 対象サイトのフィード画面でスクロール距離を計測し、閾値到達を検知する | Must | o |
| FR-002 | スクロールブロック | 閾値到達時に `overflow: hidden` でスクロールを停止し、オーバーレイを表示する | Must | o |
| FR-003 | ブロック解除 | 「続きを見る」ボタン押下でブロックを解除し、スクロール距離カウンターをリセットする | Must | o |
| FR-004 | フィードページ判定 | URL パターンでフィード画面（タイムライン）かどうかを判定し、フィード以外ではブロックしない | Must | o |
| FR-005 | SPA ページ遷移検知 | MutationObserver + History API 監視でページ遷移を検知し、遷移時にカウンターをリセットする | Must | o |
| FR-006 | サイト別 ON/OFF 設定 | ポップアップ UI から X / YouTube / TikTok 個別に有効・無効を切り替えられる | Must | o |
| FR-007 | 閾値カスタマイズ | スクロール量の閾値（画面高さの倍数）をポップアップ UI から変更できる | Should | o |
| FR-008 | 設定の永続化 | 設定を `chrome.storage.sync` に保存し、ブラウザ再起動後も維持する | Must | o |
| FR-009 | サイト固有スクロールコンテナ検出 | 各 SNS サイト固有の DOM 構造からスクロールコンテナを特定する | Must | o |
| FR-010 | オーバーレイ UI | ブロック時にメッセージとボタンを含むオーバーレイを表示する。サイト操作を妨げないデザインとする | Must | o |
| FR-011 | 対象サイト追加の拡張性 | 新しい SNS サイトを追加しやすいアーキテクチャにする | Could | - |

**優先度**: Must（必須）/ Should（推奨）/ Could（任意）


## 3. 技術スタック

| カテゴリ | 技術 | 選定理由 |
|----------|------|----------|
| プラットフォーム | Chrome Extension (Manifest V3) | 2026年現在の必須仕様。Service Worker ベースで性能・セキュリティに優れる |
| 言語 | TypeScript | 型安全性によりサイト固有ロジックの保守性を確保 |
| ビルドツール | Vite + vite-plugin-web-extension | Chrome 拡張のバンドルに対応。manifest.json からエントリーポイントを自動解決し、HMR で開発効率を確保 |
| スタイル | CSS（インラインスタイル or Shadow DOM） | Content Script から注入するため、サイトの既存スタイルとの競合を回避する必要がある |
| ストレージ | chrome.storage.sync | Chrome 同期対応のローカルストレージ。権限は `storage` のみで十分 |
| テスト | Vitest | Vite との親和性。ユニットテストで各サイト固有ロジックを検証 |
| リンター | ESLint v9 (Flat Config) + typescript-eslint | TypeScript の静的解析。eslint-config-prettier で Prettier との競合を回避 |
| フォーマッター | Prettier | コードスタイルの統一（セミコロンあり、ダブルクォート、タブ幅2） |


## 4. アーキテクチャ

### ディレクトリ構成

```
infinite-scroll-blocker/
├── src/
│   ├── background/         # Service Worker
│   │   └── index.ts
│   ├── content/            # Content Script
│   │   ├── index.ts        # エントリーポイント（ライフサイクル制御・モジュール統合）
│   │   ├── scroll-monitor.ts   # スクロール距離監視（ScrollMonitor クラス、throttle ユーティリティ）
│   │   ├── blocker.ts      # ブロック制御（overflow: hidden + オーバーレイ連携）
│   │   ├── overlay.ts      # オーバーレイ UI 生成（Shadow DOM カプセル化）
│   │   ├── page-detector.ts    # フィードページ判定（isFeedPage）+ SPA遷移検知（PageDetector クラス）
│   │   ├── container-finder.ts # スクロールコンテナ検出（即時検索 + MutationObserver 待機）
│   │   └── sites/          # サイト固有ロジック
│   │       ├── types.ts    # SiteConfig インターフェース定義
│   │       ├── registry.ts # サイトレジストリ（getCurrentSiteConfig / getAllSiteConfigs）
│   │       ├── x.ts        # X (Twitter) 固有設定
│   │       ├── youtube.ts  # YouTube 固有設定
│   │       └── tiktok.ts   # TikTok 固有設定
│   ├── icons/              # 拡張機能アイコン
│   │   └── icon.svg        # ベクターアイコン（盾 + 一時停止マーク、#4A90D9）
│   ├── popup/              # ポップアップ UI
│   │   ├── index.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── shared/             # 共通ユーティリティ
│   │   ├── constants.ts    # デフォルト設定値、ストレージキー定義
│   │   ├── storage.ts      # chrome.storage ラッパー（getSettings / saveSettings / onSettingsChanged）
│   │   └── types.ts        # 共通型定義（SiteId, SiteSettings, Settings）
│   └── manifest.json
├── tests/                  # テストファイル
│   ├── setup.test.ts       # テストランナー動作確認
│   ├── shared/
│   │   └── storage.test.ts # chrome.storage ラッパーのユニットテスト
│   ├── popup/
│   │   ├── popup.test.ts          # ポップアップ UI のユニットテスト
│   │   └── settings-sync.test.ts  # 設定同期の統合テスト
│   └── content/            # Content Script 関連テスト
│       ├── sites/
│       │   ├── registry.test.ts   # サイトレジストリのユニットテスト
│       │   ├── youtube.test.ts    # YouTube 固有設定のユニットテスト
│       │   └── tiktok.test.ts     # TikTok 固有設定のユニットテスト
│       ├── scroll-monitor.test.ts # ScrollMonitor のユニットテスト
│       ├── blocker.test.ts        # ブロック制御のユニットテスト
│       ├── overlay.test.ts        # オーバーレイ UI のユニットテスト
│       ├── page-detector.test.ts  # フィードページ判定・SPA 遷移検知のユニットテスト
│       ├── container-finder.test.ts # スクロールコンテナ検出のユニットテスト
│       ├── spa-navigation.test.ts   # SPA 遷移時のコンテナ再検出統合テスト
│       └── block-cycle.test.ts    # ブロック→解除→再ブロックの統合テスト
│   ├── performance/
│   │   └── throttle-perf.test.ts  # パフォーマンス検証テスト（NFR-001, NFR-002）
│   └── ux/
│       └── overlay-ux.test.ts     # UX 検証テスト（NFR-006）
├── .prettierrc             # Prettier 設定
├── .prettierignore         # Prettier 除外設定
├── eslint.config.js        # ESLint Flat Config
├── package.json
├── tsconfig.json
├── vite.config.ts          # Vite ビルド設定（vite-plugin-web-extension 使用）
└── vitest.config.ts        # Vitest テスト設定
```

### コンポーネント構成

**Content Script 層（メインロジック）**

1. `index` (エントリーポイント) - 全モジュールを統合し、Content Script のライフサイクルを制御する。初期化・SPA 遷移・設定変更の各フェーズを管理する
2. `page-detector` - 現在の URL がフィードページかどうかを判定する `isFeedPage` 関数と、SPA 遷移を検知する `PageDetector` クラスを提供する。SPA 遷移検知は History API ラップ + popstate リスナー + MutationObserver（title 変更監視）の 3 手段を使用する
3. `scroll-monitor` - `ScrollMonitor` クラスがスクロールコンテナに throttle (100ms) 付きイベントリスナーを設置し、スクロール距離を画面高さの倍数で計測する。閾値到達時にコールバックを呼び出す。`throttle` ユーティリティ関数も同モジュールで提供する
4. `blocker` - `block` 関数でスクロールコンテナに `overflow: hidden` を適用してスクロールを停止し、オーバーレイを表示する。`unblock` 関数で解除時にスタイルを復元する。`isBlocked` で現在のブロック状態を確認できる
5. `overlay` - ブロック時に表示する UI 要素を Shadow DOM 内に構築する。`createOverlay` / `showOverlay` / `hideOverlay` / `destroyOverlay` / `isOverlayVisible` の各関数を提供する
6. `sites/registry` - 登録されたサイト設定を管理し、`getCurrentSiteConfig(hostname)` でホスト名からサイトを検出する。`getAllSiteConfigs()` で全登録サイトの一覧を取得できる。新しいサイトの追加は `siteConfigs` 配列にインポートするだけでよい
7. `sites/*` (x, youtube, tiktok) - サイトごとのスクロールコンテナセレクタ、フィード URL パターン、ホスト名パターンを `SiteConfig` インターフェースに準拠して定義する。各サイトは `scrollContainerFinder` を実装し、DOM 構造を動的に探索してスクロール可能な要素を特定する（`scrollContainerSelector` のフォールバック兼補完）
8. `container-finder` - スクロールコンテナの検出を担当する。`findScrollContainer(siteConfig)` で即時検索（`scrollContainerFinder` を優先し、見つからない場合に CSS セレクタにフォールバック）を行い、`waitForScrollContainer(siteConfig)` で MutationObserver + ポーリングによる非同期待機を提供する。タイムアウト（5秒）後は `document.scrollingElement` にフォールバックする。キャンセル可能な `ContainerWaitHandle` を返す

**Service Worker 層**

- 拡張機能のライフサイクル管理
- Content Script と Popup 間のメッセージ中継（必要に応じて）

**Popup 層**

1. `popup.ts` (エントリーポイント) - DOMContentLoaded で初期化。`getSettings()` で設定を読み込み、サイト別トグルと閾値スライダーの状態を反映する。トグル変更時・スライダー変更時に `saveSettings()` で `chrome.storage.sync` に即座に保存する。`chrome.runtime` メッセージングは使用しない
2. `index.html` - ヘッダー、サイト別トグル（X / YouTube / TikTok）、閾値スライダー（3-50、「N 画面分」表示）の UI を定義する
3. `popup.css` - 320px 幅のモダンなデザイン。カスタムトグルスイッチ（accent-color: #4A90D9）。focus-visible によるアクセシビリティ対応

### Content Script ライフサイクル

Content Script (`content/index.ts`) は以下の 3 つのフェーズでライフサイクルを管理する。

**1. 初期化フェーズ（ページ読み込み時）**

1. `getCurrentSiteConfig(hostname)` で対象サイトかどうかを判定（対象外なら即終了）
2. `getSettings()` で `chrome.storage.sync` から設定を読み込み
3. `isFeedPage()` でフィードページか判定し、フィードなら `startMonitoring()` を呼び出す
   - `findScrollContainer(siteConfig)` でスクロールコンテナを即時検索
   - 即時に見つかった場合は `ScrollMonitor.start()` で監視を開始
   - 見つからない場合は `waitForScrollContainer(siteConfig)` で MutationObserver + ポーリングによる非同期待機を行い、コンテナが DOM に追加されるのを待つ（タイムアウト 5 秒）
4. `PageDetector.start()` で SPA 遷移検知を開始
5. `onSettingsChanged()` で設定変更リスナーを登録

**2. SPA 遷移フェーズ**

1. `PageDetector` が URL 変更を検知しコールバックを発火
2. `stopMonitoring()` で既存の `ScrollMonitor` を停止し、コンテナ待機中であればキャンセルし、ブロック中であれば `unblock()` で解除
3. `startMonitoring()` で新しいページのフィード判定とスクロールコンテナ検出を再実行（非同期待機を含む）

**3. 設定変更フェーズ（`chrome.storage.onChanged` 経由）**

- サイト無効化: 監視停止 + ブロック解除
- サイト有効化: 監視を開始
- 閾値変更: 監視を停止して新しい閾値で再開始

**クリーンアップ**: `pagehide` イベントで全リスナー・監視・オーバーレイを破棄する。

### コンポーネント間の流れ

```
[page-detector] --ページ判定--> [container-finder] --コンテナ取得--> [scroll-monitor] --閾値到達--> [blocker] --表示--> [overlay]
       |                              |                                    |                           |
       |  SPA遷移検知                 |  非同期待機/即時検索               |  カウンターリセット        |  ブロック解除
       +---> [index] <---------------+------------------------------------+---------------------------+
                ^
[popup] --設定変更--> [chrome.storage.sync] --onChanged--> [index] --即時反映--> [scroll-monitor / blocker]
```


## 5. インターフェース

### 設定同期 API（chrome.storage）

設定の同期には `chrome.storage.sync` と `chrome.storage.onChanged` を使用する。`chrome.runtime` のメッセージングは使用しない。

| 操作 | API | 説明 | 対応要件 |
|------|-----|------|----------|
| 設定読み込み（初期化時） | `chrome.storage.sync.get()` | Content Script 初期化時にデフォルト値とマージして読み込む | FR-008 |
| 設定保存 | `chrome.storage.sync.set()` | Popup から設定を保存 | FR-006, FR-007 |
| 設定変更検知 | `chrome.storage.onChanged` | Content Script 側で設定変更をリアルタイムに検知し即時反映する | FR-006, FR-007 |

### データモデル

**SiteId（サイト識別子）**

```typescript
type SiteId = "x" | "youtube" | "tiktok";
```

**SiteSettings（サイトごとの有効/無効設定）**

| フィールド | 型 | デフォルト値 | 説明 |
|-----------|-----|-------------|------|
| enabled | boolean | true | ブロック有効/無効 |

**Settings（chrome.storage.sync に保存）**

| フィールド | 型 | デフォルト値 | 説明 |
|-----------|-----|-------------|------|
| sites | Record\<SiteId, SiteSettings\> | 全サイト enabled: true | サイト別の有効/無効設定 |
| sites.x.enabled | boolean | true | X のブロック有効/無効 |
| sites.youtube.enabled | boolean | true | YouTube のブロック有効/無効 |
| sites.tiktok.enabled | boolean | true | TikTok のブロック有効/無効 |
| threshold | number | 10 | スクロール閾値（画面高さの倍数） |

ストレージキーは `"settings"` を使用する（`STORAGE_KEY` 定数で定義）。

**SiteConfig（各サイト固有設定）**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| name | SiteId | o | サイト識別名（`"x" \| "youtube" \| "tiktok"` に限定） |
| hostPattern | RegExp | o | ホスト名マッチパターン |
| feedUrlPatterns | RegExp[] | o | フィードページ判定用 URL パターン |
| scrollContainerSelector | string | o | スクロールコンテナの CSS セレクタ |
| scrollContainerFinder | () => Element \| null | - | セレクタで取得できない場合の代替取得関数（オプショナル） |


## 6. 制約

### 非機能要件

| ID | カテゴリ | 要件 |
|----|----------|------|
| NFR-001 | パフォーマンス | スクロールイベントの throttle 間隔は 100ms 以下。体感的な遅延を与えない |
| NFR-002 | パフォーマンス | MutationObserver の監視範囲は必要最小限（URL バー変更検知のみ） |
| NFR-003 | セキュリティ | host_permissions は対象ドメイン（x.com, twitter.com, youtube.com, tiktok.com）のみに限定 |
| NFR-004 | プライバシー | 閲覧データは一切収集しない。保存するのは設定データのみ |
| NFR-005 | 互換性 | Chrome 最新安定版をサポート対象とする |
| NFR-006 | UX | オーバーレイはサイトの基本操作（ナビゲーション、ログアウト等）を妨げない |
| NFR-007 | 保守性 | サイト固有ロジックは独立モジュールとし、新サイト追加時に既存コードを変更しない |

### コーディング規約

- TypeScript strict mode を有効化（`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` も有効）
- ESLint v9 Flat Config + typescript-eslint + eslint-config-prettier でコード品質を統一
- Prettier でフォーマット統一（セミコロンあり、ダブルクォート、タブ幅2、末尾カンマ all）
- サイト固有ロジックは `SiteConfig` インターフェースに準拠
- Content Script 内での外部リソース読み込み禁止（Manifest V3 の CSP に準拠）

### スコープ外

- Firefox / Safari など Chrome 以外のブラウザ対応
- モバイルアプリのスクロール制限
- スクロール以外の利用時間制限（タイマー機能など）
- SNS のコンテンツフィルタリング
- 利用統計やアナリティクス機能
- 対象 3 サイト（X, YouTube, TikTok）以外への対応（拡張性は確保するが MVP では対象外）
