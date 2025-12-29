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

    // 試合を削除（RLSにより、自分の試合のみ削除可能）
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[API] Error deleting match:', error)
      return NextResponse.json(
        { error: error.message || '試合の削除に失敗しました' },
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

