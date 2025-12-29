import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { finalScoreMe, finalScoreOpponent } = body

    const supabase = await createClient()

    // 現在のユーザーIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーがログインしていません' },
        { status: 401 }
      )
    }

    // 試合がユーザーのものか確認
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: '試合が見つかりません' },
        { status: 404 }
      )
    }

    // スコアを更新
    const { error } = await supabase
      .from('matches')
      .update({
        final_score_me: finalScoreMe,
        final_score_opponent: finalScoreOpponent,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[API] Error updating match score:', error)
      return NextResponse.json(
        { error: error.message || 'スコアの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

