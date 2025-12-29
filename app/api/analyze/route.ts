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

    console.log('[API] Analyzing', matchData.length, 'points')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたはフェンシング（サーブル）のコーチです。失点シーンを分析し、改善案を提示してください。

必ず以下のJSON形式で返答してください：
{
  "summary": "最近の傾向を簡潔にまとめた文章（100文字程度）",
  "detail": "詳細な分析内容（200-300文字程度）",
  "action_plan": "次回の練習で意識すること（100-200文字程度）"
}

各フィールドは必ず含めてください。`
        },
        {
          role: 'user',
          content: `以下の試合データを分析してください：\n\n${JSON.stringify(matchData, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const responseContent = completion.choices[0]?.message?.content
    console.log('[API] OpenAI response length:', responseContent?.length || 0)
    
    if (!responseContent) {
      console.error('[API] OpenAI response is empty')
      throw new Error('AIからのレスポンスが空です')
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
      console.log('[API] Parsed response keys:', Object.keys(parsedResponse))
    } catch (parseError) {
      console.error('[API] Failed to parse JSON:', parseError)
      console.error('[API] Response content:', responseContent.substring(0, 500))
      throw new Error('AIからのレスポンスの解析に失敗しました')
    }

    // 必要なフィールドの検証
    if (!parsedResponse.summary || !parsedResponse.detail || !parsedResponse.action_plan) {
      console.error('[API] Missing required fields:', {
        hasSummary: !!parsedResponse.summary,
        hasDetail: !!parsedResponse.detail,
        hasActionPlan: !!parsedResponse.action_plan,
        allKeys: Object.keys(parsedResponse)
      })
      throw new Error('AIからのレスポンスに必要なフィールドが含まれていません')
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error('[API] Error in analyze API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
}

