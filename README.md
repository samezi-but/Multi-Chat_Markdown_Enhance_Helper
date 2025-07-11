# Multi-Chat Markdown Enhance Helper (for ChatGPT & Gemini)

[English Version](README-en.md)

ChatGPT と Gemini に対応したマークダウン記法（`**太字**`、`*斜体*`）を自動的に正しい HTML タグに変換するブラウザ拡張機能です。
このソリューションのソースコードはChraude Code, Gemini, GPT-o3を利用したVibe Codingにより、実装をほぼ100％AIが行っています。

[Chrome Webストア](https://chromewebstore.google.com/detail/multi-chat-markdown-enhan/ejjikbphldcdeoheggnbkbnenoplijip)でリリースしました。

## 機能

- **自動変換**: `**太字**` → **太字**、`*斜体*` → *斜体*
- **リアルタイム処理**: 入力や表示と同時に自動変換
- **対応サイト**: ChatGPT (chatgpt.com) と Gemini (gemini.google.com)
- **デバッグモード**: 変換されたテキストをハイライト表示
- **多言語対応**: 日本語・英語インターフェース

## インストール

### Chrome Web Store（推奨）
1. Chrome Web Store から拡張機能をインストール
2. ChatGPT または Gemini にアクセス
3. 自動的に変換が開始されます

### 手動インストール
1. このリポジトリをダウンロードまたはクローン
2. Chrome の拡張機能ページ（`chrome://extensions/`）を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードしたフォルダを選択

## 使い方

1. **基本使用**: 拡張機能をインストール後、ChatGPT または Gemini でマークダウン記法を使用すると自動変換されます

2. **設定変更**: 
   - 拡張機能アイコンをクリックして設定パネルを開く
   - 自動修正の有効/無効を切り替え
   - デバッグモードの有効/無効を切り替え

3. **対応する記法**:
   - `**太字テキスト**` → **太字テキスト**
   - `*斜体テキスト*` → *斜体テキスト*

## 技術仕様

### アーキテクチャ
- **Manifest V3** 対応のブラウザ拡張機能
- **Content Scripts** による DOM 操作
- **MutationObserver** でリアルタイム監視
- **TreeWalker** による効率的な DOM 探索

### 主要ファイル
- `content.js`: メインの変換ロジック
- `popup.html/js`: 設定パネル UI
- `manifest.json`: 拡張機能の設定
- `_locales/`: 多言語対応ファイル

### 変換ロジック
- **太字**: `/\*\*([\s\S]+?)\*\*/g` → `<strong>$1</strong>`
- **斜体**: `/(^|[^*])\*([^*\s][\s\S]*?)\*(?=[^*]|$)/g` → `$1<em>$2</em>`

## 開発

### 前提条件
- Node.js 14.0.0 以上（ビルド用）
- Python 3.x（アイコン生成用）

### セットアップ
```bash
git clone https://github.com/samezi-but/Multi-Chat_Markdown_Enhance_Helper.git
cd Multi-Chat_Markdown_Enhance_Helper
```

### ビルドコマンド

#### 配布用ビルド
```bash
# 基本ビルド（releaseフォルダに配布用ファイルを生成）
npm run build

# 開発用ビルド
npm run dev

# リリース用ビルド（ビルド + ZIP作成）
npm run release
```

#### 個別コマンド
```bash
# releaseフォルダのクリーンアップ
npm run clean

# ファイルコピーのみ
npm run build:copy

# manifest.jsonの検証
npm run build:validate

# ZIPファイル作成（ビルド後に実行）
npm run zip
```

#### ビルドの仕組み
- **含まれるファイル**: `manifest.json`, `content.js`, `popup.*`, `_locales/`, `icons/`
- **除外ファイル**: 開発用ファイル（`.git`, `README.md`, `build.js`, `LICENSE`等）
- **自動生成**: `release-info.json`（バージョン、ビルド日時等の情報）
- **バリデーション**: manifest.jsonの必須フィールドチェック

### アイコン生成
```bash
cd icons
python create_icons.py
```

### テスト
1. 拡張機能を Chrome にロード
2. ChatGPT または Gemini にアクセス
3. マークダウン記法を入力してテスト
4. デバッグモードで変換結果を確認

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/AmazingFeature`）
3. 変更をコミット（`git commit -m 'Add some AmazingFeature'`）
4. ブランチにプッシュ（`git push origin feature/AmazingFeature`）
5. プルリクエストを作成

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 更新履歴

### v1.0.2
- **ストリーミング検知機能**: ChatGPT応答完了を待ってから変換し、表の破損を防止
- **CharacterData監視機能**: 詳細なテキスト変更監視（デバッグ用）
- **美しいデバッグUI**: グラデーション背景と階層的デザインの実装
- **プラットフォーム最適化**: ChatGPTとGeminiの厳格な分離処理
- **バグ修正**: テキストノードエラー、未定義関数エラーの解決
- **MIT ライセンス**: オープンソース化
- **完全多言語対応**: 全UIの英語・日本語サポート

### v1.0.1
- 多言語対応（日本語・英語）
- UI の改善  
- 安定性の向上

### v1.0.0
- 初回リリース
- ChatGPT と Gemini 対応
- 基本的なマークダウン変換機能
