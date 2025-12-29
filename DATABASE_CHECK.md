# データベーススキーマ確認手順

## 問題
`user_id`カラムが見つからないエラーが発生しています。

## 確認手順

### 1. Supabaseダッシュボードでテーブル構造を確認

1. Supabaseダッシュボードにログイン
2. 「Table Editor」を開く
3. `matches`テーブルを選択
4. カラム一覧を確認し、`user_id`カラムが存在するか確認

### 2. SQL Editorでテーブル構造を確認

Supabaseダッシュボードの「SQL Editor」で以下を実行：

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

### 3. user_idカラムが存在しない場合

以下のSQLを実行して`user_id`カラムを追加：

```sql
-- matchesテーブルにuser_idカラムを追加
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- pointsテーブルにuser_idカラムを追加
ALTER TABLE points
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 4. 既存データがある場合の処理

既存データがある場合、以下のいずれかを実行：

**オプションA: 既存データを削除（推奨）**
```sql
TRUNCATE TABLE points CASCADE;
TRUNCATE TABLE matches CASCADE;
```

**オプションB: 既存データを保持**
既存データを保持する場合は、`user_id`をNULL許可のままにし、新しいデータのみ`user_id`を設定します。

### 5. NOT NULL制約の追加（既存データがない場合のみ）

```sql
-- matchesテーブルにNOT NULL制約を追加
ALTER TABLE matches
ALTER COLUMN user_id SET NOT NULL;

-- pointsテーブルにNOT NULL制約を追加
ALTER TABLE points
ALTER COLUMN user_id SET NOT NULL;
```

### 6. RLSポリシーの確認

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('matches', 'points');

-- 既存のポリシーを確認
SELECT * FROM pg_policies 
WHERE tablename IN ('matches', 'points');
```

### 7. RLSポリシーの作成（必要に応じて）

```sql
-- RLSを有効化
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;

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

## 確認後の対応

1. 上記のSQLを実行後、Vercelのログを確認
2. `/api/matches/create`のログでエラーの詳細を確認
3. エラーメッセージを共有してください

