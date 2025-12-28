# 緊急修正: user_idカラムの追加

## 問題
`matches`テーブルに`user_id`カラムが存在しないため、試合の作成に失敗しています。

## 解決方法

### ステップ1: 既存データの確認（オプション）
既存のデータを保持したい場合は、このステップをスキップしてください。

```sql
-- 既存データを確認
SELECT COUNT(*) FROM matches;
SELECT COUNT(*) FROM points;
```

### ステップ2: 既存データの削除（既存データを保持しない場合のみ）
**注意**: このSQLを実行すると、すべての既存データが削除されます。

```sql
-- 既存データの削除
TRUNCATE TABLE points CASCADE;
TRUNCATE TABLE matches CASCADE;
```

### ステップ3: user_idカラムの追加

```sql
-- matchesテーブルにuser_idカラムを追加
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- pointsテーブルにuser_idカラムを追加
ALTER TABLE points
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

### ステップ4: 既存データがある場合のuser_id設定（既存データを保持する場合）

既存のデータがある場合、現在ログインしているユーザーのIDを設定する必要があります。
**注意**: この方法は、既存のデータをすべて現在のユーザーに紐づけます。

```sql
-- 現在のユーザーIDを取得（Supabase DashboardでログインしているユーザーのIDを確認）
-- 以下のYOUR_USER_IDを実際のユーザーIDに置き換えてください
-- UPDATE matches SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE points SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
```

### ステップ5: NOT NULL制約の追加（既存データがない場合のみ）

既存データがない場合、またはすべてのデータにuser_idが設定されている場合のみ実行してください。

```sql
-- matchesテーブルにNOT NULL制約を追加
ALTER TABLE matches
ALTER COLUMN user_id SET NOT NULL;

-- pointsテーブルにNOT NULL制約を追加
ALTER TABLE points
ALTER COLUMN user_id SET NOT NULL;
```

### ステップ6: RLSの有効化とポリシーの作成

```sql
-- RLSを有効化
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

## 実行後の確認

```sql
-- テーブル構造の確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'matches'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'points'
ORDER BY ordinal_position;
```

