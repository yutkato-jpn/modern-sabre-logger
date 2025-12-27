# インストール手順

## 1. パッケージのインストール

```bash
npm install @supabase/ssr
```

## 2. Supabaseでの設定

### Google OAuthの有効化

1. Supabase Dashboardにログイン
2. Authentication > Providers に移動
3. Google を有効化
4. Client ID と Client Secret を設定（Google Cloud Consoleで取得）
5. Redirect URL を設定: `https://your-project-ref.supabase.co/auth/v1/callback`

### Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. APIs & Services > Credentials に移動
4. OAuth 2.0 Client ID を作成
5. Authorized redirect URIs に以下を追加:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

## 3. マイグレーションSQLの実行

`MIGRATION.md`に記載されているSQLをSupabaseのSQL Editorで実行してください。

