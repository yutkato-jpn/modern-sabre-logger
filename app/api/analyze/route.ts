import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getRecentPointsWithMatches } from '@/utils/supabase'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // デバッグ: 環境変数の存在確認
    const hasApiKey = !!process.env.OPENAI_API_KEY
    console.log('Environment check:', {
      hasApiKey,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('SUPABASE'))
    })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI APIキーが設定されていません。'
      }, { status: 500 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const supabase = await createClient()
    const points = await getRecentPointsWithMatches(100, supabase)

    if (points.length === 0) {
      return NextResponse.json({ error: '分析する試合データがありません。' }, { status: 400 })
    }

    const matchData = points.map(point => ({
      match_id: point.match_id,
      opponent_name: point.match?.opponent_name || '不明',
      created_at: point.match?.created_at || point.created_at,
      scorer: point.scorer,
      situation: point.situation,
      phrase: point.phrase,
      note: point.note,
    }))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたはフェンシング（サーブル）のコーチです。失点シーンを分析し、改善案を提示してください。JSON形式で返答してください。`
        },
        {
          role: 'user',
          content: `以下のデータを分析してください：\n\n${JSON.stringify(matchData)}`
        }
      ],
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) throw new Error('AIからのレスポンスが空です')

    return NextResponse.json(JSON.parse(responseContent))
  } catch (error) {
    console.error('Error in analyze API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

