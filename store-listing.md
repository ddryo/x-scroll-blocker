# Chrome Web Store 掲載情報

## 基本情報

- **拡張機能名**: X Scroll Blocker
- **カテゴリ**: Productivity（生産性向上）
- **言語**: Japanese / English

---

## 短い説明（manifest.json / 132文字以内）

**EN**: Block infinite scrolling on X (Twitter) and take back control of your time.

**JA**: X (Twitter) の無限スクロールをブロックし、時間を取り戻しましょう。

---

## 詳細な説明

### 日本語

X（旧 Twitter）のタイムラインを延々とスクロールしてしまう。気づけば何十分も経っていた——そんな経験はありませんか？

X Scroll Blocker は、X のフィードで一定量スクロールすると自動的にストップをかけ、「本当に続けますか？」と問いかける Chrome 拡張機能です。

**主な機能:**
• フィード画面のスクロールを一定距離で自動ブロック
• 続けるには2段階の確認が必要（「まだ見たい」→「ほんとに？」）
• ブロックまでのスクロール距離をカスタマイズ可能（3〜50画面分）
• ワンクリックで有効/無効を切り替え
• 検索ページ・プロフィールページの制限もオプションで設定可能

**プライバシー重視:**
• 閲覧データは一切収集しません
• 保存するのは設定データ（有効/無効、スクロール閾値）のみ
• 外部サーバーへの通信は一切ありません
• オープンソース

**対象ページ:**
• X (x.com / twitter.com) のホーム・タイムライン
• オプションで検索ページ・プロフィールページにも対応

無限スクロールの誘惑を断ち切り、意識的なブラウジングを始めましょう。

### English

Do you find yourself endlessly scrolling through X (formerly Twitter), losing track of time? You're not alone.

X Scroll Blocker automatically pauses your feed after a set amount of scrolling and asks: "Do you really want to continue?"

**Key Features:**
• Automatically blocks scrolling after a configurable distance
• Two-step confirmation to continue ("Keep browsing" → "Are you sure?")
• Customizable scroll threshold (3–50 screens)
• One-click toggle to enable/disable
• Optional blocking on search and profile pages

**Privacy First:**
• No browsing data is collected — ever
• Only your preferences (on/off, threshold) are saved locally
• Zero external network requests
• Open source

**Supported Pages:**
• X (x.com / twitter.com) home timeline
• Optionally: search and profile pages

Break free from infinite scrolling and browse with intention.

---

## プライバシーへの取り組み（Chrome Web Store 用）

### Single Purpose Description

This extension blocks infinite scrolling on X (Twitter) by pausing the feed after a user-defined scroll distance and displaying a confirmation overlay.

### Permission Justification

| 権限 | 理由 |
|------|------|
| `storage` | ユーザーの設定（有効/無効、スクロール閾値）を保存するため |
| `host_permissions: *://*.x.com/*`, `*://*.twitter.com/*` | X のフィードページでスクロール監視とブロック UI を表示するため |

### Data Usage（デベロッパーダッシュボードのチェック項目）

- **Personally identifiable information**: No
- **Health information**: No
- **Financial and payment information**: No
- **Authentication information**: No
- **Personal communications**: No
- **Location**: No
- **Web history**: No
- **User activity**: No
- **Website content**: No

→ 全て「収集しない」を選択

---

## スクリーンショットの準備（自分で撮影）

1. **ブロック画面**: オーバーレイが表示された状態の X タイムライン
2. **確認ステップ**: 「ほんとに？まだ時間を無駄にしますか？」が表示された状態
3. **ポップアップ UI**: 設定画面（トグル・スライダー）
4. **通常時**: 制限なくスクロールしている X タイムライン（Before）

サイズ: 1280x800 または 640x400（PNG / JPEG）
