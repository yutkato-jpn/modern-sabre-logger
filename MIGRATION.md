# Supabase マイグレーションSQL

以下のSQLをSupabaseのSQL Editorで実行してください。

## 1. 既存データの削除とテーブル構造の変更

```sql
-- 既存データの削除
TRUNCATE TABLE points CASCADE;
TRUNCATE TABLE matches CASCADE;

-- matchesテーブルにuser_idカラムを追加
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- pointsテーブルにuser_idカラムを追加
ALTER TABLE points
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;

-- RLSを有効化
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
```

## 2. RLSポリシーの作成

```sql
-- matchesテーブルのRLSポリシー
-- SELECT: 自分のデータのみ取得可能
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: 自分のuser_idでデータを作成可能
CREATE POLICY "Users can insert their own matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分のデータのみ更新可能
CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: 自分のデータのみ削除可能
CREATE POLICY "Users can delete their own matches"
ON matches FOR DELETE
USING (auth.uid() = user_id);

-- pointsテーブルのRLSポリシー
-- SELECT: 自分のmatchに紐づくpointsのみ取得可能
CREATE POLICY "Users can view their own points"
ON points FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
);

-- INSERT: 自分のmatchに紐づくpointsのみ作成可能
CREATE POLICY "Users can insert their own points"
ON points FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- UPDATE: 自分のmatchに紐づくpointsのみ更新可能
CREATE POLICY "Users can update their own points"
ON points FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- DELETE: 自分のmatchに紐づくpointsのみ削除可能
CREATE POLICY "Users can delete their own points"
ON points FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
);
```

## 3. デフォルト値の設定（オプション）

```sql
-- matchesテーブルのuser_idにデフォルト値を設定（auth.uid()を使用）
-- 注意: これは関数として動作しないため、アプリケーション側で明示的に設定する必要があります
```

## 実行手順

1. Supabase Dashboardにログイン
2. SQL Editorを開く
3. 上記のSQLを順番に実行
4. エラーがないか確認

