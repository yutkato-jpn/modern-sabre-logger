import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 最新のポイントを取得
    const { data: latestPoint, error: fetchError } = await supabase
      .from('points')
      .select('*')
      .eq('match_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '削除するポイントが見つかりません' },
          { status: 404 }
        )
      }
      console.error('[API] Error fetching latest point:', fetchError)
      return NextResponse.json(
        { error: fetchError.message || 'ポイントの取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!latestPoint) {
      return NextResponse.json(
        { error: '削除するポイントが見つかりません' },
        { status: 404 }
      )
    }

    // ポイントを削除
    const { error: deleteError } = await supabase
      .from('points')
      .delete()
      .eq('id', latestPoint.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[API] Error deleting point:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'ポイントの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: latestPoint }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

