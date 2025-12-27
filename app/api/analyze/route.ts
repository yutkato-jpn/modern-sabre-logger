import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getRecentPointsWithMatches } from '@/utils/supabase'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // デバッグ: 環境変数の存在確認（値は出力しない）
    const hasApiKey = !!process.env.OPENAI_API_KEY
    const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0
    console.log('Environment check:', {
      hasApiKey,
      apiKeyLength,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('SUPABASE'))
    })

    // 環境変数のチェック（クライアント作成前に）
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('OPENAI') || k.startsWith('NEXT_PUBLIC')))
      return NextResponse.json({
        error: 'OpenAI APIキーが設定されていません。.env.localファイルにOPENAI_API_KEYを設定してください。'
      }, { status: 500 })
    }

    // OpenAIクライアントを関数内で初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Supabaseから試合データを取得（サーバーサイドクライアントを使用）
    const supabase = await createClient()
    const points = await getRecentPointsWithMatches(100, supabase)

    if (points.length === 0) {
      return NextResponse.json({
        error: '分析する試合データがありません。試合を記録してください。'
      }, { status: 400 })
    }

    // データを整形してAIに送る
    const matchData = points.map(point => ({
      match_id: point.match_id,
      opponent_name: point.match?.opponent_name || '不明',
      created_at: point.match?.created_at || point.created_at,
      scorer: point.scorer,
      situation: point.situation,
      phrase: point.phrase,
      note: point.note,
      score_me_at_time: point.score_me_at_time,
      score_opponent_at_time: point.score_opponent_at_time,
    }))

    // OpenAI APIで分析
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `あなたはオリンピックレベルのフェンシング（サーブル）のコーチです。渡された試合ログ（JSON）を分析し、以下のフォーマットで選手にアドバイスをしてください。

特に『失点したシーン（scorer: opponent）』の共通点（特定のシチュエーションやフレーズでの失点率）を見つけ出し、具体的な改善案を提示してください。

フェンシング用語（マルシェ、ロンペ、パラード、リポスト、コントルアタック、アタック・オ・フェール、プレパラッションなど）を正しく使用してください。

レスポンスは必ず以下のJSON形式で返してください：
{
  "summary": "最近の傾向（例：4mライン際での失点が増えています）",
  "detail": "詳細な分析（例：相手のプレパラッションに対して、コントルアタックを合わせようとして失敗するケースが8割です）",
  "action_plan": "次回の練習で意識すること（例：ライン際では止まらず、一度パラードを選択肢に入れてください）"
}`
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
    if (!responseContent) {
      throw new Error('AIからのレスポンスが空です')
    }

    const analysis = JSON.parse(responseContent)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in analyze API:', error)
    console.error('Error type:', error?.constructor?.name)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status,
      code: (error as any)?.code,
      type: (error as any)?.type,
    })
    
    // より詳細なエラーメッセージ
    let errorMessage = '分析中にエラーが発生しました'
    let statusCode = 500
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error details:', {
        status: error.status,
        code: error.code,
        type: error.type,
        message: error.message,
      })
      
      errorMessage = `OpenAI API エラー: ${error.message}`
      statusCode = error.status || 500
      
      if (error.status === 401) {
        errorMessage = 'OpenAI APIキーが無効です。.env.localファイルのOPENAI_API_KEYを確認してください。'
      } else if (error.code === 'insufficient_quota' || error.type === 'insufficient_quota') {
        errorMessage = 'OpenAIアカウントのクレジットが不足しています。\n\n[OpenAI Platform](https://platform.openai.com/account/billing)でクレジットを追加してください。'
        statusCode = 402
      } else if (error.status === 429) {
        // insufficient_quota以外の429エラーの場合
        if (error.code !== 'insufficient_quota') {
          errorMessage = 'APIの利用制限（レート制限）に達しました。しばらく待ってから再試行してください。'
        }
      } else if (error.status === 402) {
        errorMessage = 'OpenAIアカウントのクレジットが不足しています。アカウントにクレジットを追加してください。'
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        type: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
      } : undefined
    }, { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}

