/**
 * 农历计算核心
 * 从 index.html 迁移，保持算法一致
 */

export const TIANGAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]
export const DIZHI   = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
export const SHENGXIAO = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"]
export const MONTHS_CN = ["正","二","三","四","五","六","七","八","九","十","冬","腊"]
export const DAYS_CN = [
  "初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
  "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
  "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"
]

/**
 * 获取指定日期的农历信息
 * @param {Date} date
 * @returns {{lunarMonth: string, lunarDay: string, yearGZ: string, sx: string, monthGZ: string, dayGZ: string}}
 */
export function getLunarDate(date) {
  const baseDate = new Date(2026, 0, 29)
  const diff = Math.floor((date - baseDate) / 86400000)
  let lunarMonth = 1, lunarDay = 1 + diff
  const monthDays = [30,29,30,29,30,30,29,30,29,30,30,29]
  let m = 0
  let remaining = diff
  while (remaining >= monthDays[m]) {
    remaining -= monthDays[m]
    m++
    if (m >= monthDays.length) { m = 0 }
  }
  lunarMonth = m + 1
  lunarDay = remaining + 1

  const yearIdx = (2026 - 4) % 10
  const yearZhi = (2026 - 4) % 12
  const yearGZ = TIANGAN[yearIdx] + DIZHI[yearZhi]
  const sx = SHENGXIAO[yearZhi]

  const monthTG = TIANGAN[(m * 2 + 2) % 10]
  const monthDZ = DIZHI[(m + 2) % 12]

  const base2026 = new Date(2026, 0, 1)
  const dayDiff = Math.floor((date - base2026) / 86400000)
  const dayTG = TIANGAN[(3 + dayDiff) % 10]
  const dayDZ = DIZHI[(3 + dayDiff) % 12]

  return {
    lunarMonth: MONTHS_CN[Math.min(m, 11)] + "月",
    lunarDay: DAYS_CN[Math.min(lunarDay - 1, 29)],
    yearGZ, sx,
    monthGZ: monthTG + monthDZ,
    dayGZ: dayTG + dayDZ
  }
}
