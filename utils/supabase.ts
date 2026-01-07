// このファイルは後方互換性のため残しますが、新しいコードでは @/utils/supabase/client または @/utils/supabase/server を使用してください
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// クライアントサイド用（後方互換性のため）
export const supabase = createBrowserClient()

export interface Match {
  id: string
  user_id: string
  opponent_name: string
  my_color: 'red' | 'green'
  final_score_me: number
  final_score_opponent: number
  match_date?: string
  tags?: string[] | null
  created_at?: string
}

export interface Point {
  id: string
  match_id: string
  user_id: string
  scorer: 'me' | 'opponent'
  situation: '4m' | '4m後の攻撃' | '4m後のディフェンス'
  phrase: string
  note?: string
  score_me_at_time?: number
  score_opponent_at_time?: number
  created_at?: string
}

export async function getMatches(client = supabase): Promise<Match[]> {
  const { data, error } = await client
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching matches:', error)
    return []
  }

  return data || []
}

export async function getMatch(id: string, client = supabase): Promise<Match | null> {
  const { data, error } = await client
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching match:', error)
    return null
  }

  return data
}

export async function getPoints(matchId: string, client = supabase): Promise<Point[]> {
  const { data, error } = await client
    .from('points')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching points:', error)
    return []
  }

  return data || []
}

export async function createMatch(opponentName: string, myColor: 'red' | 'green', client = supabase): Promise<{ data: Match | null; error: Error | null }> {
  // 入力値の検証
  if (!opponentName || opponentName.trim() === '') {
    const error = new Error('対戦相手の名前は必須です')
    console.error('Error creating match:', error.message)
    return { data: null, error }
  }

  if (myColor !== 'red' && myColor !== 'green') {
    const error = new Error('無効な色が指定されました')
    console.error('Error creating match:', error.message)
    return { data: null, error }
  }

  // 現在のユーザーIDを取得
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    const error = new Error('ユーザーがログインしていません')
    console.error('Error getting user:', userError)
    return { data: null, error }
  }

  const { data, error } = await client
    .from('matches')
    .insert({
      user_id: user.id,
      opponent_name: opponentName.trim(),
      my_color: myColor,
      final_score_me: 0,
      final_score_opponent: 0,
    })
    .select()
    .single()

  if (error) {
    // 詳細なエラー情報を出力
    console.error('Error creating match - Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Error code:', error.code)
    
    const errorObj = new Error(
      error.message || 'Failed to create match in database'
    )
    if (error.details) {
      errorObj.message += ` (Details: ${error.details})`
    }
    if (error.hint) {
      errorObj.message += ` (Hint: ${error.hint})`
    }
    
    return { data: null, error: errorObj }
  }

  return { data: data || null, error: null }
}

export async function addPoint(
  matchId: string,
  scorer: 'me' | 'opponent',
  situation: '4m' | '4m後の攻撃' | '4m後のディフェンス',
  phrase: string,
  scoreMeAtTime: number,
  scoreOpponentAtTime: number,
  note?: string,
  client = supabase
): Promise<{ data: Point | null; error: Error | null }> {
  // Match IDの検証
  if (!matchId || matchId.trim() === '') {
    const error = new Error('Match ID is required')
    console.error('Error adding point:', error.message)
    return { data: null, error }
  }

  // 必須フィールドの検証
  if (!scorer || !situation || !phrase || phrase.trim() === '') {
    const error = new Error('Required fields are missing: scorer, situation, or phrase')
    console.error('Error adding point:', error.message)
    return { data: null, error }
  }

  // スコアの検証と変換
  const scoreMe = typeof scoreMeAtTime === 'string' ? parseInt(scoreMeAtTime, 10) : scoreMeAtTime
  const scoreOpponent = typeof scoreOpponentAtTime === 'string' ? parseInt(scoreOpponentAtTime, 10) : scoreOpponentAtTime

  if (isNaN(scoreMe) || isNaN(scoreOpponent)) {
    const error = new Error('Invalid score values. Scores must be numbers.')
    console.error('Error adding point:', error.message, { scoreMeAtTime, scoreOpponentAtTime })
    return { data: null, error }
  }

  if (scoreMe < 0 || scoreOpponent < 0) {
    const error = new Error('Scores cannot be negative')
    console.error('Error adding point:', error.message)
    return { data: null, error }
  }

  // 現在のユーザーIDを取得
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    const error = new Error('ユーザーがログインしていません')
    console.error('Error getting user:', userError)
    return { data: null, error }
  }

  const { data, error } = await client
    .from('points')
    .insert({
      match_id: matchId,
      user_id: user.id,
      scorer,
      situation,
      phrase: phrase.trim(),
      score_me_at_time: scoreMe,
      score_opponent_at_time: scoreOpponent,
      note: note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    // 詳細なエラー情報を出力
    console.error('Error adding point - Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Error code:', error.code)
    
    const errorObj = new Error(
      error.message || 'Failed to save point to database'
    )
    if (error.details) {
      errorObj.message += ` (Details: ${error.details})`
    }
    if (error.hint) {
      errorObj.message += ` (Hint: ${error.hint})`
    }
    
    return { data: null, error: errorObj }
  }

  return { data: data || null, error: null }
}

export async function updateMatchScore(
  matchId: string,
  finalScoreMe: number,
  finalScoreOpponent: number
): Promise<{ success: boolean; error: Error | null }> {
  // Match IDの検証
  if (!matchId || matchId.trim() === '') {
    const error = new Error('Match ID is required')
    console.error('Error updating match score:', error.message)
    return { success: false, error }
  }

  // 数値型の検証と変換
  const scoreMe = typeof finalScoreMe === 'string' ? parseInt(finalScoreMe, 10) : finalScoreMe
  const scoreOpponent = typeof finalScoreOpponent === 'string' ? parseInt(finalScoreOpponent, 10) : finalScoreOpponent

  if (isNaN(scoreMe) || isNaN(scoreOpponent)) {
    const error = new Error('Invalid score values. Scores must be numbers.')
    console.error('Error updating match score:', error.message, { finalScoreMe, finalScoreOpponent })
    return { success: false, error }
  }

  // 負の値チェック
  if (scoreMe < 0 || scoreOpponent < 0) {
    const error = new Error('Scores cannot be negative')
    console.error('Error updating match score:', error.message)
    return { success: false, error }
  }

  const { error } = await supabase
    .from('matches')
    .update({
      final_score_me: scoreMe,
      final_score_opponent: scoreOpponent,
    })
    .eq('id', matchId)

  if (error) {
    // 詳細なエラー情報を出力
    console.error('Error updating match score - Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Error code:', error.code)
    
    const errorObj = new Error(
      error.message || 'Failed to update match score in database'
    )
    if (error.details) {
      errorObj.message += ` (Details: ${error.details})`
    }
    if (error.hint) {
      errorObj.message += ` (Hint: ${error.hint})`
    }
    
    return { success: false, error: errorObj }
  }

  return { success: true, error: null }
}

export async function updatePoint(
  pointId: string,
  situation: '4m' | '4m後の攻撃' | '4m後のディフェンス',
  phrase: string,
  note?: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('points')
    .update({
      situation,
      phrase,
      note,
    })
    .eq('id', pointId)

  if (error) {
    console.error('Error updating point - Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    
    const errorObj = new Error(
      error.message || 'Failed to update point in database'
    )
    if (error.details) {
      errorObj.message += ` (Details: ${error.details})`
    }
    
    return { success: false, error: errorObj }
  }

  return { success: true, error: null }
}

export async function deleteLatestPoint(matchId: string): Promise<{ success: boolean; deletedPoint: Point | null; error: Error | null }> {
  // Match IDの検証
  if (!matchId || matchId.trim() === '') {
    const error = new Error('Match ID is required')
    console.error('Error deleting latest point:', error.message)
    return { success: false, deletedPoint: null, error }
  }

  // 最新のポイントを取得
  const { data: latestPoint, error: fetchError } = await supabase
    .from('points')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      // レコードが見つからない場合
      const error = new Error('削除するポイントが見つかりません')
      console.error('Error deleting latest point:', error.message)
      return { success: false, deletedPoint: null, error }
    }
    
    console.error('Error fetching latest point:', fetchError)
    const errorObj = new Error(fetchError.message || 'Failed to fetch latest point')
    return { success: false, deletedPoint: null, error: errorObj }
  }

  if (!latestPoint) {
    const error = new Error('削除するポイントが見つかりません')
    console.error('Error deleting latest point:', error.message)
    return { success: false, deletedPoint: null, error }
  }

  // ポイントを削除
  const { error: deleteError } = await supabase
    .from('points')
    .delete()
    .eq('id', latestPoint.id)

  if (deleteError) {
    console.error('Error deleting point - Full error object:', deleteError)
    console.error('Error message:', deleteError.message)
    console.error('Error details:', deleteError.details)
    
    const errorObj = new Error(
      deleteError.message || 'Failed to delete point from database'
    )
    if (deleteError.details) {
      errorObj.message += ` (Details: ${deleteError.details})`
    }
    
    return { success: false, deletedPoint: null, error: errorObj }
  }

  return { success: true, deletedPoint: latestPoint, error: null }
}

export interface PointWithMatch extends Point {
  match?: Match
}

export async function getRecentPointsWithMatches(limit: number = 100, client = supabase): Promise<PointWithMatch[]> {
  // 現在のユーザーIDを取得
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) {
    console.error('Error getting user:', userError)
    return []
  }

  // 最新の試合から順に取得（明示的にuser_idでフィルタリング）
  const { data: matches, error: matchesError } = await client
    .from('matches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (matchesError) {
    console.error('Error fetching matches:', matchesError)
    return []
  }

  if (!matches || matches.length === 0) {
    return []
  }

  const matchIds = matches.map(m => m.id)

  // これらの試合のポイントを取得（明示的にuser_idでフィルタリング）
  const { data: points, error: pointsError } = await client
    .from('points')
    .select('*')
    .in('match_id', matchIds)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (pointsError) {
    console.error('Error fetching points:', pointsError)
    return []
  }

  // マッチ情報を結合
  const pointsWithMatches: PointWithMatch[] = (points || []).map(point => {
    const match = matches.find(m => m.id === point.match_id)
    return {
      ...point,
      match: match || undefined
    }
  })

  return pointsWithMatches
}

export async function deleteMatch(matchId: string, client = supabase): Promise<{ success: boolean; error: Error | null }> {
  // Match IDの検証
  if (!matchId || matchId.trim() === '') {
    const error = new Error('Match ID is required')
    console.error('Error deleting match:', error.message)
    return { success: false, error }
  }

  // 試合を削除（RLSにより、自分の試合のみ削除可能）
  const { error } = await client
    .from('matches')
    .delete()
    .eq('id', matchId)

  if (error) {
    console.error('Error deleting match - Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Error code:', error.code)
    
    const errorObj = new Error(
      error.message || 'Failed to delete match from database'
    )
    if (error.details) {
      errorObj.message += ` (Details: ${error.details})`
    }
    if (error.hint) {
      errorObj.message += ` (Hint: ${error.hint})`
    }
    
    return { success: false, error: errorObj }
  }

  return { success: true, error: null }
}

