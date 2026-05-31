/* ============================================================
   农历计算 & 黄历数据模块
   从 index.html 提取，适配 uni-app
   ============================================================ */

// 基础常量
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const MONTHS_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAYS_CN = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

// 黄历数据池
const YI_POOL = ['出行', '嫁娶', '开业', '签约', '搬家', '祈福', '纳财', '裁衣', '会友', '求医', '置产', '动土', '开工', '求职', '宴请', '剃头', '安葬', '立约']
const JI_POOL = ['动土', '破土', '行丧', '开仓', '出财', '伐木', '作梁', '安床', '安葬', '嫁娶', '入宅', '修造', '开市', '乘船', '针灸', '词讼']
const COLORS = ['玫瑰金', '靛蓝', '星白', '翠绿', '绛红', '明黄', '紫罗兰', '湖蓝', '暮橙', '银灰']
const DIRS = ['正东', '正南', '正西', '正北', '东南', '西南', '东北', '西北']
const STARS = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '左辅', '右弼']
const JISHENS = ['天德', '月德', '岁合', '五合', '圣心', '青龙', '明堂', '金匮', '宝光', '玉堂']
const XIONGSHAS = ['天刑', '朱雀', '勾陈', '白虎', '天牢', '玄武']
const MOON_PHASES = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月']

// 节气数据
const JIEQI_INFO = [
  { name: '小寒', month: 0, approxDay: 5, desc: '小寒迎冬，冰雪砥砺' },
  { name: '大寒', month: 0, approxDay: 20, desc: '大寒将尽，岁序更新' },
  { name: '立春', month: 1, approxDay: 4, desc: '立春一日，百草回芽' },
  { name: '雨水', month: 1, approxDay: 19, desc: '雨水时节，润物无声' },
  { name: '惊蛰', month: 2, approxDay: 6, desc: '惊蛰春雷，万物复苏' },
  { name: '春分', month: 2, approxDay: 21, desc: '春分昼夜平，生机勃发' },
  { name: '清明', month: 3, approxDay: 5, desc: '清明时节，万物明洁' },
  { name: '谷雨', month: 3, approxDay: 20, desc: '谷雨时节，雨生百谷' },
  { name: '立夏', month: 4, approxDay: 6, desc: '立夏万物并秀，生机盎然' },
  { name: '小满', month: 4, approxDay: 21, desc: '小满江河满，麦穗饱满' },
  { name: '芒种', month: 5, approxDay: 6, desc: '芒种忙收忙种，勤劳丰收' },
  { name: '夏至', month: 5, approxDay: 22, desc: '夏至白昼最长，阳气至极' },
  { name: '小暑', month: 6, approxDay: 7, desc: '小暑天气炎热，养心静气' },
  { name: '大暑', month: 6, approxDay: 23, desc: '大暑万物繁茂，热气蒸腾' },
  { name: '立秋', month: 7, approxDay: 8, desc: '立秋风起，金气肃降' },
  { name: '处暑', month: 7, approxDay: 23, desc: '处暑暑气将止，秋风渐凉' },
  { name: '白露', month: 8, approxDay: 8, desc: '白露秋风起，凝露晶莹' },
  { name: '秋分', month: 8, approxDay: 23, desc: '秋分昼夜均，金风送爽' },
  { name: '寒露', month: 9, approxDay: 8, desc: '寒露露水凉，秋意渐深' },
  { name: '霜降', month: 9, approxDay: 24, desc: '霜降草木黄，大地银装' },
  { name: '立冬', month: 10, approxDay: 7, desc: '立冬万物收藏，冬日初始' },
  { name: '小雪', month: 10, approxDay: 22, desc: '小雪初降，冰雪乍现' },
  { name: '大雪', month: 11, approxDay: 7, desc: '大雪漫天，万籁俱寂' },
  { name: '冬至', month: 11, approxDay: 22, desc: '冬至一阳生，万物始复苏' }
]

const JIEQI_OFFSETS = {
  2024: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 },
  2025: { 0: 0, 1: 0, 2: -1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 },
  2026: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 },
  2027: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
}

// 哈希函数
function hashDay(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/**
 * 获取农历日期
 */
export function getLunarDate(date) {
  const baseDate = new Date(2026, 0, 29) // 2026年春节（大年初一）
  const diff = Math.floor((date - baseDate) / 86400000)
  let lunarMonth = 1
  let lunarDay = 1 + diff
  const monthDays = [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 30, 29] // 2026丙午年月份天数近似
  let m = 0
  let remaining = diff
  while (remaining >= monthDays[m]) {
    remaining -= monthDays[m]
    m++
    if (m >= monthDays.length) { m = 0 }
  }
  lunarMonth = m + 1
  lunarDay = remaining + 1

  // 干支年：2026是丙午年
  const yearIdx = (2026 - 4) % 10
  const yearZhi = (2026 - 4) % 12
  const yearGZ = TIANGAN[yearIdx] + DIZHI[yearZhi]
  const sx = SHENGXIAO[yearZhi]

  // 月干支（近似）
  const monthTG = TIANGAN[(m * 2 + 2) % 10]
  const monthDZ = DIZHI[(m + 2) % 12]

  // 日干支（以2026-01-01=丁卯日起算）
  const base2026 = new Date(2026, 0, 1)
  const dayDiff = Math.floor((date - base2026) / 86400000)
  const dayTG = TIANGAN[(3 + dayDiff) % 10] // 2026-01-01 天干偏移=3(丁)
  const dayDZ = DIZHI[(3 + dayDiff) % 12] // 地支偏移=3(卯)

  return {
    lunarMonth: MONTHS_CN[Math.min(m, 11)] + '月',
    lunarDay: DAYS_CN[Math.min(lunarDay - 1, 29)],
    yearGZ,
    sx,
    monthGZ: monthTG + monthDZ,
    dayGZ: dayTG + dayDZ
  }
}

/**
 * 获取黄历宜忌数据
 */
export function getDayData(date) {
  const seed = hashDay(date)
  const rand = seededRand(seed)

  // 宜：3-5项
  const yiCount = 3 + Math.floor(rand() * 3)
  const yi = []
  const yiPool = [...YI_POOL].sort(() => rand() - 0.5)
  for (let i = 0; i < yiCount; i++) yi.push(yiPool[i])

  // 忌：2-4项
  const jiCount = 2 + Math.floor(rand() * 3)
  const ji = []
  const jiPool = [...JI_POOL].filter(x => !yi.includes(x)).sort(() => rand() - 0.5)
  for (let i = 0; i < jiCount; i++) ji.push(jiPool[i])

  const color = COLORS[Math.floor(rand() * COLORS.length)]
  const num = [1, 2, 3, 4, 6, 7, 8, 9][Math.floor(rand() * 8)]
  const dir = DIRS[Math.floor(rand() * DIRS.length)]
  const star = STARS[Math.floor(rand() * STARS.length)]

  // 月相（根据农历日期近似）
  const lunar = getLunarDate(date)
  const dayNum = DAYS_CN.indexOf(lunar.lunarDay)
  let moonPhase = '蛾眉月'
  if (dayNum === 0) moonPhase = '新月'
  else if (dayNum < 7) moonPhase = '蛾眉月'
  else if (dayNum === 7) moonPhase = '上弦月'
  else if (dayNum < 14) moonPhase = '盈凸月'
  else if (dayNum === 14 || dayNum === 15) moonPhase = '满月'
  else if (dayNum < 22) moonPhase = '亏凸月'
  else if (dayNum === 22) moonPhase = '下弦月'
  else moonPhase = '残月'

  // 吉神凶煞
  const shens = JISHENS.sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 2))
  const shas = XIONGSHAS.sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 2))

  return { yi, ji, color, num, dir, star, moonPhase, shens, shas }
}

/**
 * 获取下一个节气
 */
export function getNextJieqi(today) {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const year = base.getFullYear()

  const offsets = JIEQI_OFFSETS[year] || {}
  const nextOffsets = JIEQI_OFFSETS[year + 1] || {}

  for (let i = 0; i < 24; i++) {
    const info = JIEQI_INFO[i]
    const day = info.approxDay + (offsets[info.month] || 0)
    const jqDate = new Date(year, info.month, day)
    const diff = Math.round((jqDate - base) / 86400000)
    if (diff >= 0) return { name: info.name, days: diff, desc: info.desc }
  }

  // 今年所有节气已过，返回明年第一个节气
  const firstInfo = JIEQI_INFO[0]
  const firstDay = firstInfo.approxDay + (nextOffsets[0] || 0)
  const firstDate = new Date(year + 1, 0, firstDay)
  const diff = Math.round((firstDate - base) / 86400000)
  return { name: firstInfo.name, days: diff, desc: firstInfo.desc }
}

/**
 * 今日塔罗（首页预览用）
 */
const TAROT_CARDS = [
  { name: '愚者', emoji: '🌀', hint: '新的开始即将展开，放下顾虑，勇敢踏出第一步' },
  { name: '魔术师', emoji: '✨', hint: '你拥有实现目标的所有资源，相信自己的能力' },
  { name: '女祭司', emoji: '🌙', hint: '倾听内心的声音，直觉正在引导你走向答案' },
  { name: '皇后', emoji: '🌸', hint: '丰盛与创造力环绕，这是滋养自己与他人的时刻' },
  { name: '皇帝', emoji: '👑', hint: '以稳定和秩序为基础，建立属于自己的领地' },
  { name: '教皇', emoji: '🏛', hint: '寻求智慧与传统的指引，或是成为他人的引路人' },
  { name: '恋人', emoji: '💞', hint: '重要的选择与关系面临考验，用心感受什么最重要' },
  { name: '战车', emoji: '⚡', hint: '意志力与行动力充沛，驾驭矛盾，全力前进' },
  { name: '力量', emoji: '🦁', hint: '温柔而坚定，内在力量比武力更有效' },
  { name: '隐者', emoji: '🕯', hint: '独处与内省带来智慧，答案在内心深处等待' },
  { name: '命运之轮', emoji: '🎡', hint: '命运正在转动，顺势而为，一切都在流动之中' },
  { name: '正义', emoji: '⚖️', hint: '公平与真相会水落石出，诚实面对自己' },
  { name: '倒吊人', emoji: '🔄', hint: '换个视角看问题，等待中蕴藏着转化的力量' },
  { name: '死神', emoji: '🌑', hint: '一段旅程正在结束，为新的可能性腾出空间' },
  { name: '节制', emoji: '🌊', hint: '平衡与耐心是今日主题，找到内外的和谐' },
  { name: '恶魔', emoji: '🔗', hint: '审视那些束缚你的恐惧或执念，你比你想的更自由' },
  { name: '塔', emoji: '⚡', hint: '震动与突破，旧的结构崩塌为新生命让路' },
  { name: '星星', emoji: '⭐', hint: '希望与灵感从天而降，相信宇宙正在支持你' },
  { name: '月亮', emoji: '🌕', hint: '幻象与迷雾中，信任直觉，一步一步向前走' },
  { name: '太阳', emoji: '☀️', hint: '喜悦、活力与成功，今天充满正能量' },
  { name: '审判', emoji: '🎺', hint: '觉醒与召唤，听从内心深处那个真实的自己' },
  { name: '世界', emoji: '🌍', hint: '完成与圆满，你已走完一个重要循环' }
]

export function getTodayTarot(date) {
  const seed = hashDay(date)
  const rand = seededRand(seed + 999)
  return TAROT_CARDS[Math.floor(rand() * TAROT_CARDS.length)]
}

export { hashDay, seededRand }
