# Modern Sabre AI Logger

フェンシング（サーブル）の試合記録・分析アプリ

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
`.env.local`ファイルを作成し、以下を設定してください：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

**注意**: AIコーチ機能を使用するには、OpenAI APIキーが必要です。取得方法は[OpenAI公式サイト](https://platform.openai.com/api-keys)を参照してください。

3. Supabaseデータベースのセットアップ
以下のテーブルを作成してください：

**matches テーブル:**
- id (uuid, primary key)
- opponent_name (text)
- my_color (text: 'red' or 'green')
- final_score_me (integer, default: 0)
- final_score_opponent (integer, default: 0)
- created_at (timestamp, default: now())

**points テーブル:**
- id (uuid, primary key)
- match_id (uuid, foreign key to matches.id)
- scorer (text: 'me' or 'opponent')
- situation (text: '4m', '4m後の攻撃', or '4m後のディフェンス')
- phrase (text)
- note (text, nullable)
- score_me_at_time (integer, not null)
- score_opponent_at_time (integer, not null)
- created_at (timestamp, default: now())

4. 開発サーバーの起動
```bash
npm run dev
```

## 機能

- **ホーム画面**: AIコーチからのレポート、新しい試合の記録、過去の試合履歴
- **AIコーチ分析**: OpenAI APIを使用した試合データの分析とアドバイス
- **試合設定**: 対戦相手の名前入力、ポジション選択（赤/緑）
- **試合中ロガー**: 審判器風スコアボード、タイマー、ポイント記録（シチュエーション・フレーズ・メモ）
- **履歴・詳細編集**: 試合のタイムライン表示、ポイントの編集機能

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API (GPT-4o-mini)
- Digital-7 Font (CDN)

