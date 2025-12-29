import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
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

    // まず、試合がユーザーのものか確認
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

    // ログインしているユーザーの試合のポイントのみを取得
    // RLSにより自動的にフィルタリングされるが、明示的にuser_idでフィルタリング
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('match_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[API] Error fetching points:', error)
      return NextResponse.json(
        { error: error.message || 'ポイントデータの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

