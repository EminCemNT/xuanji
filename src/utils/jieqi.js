/**
 * 节气数据（2026年）
 * 从 index.html 迁移
 */

export const JIEQI_2026 = [
  { name:"小寒", month:0, day:5, desc:"小寒迎冬，冰雪砥砺" },
  { name:"大寒", month:0, day:20, desc:"大寒将尽，岁序更新" },
  { name:"立春", month:1, day:4, desc:"立春一日，百草回芽" },
  { name:"雨水", month:1, day:19, desc:"雨水时节，润物无声" },
  { name:"惊蛰", month:2, day:6, desc:"惊蛰春雷，万物复苏" },
  { name:"春分", month:2, day:20, desc:"春分昼夜平，生机勃发" },
  { name:"清明", month:3, day:5, desc:"清明时节，万物明洁" },
  { name:"谷雨", month:3, day:20, desc:"谷雨时节，雨生百谷" },
  { name:"立夏", month:4, day:5, desc:"立夏万物并秀，生机盎然" },
  { name:"小满", month:4, day:21, desc:"小满江河满，麦穗饱满" },
  { name:"芒种", month:5, day:6, desc:"芒种忙收忙种，勤劳丰收" },
  { name:"夏至", month:5, day:21, desc:"夏至白昼最长，阳气至极" },
  { name:"小暑", month:6, day:7, desc:"小暑天气炎热，养心静气" },
  { name:"大暑", month:6, day:23, desc:"大暑万物繁茂，热气蒸腾" },
  { name:"立秋", month:7, day:7, desc:"立秋风起，金气肃降" },
  { name:"处暑", month:7, day:23, desc:"处暑暑气将止，秋风渐凉" },
  { name:"白露", month:8, day:8, desc:"白露秋风起，凝露晶莹" },
  { name:"秋分", month:8, day:23, desc:"秋分昼夜均，金风送爽" },
  { name:"寒露", month:9, day:8, desc:"寒露露水凉，秋意渐深" },
  { name:"霜降", month:9, day:23, desc:"霜降草木黄，大地银装" },
  { name:"立冬", month:10, day:7, desc:"立冬万物收藏，冬日初始" },
  { name:"小雪", month:10, day:22,desc:"小雪初降，冰雪乍现" },
  { name:"大雪", month:11, day:7, desc:"大雪漫天，万籁俱寂" },
  { name:"冬至", month:11, day:22,desc:"冬至一阳生，万物始复苏" },
]

/**
 * 获取下一个节气信息
 * @param {Date} today
 * @returns {{name: string, days: number, desc: string}}
 */
export function getNextJieqi(today) {
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()

  for (const jq of JIEQI_2026) {
    const jqDate = new Date(y, jq.month, jq.day)
    const diff = Math.ceil((jqDate - today) / 86400000)
    if (diff >= 0) return { name: jq.name, days: diff, desc: jq.desc }
  }

  return { name: "小寒", days: 1, desc: "小寒迎冬，冰雪砥砺" }
}
