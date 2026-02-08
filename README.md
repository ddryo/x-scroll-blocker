# X Scroll Blocker

X（旧 Twitter）のタイムラインの無限スクロールをブロックする Chrome 拡張機能です。

一定量スクロールすると自動的にストップをかけ、確認なしには続きを見られないようにすることで、無意識の長時間利用を防止します。

## 機能

- フィード画面のスクロールを一定距離で自動ブロック
- 続行には 2 段階の確認が必要（「まだ見たい」→「ほんとに？」）
- ブロックまでのスクロール距離をカスタマイズ可能（3〜50 画面分）
- ワンクリックで有効/無効を切り替え
- 検索ページ・プロフィールページの制限もオプションで設定可能

## インストール

### Chrome Web Store

（審査完了後にリンクを掲載予定）

### 手動インストール（開発者向け）

```bash
git clone https://github.com/ddryo/x-scroll-blocker.git
cd x-scroll-blocker
npm install
npm run build
```

1. Chrome で `chrome://extensions` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」から `dist` フォルダを選択

## 技術スタック

- Chrome Extension Manifest V3
- TypeScript
- Vite + vite-plugin-web-extension
- Vitest

## プライバシー

この拡張機能はユーザーデータを一切収集・送信しません。保存するのはブラウザ内の設定データ（有効/無効、閾値）のみです。

詳しくは [プライバシーポリシー](PRIVACY_POLICY.md) をご覧ください。

## ライセンス

MIT
