import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { opponentName, myColor } = body

    if (!opponentName || opponentName.trim() === '') {
      return NextResponse.json(
        { error: '対戦相手の名前は必須です' },
        { status: 400 }
      )
    }

    if (myColor !== 'red' && myColor !== 'green') {
      return NextResponse.json(
        { error: '無効な色が指定されました' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 現在のユーザーIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーがログインしていません' },
        { status: 401 }
      )
    }

    // 試合を作成
    const { data, error } = await supabase
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
      console.error('Error creating match:', error)
      return NextResponse.json(
        { error: error.message || '試合の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

