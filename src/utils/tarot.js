/**
 * 塔罗牌数据
 * 从 index.html 和 tarot.html 合并迁移
 */

// 大阿卡纳（22张）
export const MAJOR_ARCANA = [
  { id: 0,  name: "愚人",   emoji: "🃏", keyword: "新的开始、冒险、纯真" },
  { id: 1,  name: "魔术师", emoji: "✨", keyword: "创造力、行动力、自信" },
  { id: 2,  name: "女祭司", emoji: "🌙", keyword: "直觉、智慧、内在知识" },
  { id: 3,  name: "皇后",   emoji: "🌸", keyword: "丰饶、母性、创造" },
  { id: 4,  name: "皇帝",   emoji: "👑", keyword: "权威、结构、控制" },
  { id: 5,  name: "教皇",   emoji: "🏛", keyword: "传统、信仰、指引" },
  { id: 6,  name: "恋人",   emoji: "💞", keyword: "选择、关系、和谐" },
  { id: 7,  name: "战车",   emoji: "⚡", keyword: "意志力、胜利、决心" },
  { id: 8,  name: "力量",   emoji: "🦁", keyword: "勇气、耐心、内在力量" },
  { id: 9,  name: "隐者",   emoji: "🕯", keyword: "内省、孤独、智慧" },
  { id: 10, name: "命运之轮",emoji: "🎡", keyword: "命运、转折、循环" },
  { id: 11, name: "正义",   emoji: "⚖️", keyword: "公平、真相、因果" },
  { id: 12, name: "倒吊人", emoji: "🔄", keyword: "牺牲、等待、新视角" },
  { id: 13, name: "死神",   emoji: "🌑", keyword: "结束、转化、重生" },
  { id: 14, name: "节制",   emoji: "🌊", keyword: "平衡、适度、耐心" },
  { id: 15, name: "恶魔",   emoji: "🔗", keyword: "束缚、执念、欲望" },
  { id: 16, name: "塔",     emoji: "⚡", keyword: "崩塌、突变、启示" },
  { id: 17, name: "星星",   emoji: "⭐", keyword: "希望、灵感、平静" },
  { id: 18, name: "月亮",   emoji: "🌕", keyword: "幻象、恐惧、直觉" },
  { id: 19, name: "太阳",   emoji: "☀️", keyword: "成功、活力、喜悦" },
  { id: 20, name: "审判",   emoji: "🎺", keyword: "觉醒、重生、召唤" },
  { id: 21, name: "世界",   emoji: "🌍", keyword: "圆满、完成、整合" },
]

// 牌阵类型
export const SPREAD_TYPES = [
  { id: 'single', name: '单张指引', cards: 1, desc: '简单直接，适合日常问题' },
  { id: 'triple', name: '三牌时光', cards: 3, desc: '过去-现在-未来' },
  { id: 'cross', name: '十字展开', cards: 4, desc: '多维度分析问题' },
]

// 问题类型
export const QUESTION_TYPES = [
  { id: 'love',     icon: '💕', name: '感情',     questions: ['他/她对我有意思吗？','我们的关系会怎样？','我的正缘什么时候出现？'] },
  { id: 'career',   icon: '💼', name: '事业',     questions: ['工作会有变动吗？','这个项目能成功吗？','我该不该跳槽？'] },
  { id: 'wealth',   icon: '💰', name: '财运',     questions: ['近期财运如何？','投资方向对吗？','会有意外之财吗？'] },
  { id: 'general',  icon: '🔮', name: '综合运势', questions: ['今天整体运势怎样？','近期需要注意什么？','有什么好消息？'] },
]

/**
 * 根据日期获取今日塔罗牌
 */
import { hashDay, seededRand } from './fortune.js'
export function getTodayTarot(date) {
  const seed = hashDay(date)
  const rand = seededRand(seed + 999)
  const card = MAJOR_ARCANA[Math.floor(rand() * MAJOR_ARCANA.length)]
  return card
}
