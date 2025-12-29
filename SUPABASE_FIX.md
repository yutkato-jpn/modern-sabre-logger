# Supabaseでuser_idカラムを確認・追加する手順

## ステップ1: Supabaseダッシュボードにアクセス

1. [supabase.com](https://supabase.com) にログイン
2. プロジェクトを選択

## ステップ2: SQL Editorを開く

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック

## ステップ3: テーブル構造を確認

以下のSQLをコピー&ペーストして実行（「Run」ボタンをクリック）：

```sql
-- matchesテーブルの構造を確認
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'matches'
ORDER BY ordinal_position;
```

## ステップ4: user_idカラムが存在しない場合

以下のSQLを実行して`user_id`カラムを追加：

```sql
-- matchesテーブルにuser_idカラムを追加
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- pointsテーブルにuser_idカラムを追加
ALTER TABLE points
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

## ステップ5: 既存データの処理

既存のデータがある場合、以下のいずれかを選択：

### オプションA: 既存データを削除（推奨・既存データが不要な場合）

```sql
-- 既存データを削除
TRUNCATE TABLE points CASCADE;
TRUNCATE TABLE matches CASCADE;
```

### オプションB: 既存データを保持（既存データを保持したい場合）

この場合は、`user_id`をNULL許可のままにします（NOT NULL制約は追加しません）。

## ステップ6: NOT NULL制約の追加（既存データがない場合のみ）

既存データがない場合、またはすべて削除した場合のみ実行：

```sql
-- matchesテーブルにNOT NULL制約を追加
ALTER TABLE matches
ALTER COLUMN user_id SET NOT NULL;

-- pointsテーブルにNOT NULL制約を追加
ALTER TABLE points
ALTER COLUMN user_id SET NOT NULL;
```

## ステップ7: スキーマキャッシュの更新

Supabaseのスキーマキャッシュを更新するため、以下を実行：

```sql
-- スキーマキャッシュを更新（PostgRESTの再読み込み）
NOTIFY pgrst, 'reload schema';
```

または、Supabaseダッシュボードで：
1. 「Settings」→「API」を開く
2. 「Restart」ボタンをクリック（APIを再起動）

## ステップ8: 確認

再度テーブル構造を確認：

```sql
-- matchesテーブルの構造を確認
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'matches'
ORDER BY ordinal_position;
```

`user_id`カラムが表示されていれば成功です。

## ステップ9: RLSポリシーの確認と作成

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('matches', 'points');

-- RLSを有効化（まだ有効でない場合）
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラーが出る場合はスキップ）
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert their own matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;
DROP POLICY IF EXISTS "Users can delete their own matches" ON matches;
DROP POLICY IF EXISTS "Users can view their own points" ON points;
DROP POLICY IF EXISTS "Users can insert their own points" ON points;
DROP POLICY IF EXISTS "Users can update their own points" ON points;
DROP POLICY IF EXISTS "Users can delete their own points" ON points;

-- matchesテーブルのRLSポリシー
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own matches"
ON matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches"
ON matches FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches"
ON matches FOR DELETE
USING (auth.uid() = user_id);

-- pointsテーブルのRLSポリシー
CREATE POLICY "Users can view their own points"
ON points FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM matches
    WHERE matches.id = points.match_id
    AND matches.user_id = auth.uid()
  )
);

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

## 完了後

1. 数分待つ（スキーマキャッシュが更新されるまで）
2. アプリで再度試合を作成してみる
3. エラーが解消されているか確認

