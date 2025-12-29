# 試合日時（match_date）カラムの追加

## 概要
試合記録に日時を設定できるようにするため、`matches`テーブルに`match_date`カラムを追加します。

## 実行手順

### 1. Supabaseダッシュボードにアクセス
1. [supabase.com](https://supabase.com) にログイン
2. プロジェクトを選択

### 2. SQL Editorを開く
1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック

### 3. match_dateカラムを追加
以下のSQLをコピー&ペーストして実行（「Run」ボタンをクリック）：

```sql
-- matchesテーブルにmatch_dateカラムを追加
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS match_date TIMESTAMPTZ;

-- 既存データがある場合、created_atの値をmatch_dateにコピー
UPDATE matches
SET match_date = created_at
WHERE match_date IS NULL;

-- デフォルト値を現在の日時に設定（オプション）
ALTER TABLE matches
ALTER COLUMN match_date SET DEFAULT NOW();
```

### 4. 確認
以下のSQLでカラムが追加されたか確認：

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'matches'
  AND column_name = 'match_date';
```

`match_date`カラムが表示されていれば成功です。

## 注意事項
- `match_date`はNULL許可にしています（既存データとの互換性のため）
- 既存の試合データには`created_at`の値が`match_date`にコピーされます
- 新しい試合では、ユーザーが指定した日時が保存されます

