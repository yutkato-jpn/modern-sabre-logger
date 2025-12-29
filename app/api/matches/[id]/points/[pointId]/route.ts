import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; pointId: string } }
) {
  try {
    const body = await request.json()
    const { situation, phrase, note } = body

    const supabase = await createClient()

    // 現在のユーザーIDを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーがログインしていません' },
        { status: 401 }
      )
    }

    // ポイントがユーザーのものか確認（まず試合がユーザーのものか確認）
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

    // ポイントがこの試合に属しているか確認
    const { data: point, error: pointError } = await supabase
      .from('points')
      .select('*')
      .eq('id', params.pointId)
      .eq('match_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (pointError || !point) {
      return NextResponse.json(
        { error: 'ポイントが見つかりません' },
        { status: 404 }
      )
    }

    // ポイントを更新
    const { data, error } = await supabase
      .from('points')
      .update({
        situation,
        phrase,
        note: note?.trim() || null,
      })
      .eq('id', params.pointId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating point:', error)
      return NextResponse.json(
        { error: error.message || 'ポイントの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pointId: string } }
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

    // ポイントがユーザーのものか確認（まず試合がユーザーのものか確認）
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

    // ポイントがこの試合に属しているか確認
    const { data: point, error: pointError } = await supabase
      .from('points')
      .select('*')
      .eq('id', params.pointId)
      .eq('match_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (pointError || !point) {
      return NextResponse.json(
        { error: 'ポイントが見つかりません' },
        { status: 404 }
      )
    }

    // ポイントを削除
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', params.pointId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[API] Error deleting point:', error)
      return NextResponse.json(
        { error: error.message || 'ポイントの削除に失敗しました' },
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

