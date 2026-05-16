/**
 * 黄历数据生成（日期哈希伪随机）
 * 从 index.html 迁移，保证每天数据稳定一致
 */

import { getLunarDate, DAYS_CN } from './lunar.js'

export const YI_POOL = ["出行","嫁娶","开业","签约","搬家","祈福","纳财","裁衣","会友","求医","置产","动土","开工","求职","宴请","剃头","安葬","立约"]
export const JI_POOL = ["动土","破土","行丧","开仓","出财","伐木","作梁","安床","安葬","嫁娶","入宅","修造","开市","乘船","针灸","词讼"]
export const COLORS = ["玫瑰金","靛蓝","星白","翠绿","绛红","明黄","紫罗兰","湖蓝","暮橙","银灰"]
export const DIRS = ["正东","正南","正西","正北","东南","西南","东北","西北"]
export const STARS = ["贪狼","巨门","禄存","文曲","廉贞","武曲","破军","左辅","右弼"]
export const JISHENS = ["天德","月德","岁合","五合","圣心","青龙","明堂","金匮","宝光","玉堂"]
export const XIONGSHAS = ["天刑","朱雀","勾陈","白虎","天牢","玄武"]
export const MOON_PHASES = ["新月","蛾眉月","上弦月","盈凸月","满月","亏凸月","下弦月","残月"]

export function hashDay(date) {
  return date.getFullYear() * 10000 + (date.getMonth()+1) * 100 + date.getDate()
}

export function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/**
 * 获取某天的黄历数据
 */
export function getDayData(date) {
  const seed = hashDay(date)
  const rand = seededRand(seed)

  const yiCount = 3 + Math.floor(rand() * 3)
  const yi = []
  const yiPool = [...YI_POOL].sort(() => rand() - 0.5)
  for (let i = 0; i < yiCount; i++) yi.push(yiPool[i])

  const jiCount = 2 + Math.floor(rand() * 3)
  const ji = []
  const jiPool = [...JI_POOL].filter(x => !yi.includes(x)).sort(() => rand() - 0.5)
  for (let i = 0; i < jiCount; i++) ji.push(jiPool[i])

  const color = COLORS[Math.floor(rand() * COLORS.length)]
  const num = [1,2,3,4,6,7,8,9][Math.floor(rand() * 8)]
  const dir = DIRS[Math.floor(rand() * DIRS.length)]
  const star = STARS[Math.floor(rand() * STARS.length)]

  const lunar = getLunarDate(date)
  const dayNum = DAYS_CN.indexOf(lunar.lunarDay)
  let moonPhase = "蛾眉月"
  if (dayNum === 0) moonPhase = "新月"
  else if (dayNum < 7) moonPhase = "蛾眉月"
  else if (dayNum === 7) moonPhase = "上弦月"
  else if (dayNum < 14) moonPhase = "盈凸月"
  else if (dayNum === 14 || dayNum === 15) moonPhase = "满月"
  else if (dayNum < 22) moonPhase = "亏凸月"
  else if (dayNum === 22) moonPhase = "下弦月"
  else moonPhase = "残月"

  const shens = JISHENS.sort(() => rand()-0.5).slice(0, 2+Math.floor(rand()*2))
  const shas = XIONGSHAS.sort(() => rand()-0.5).slice(0, 1+Math.floor(rand()*2))

  return { yi, ji, color, num, dir, star, moonPhase, shens, shas }
}
