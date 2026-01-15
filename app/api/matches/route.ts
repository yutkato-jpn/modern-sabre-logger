import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 現在のユーザーIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーがログインしていません' },
        { status: 401 }
      )
    }

    // ログインしているユーザーの試合のみを取得
    // RLSにより自動的にフィルタリングされるが、明示的にuser_idでフィルタリング
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[API] Error fetching matches:', error)
      return NextResponse.json(
        { error: error.message || '試合データの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 各試合のポイント数を取得してスコアを計算
    // スコアが0-0の試合のみ、ポイントから計算
    const matchIds = (matches || []).map(m => m.id)
    
    if (matchIds.length > 0) {
      // すべての試合のポイントを一括取得
      const { data: allPoints, error: pointsError } = await supabase
        .from('points')
        .select('match_id, scorer')
        .in('match_id', matchIds)
        .eq('user_id', user.id)

      if (!pointsError && allPoints) {
        // 試合IDごとにポイントをグループ化
        const pointsByMatch = allPoints.reduce((acc, point) => {
          if (!acc[point.match_id]) {
            acc[point.match_id] = { me: 0, opponent: 0 }
          }
          if (point.scorer === 'me') {
            acc[point.match_id].me++
          } else {
            acc[point.match_id].opponent++
          }
          return acc
        }, {} as Record<string, { me: number; opponent: number }>)

        // スコアが0-0の試合のみ、ポイントから計算したスコアで更新
        const matchesWithScores = (matches || []).map(match => {
          // スコアが既に保存されている場合はそのまま使用
          if (match.final_score_me > 0 || match.final_score_opponent > 0) {
            return match
          }

          // スコアが0-0の場合は、ポイントから計算
          const points = pointsByMatch[match.id]
          if (points) {
            return {
              ...match,
              final_score_me: points.me,
              final_score_opponent: points.opponent,
            }
          }

          return match
        })

        return NextResponse.json({ data: matchesWithScores || [] }, { status: 200 })
      }
    }

    return NextResponse.json({ data: matches || [] }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

