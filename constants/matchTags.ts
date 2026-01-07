// 試合記録用のタグ定数

export const MATCH_TAGS = {
  // 対戦相手情報
  対戦相手情報: [
    '右利き',
    '左利き',
    '長身',
    '標準身長',
    'スピードタイプ',
    'パワータイプ',
  ],
  // 試合の性質
  試合の性質: [
    '練習',
    '大会(学連)',
    '大会(国公立)',
    '大会(JFE)',
  ],
  // 自己評価
  自己評価: [
    '勝てたはずなのに負けた',
    '格上に勝てた',
  ],
  // 戦術メモ
  戦術メモ: [
    '前にガンガン',
    '守備的',
    '相手を見る',
    '決め打ち',
  ],
} as const

export type MatchTagCategory = keyof typeof MATCH_TAGS
export type MatchTag = typeof MATCH_TAGS[MatchTagCategory][number]

