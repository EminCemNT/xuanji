<template>
  <view class="page-wrap">
    <!-- 星空背景 -->
    <view class="stars">
      <view v-for="s in starList" :key="s.id" class="star"
        :style="{ left: s.x+'%', top: s.y+'%', animationDelay: s.delay+'s', animationDuration: s.dur+'s' }" />
    </view>

    <view class="container">
      <!-- 顶部 -->
      <view class="header">
        <view class="page-title">⭐ 星座运势</view>
      </view>

      <!-- 星座选择 -->
      <view v-if="!currentZodiac">
        <view class="select-title">
          <text class="select-h1">✨ 选择你的星座</text>
          <text class="select-sub">查看专属运势解读</text>
        </view>
        <view class="zodiac-grid">
          <view
            v-for="(z, i) in zodiacData"
            :key="i"
            class="zodiac-card"
            @tap="selectZodiac(i)"
          >
            <text class="zodiac-icon">{{ z.icon }}</text>
            <view class="zodiac-name">{{ z.name }}</view>
            <view class="zodiac-date">{{ z.date }}</view>
          </view>
        </view>
      </view>

      <!-- 运势详情 -->
      <view v-else>
        <!-- 返回按钮 -->
        <view class="back-row" @tap="currentZodiac = null">
          <text class="back-btn">← 返回</text>
        </view>

        <!-- 星座头部 -->
        <view class="detail-header">
          <text class="detail-icon">{{ currentZodiac.icon }}</text>
          <view class="detail-name">{{ currentZodiac.name }}</view>
          <view class="detail-date-text">{{ currentZodiac.date }}</view>
        </view>

        <!-- 日期切换 -->
        <view class="period-tabs">
          <view
            v-for="p in periods"
            :key="p.value"
            class="period-tab"
            :class="{ active: currentPeriod === p.value }"
            @tap="currentPeriod = p.value"
          >{{ p.label }}</view>
        </view>

        <!-- 运势评分 -->
        <view class="glass-card fortune-overview">
          <view class="fortune-scores">
            <view v-for="item in scoreItems" :key="item.key" class="score-item">
              <view class="score-icon" :class="item.key">{{ item.emoji }}</view>
              <view class="score-info">
                <view class="score-label">{{ item.label }}</view>
                <view class="score-stars">
                  <text
                    v-for="n in 5"
                    :key="n"
                    class="star-sym"
                    :class="{ filled: n <= fortune.scores[item.key] }"
                  >★</text>
                  <text class="score-value">{{ fortune.scores[item.key] }}.0</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 运势概述 -->
        <view class="glass-card fortune-content">
          <view class="content-title">
            <text class="icon">🔮</text> 运势概述
          </view>
          <view class="content-text">{{ fortune.summary }}</view>
        </view>

        <!-- 幸运信息 -->
        <view class="lucky-info">
          <view class="lucky-card glass-card">
            <view class="lucky-label">幸运色</view>
            <view class="lucky-value">{{ fortune.color }}</view>
          </view>
          <view class="lucky-card glass-card">
            <view class="lucky-label">幸运数字</view>
            <view class="lucky-value">{{ fortune.number }}</view>
          </view>
          <view class="lucky-card glass-card">
            <view class="lucky-label">吉时</view>
            <view class="lucky-value">{{ fortune.hour }}:00</view>
          </view>
        </view>

        <!-- 速配星座 -->
        <view class="glass-card match-section">
          <view class="match-title">💕 速配星座</view>
          <view class="match-grid">
            <view v-for="m in fortune.matches" :key="m.index" class="match-item">
              <text class="match-icon">{{ zodiacData[m.index].icon }}</text>
              <view class="match-name">{{ zodiacData[m.index].name }}</view>
              <view class="match-score">匹配度 {{ m.score }}%</view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// 星空
const starList = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: (Math.random() * 3).toFixed(1),
  dur: (2 + Math.random() * 2).toFixed(1)
}))

// 星座数据
const zodiacData = [
  { name: '白羊座', icon: '♈', date: '3.21 - 4.19' },
  { name: '金牛座', icon: '♉', date: '4.20 - 5.20' },
  { name: '双子座', icon: '♊', date: '5.21 - 6.21' },
  { name: '巨蟹座', icon: '♋', date: '6.22 - 7.22' },
  { name: '狮子座', icon: '♌', date: '7.23 - 8.22' },
  { name: '处女座', icon: '♍', date: '8.23 - 9.22' },
  { name: '天秤座', icon: '♎', date: '9.23 - 10.23' },
  { name: '天蝎座', icon: '♏', date: '10.24 - 11.22' },
  { name: '射手座', icon: '♐', date: '11.23 - 12.21' },
  { name: '摩羯座', icon: '♑', date: '12.22 - 1.19' },
  { name: '水瓶座', icon: '♒', date: '1.20 - 2.18' },
  { name: '双鱼座', icon: '♓', date: '2.19 - 3.20' }
]

const periods = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' }
]

const scoreItems = [
  { key: 'love', emoji: '💕', label: '爱情' },
  { key: 'career', emoji: '💼', label: '事业' },
  { key: 'wealth', emoji: '💰', label: '财运' },
  { key: 'health', emoji: '💪', label: '健康' }
]

const fortuneTemplates = {
  today: [
    '今天能量充沛，适合主动出击。工作上会有意外收获，保持积极心态。',
    '今日宜静不宜动，多观察少说话。贵人运不错，遇到问题可寻求帮助。',
    '情绪起伏较大，建议做些冥想或运动。财运平稳，不宜大额投资。',
    '人际关系是今日重点，多参加社交活动。桃花运旺，单身者有机会。',
    '工作效率极高，适合处理积压事务。健康注意颈椎，多活动。',
    '灵感迸发的一天，适合创意工作。感情上需要更多耐心和理解。',
    '今日适合独处思考，整理近期计划。财务上有小惊喜，留意意外收入。',
    '行动力满满，适合推进重要项目。注意劳逸结合，别透支体力。'
  ],
  week: [
    '本周整体运势稳步上升，前半周宜积累，后半周宜收获。',
    '本周事业方面有贵人相助，把握住机遇就能取得突破。',
    '本周财运偏弱，建议暂缓大额支出。感情上多一份理解便可化解。',
    '本周灵感充沛，适合启动创意项目。爱情方面有意外惊喜。',
    '本周工作压力偏大，但咬牙坚持后将迎来回报。',
    '本周人际关系是核心，多表达关怀，多倾听他人。财运有好消息。',
    '本周整体运势平稳，适合夯实基础而非激进冒险。',
    '本周贵人运旺，可以向他人寻求建议或帮助。'
  ],
  month: [
    '本月整体大运不俗，下半月尤为关键。工作上将有重要机会窗口。',
    '本月财运呈波动趋势，月中有小高峰，适合做些理财规划。',
    '本月是事业蓄力的好时机，打基础、建人脉将在下季度得到回报。',
    '本月社交运旺盛，通过人脉带来的机会不可忽视。',
    '本月适合突破舒适区，尝试新事物。工作上可能面临转型。',
    '本月情感世界较为丰富，建议梳理清楚内心真实需求。',
    '本月财运亮眼，可能有意外收入。',
    '本月整体运势先抑后扬，月末迎来期待已久的好消息。'
  ]
}

const colors = ['金色', '紫色', '蓝色', '绿色', '红色', '橙色', '粉色', '银色']
const numbers = ['3', '7', '9', '12', '18', '21', '28', '33']

const currentZodiac = ref(null)
const currentZodiacIndex = ref(0)
const currentPeriod = ref('today')

function selectZodiac(index) {
  currentZodiacIndex.value = index
  currentZodiac.value = zodiacData[index]
  currentPeriod.value = 'today'
}

const fortune = computed(() => {
  if (!currentZodiac.value) return {}
  const today = new Date()
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const seed = dateSeed + currentZodiacIndex.value * 1000

  const scores = {
    love: (seed % 5) + 1,
    career: ((seed * 7) % 5) + 1,
    wealth: ((seed * 13) % 5) + 1,
    health: ((seed * 17) % 5) + 1
  }

  const templates = fortuneTemplates[currentPeriod.value] || fortuneTemplates.today
  const summary = templates[(seed * 31) % templates.length]
  const color = colors[(seed * 3) % colors.length]
  const number = numbers[(seed * 7) % numbers.length]
  const hour = 9 + (seed % 5)

  const matchIndex1 = (seed * 11) % 12
  let matchIndex2 = (seed * 23) % 12
  if (matchIndex2 === matchIndex1) matchIndex2 = (matchIndex2 + 1) % 12

  return {
    scores,
    summary,
    color,
    number,
    hour,
    matches: [
      { index: matchIndex1, score: 98 },
      { index: matchIndex2, score: 92 }
    ]
  }
})
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1b3c 50%, #0d0d1f 100%);
  color: #F5F0E8;
}

/* 星空 */
.stars { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
.star { position: absolute; width: 3rpx; height: 3rpx; background: #d4af37; border-radius: 50%; animation: twinkle 3s infinite alternate; }
@keyframes twinkle { 0% { opacity: 0.15; } 100% { opacity: 0.8; } }

.container {
  position: relative; z-index: 1;
  padding: 20rpx 32rpx 120rpx;
}

/* 顶部 */
.header { margin-bottom: 40rpx; padding-top: 20rpx; }
.page-title {
  font-size: 36rpx; font-weight: 600; text-align: center;
  background: linear-gradient(135deg, #D4AF37, #F5F0E8);
  -webkit-background-clip: text; color: transparent;
}

/* 星座选择 */
.select-title { text-align: center; margin-bottom: 48rpx; }
.select-h1 { display: block; font-size: 40rpx; font-weight: 600; color: #D4AF37; margin-bottom: 12rpx; }
.select-sub { display: block; font-size: 26rpx; color: rgba(245,240,232,0.6); }

.zodiac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.zodiac-card {
  background: rgba(255,255,255,0.05);
  border: 1rpx solid rgba(255,255,255,0.1);
  border-radius: 24rpx;
  padding: 32rpx 20rpx;
  text-align: center;
  transition: all 0.3s;
}

.zodiac-card:active {
  border-color: rgba(212,175,55,0.5);
  background: rgba(212,175,55,0.1);
  transform: translateY(-4rpx);
}

.zodiac-icon { font-size: 56rpx; display: block; margin-bottom: 12rpx; }
.zodiac-name { font-size: 28rpx; font-weight: 500; color: #F5F0E8; margin-bottom: 4rpx; }
.zodiac-date { font-size: 20rpx; color: rgba(245,240,232,0.5); }

/* 详情 */
.back-row { margin-bottom: 24rpx; }
.back-btn { color: #D4AF37; font-size: 28rpx; }

.detail-header { text-align: center; margin-bottom: 40rpx; }
.detail-icon { font-size: 120rpx; display: block; margin-bottom: 16rpx; }
.detail-name {
  font-size: 48rpx; font-weight: 600; margin-bottom: 8rpx;
  background: linear-gradient(135deg, #D4AF37, #F5F0E8);
  -webkit-background-clip: text; color: transparent;
}
.detail-date-text { font-size: 24rpx; color: rgba(245,240,232,0.6); }

/* 日期切换 */
.period-tabs {
  display: flex; gap: 12rpx; margin-bottom: 32rpx;
  background: rgba(255,255,255,0.05);
  border-radius: 20rpx; padding: 8rpx;
}
.period-tab {
  flex: 1; padding: 16rpx; text-align: center;
  border-radius: 16rpx; font-size: 26rpx;
  color: rgba(245,240,232,0.6); transition: all 0.3s;
}
.period-tab.active {
  background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.1));
  color: #D4AF37; font-weight: 500;
}

/* 玻璃卡片 */
.glass-card {
  background: rgba(255,255,255,0.05);
  border: 1rpx solid rgba(255,255,255,0.1);
  border-radius: 32rpx; padding: 32rpx;
  margin-bottom: 24rpx;
}

/* 评分 */
.fortune-scores {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24rpx;
}
.score-item { display: flex; align-items: center; gap: 16rpx; }
.score-icon {
  width: 64rpx; height: 64rpx; border-radius: 18rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx;
}
.score-icon.love { background: rgba(255,107,107,0.15); }
.score-icon.career { background: rgba(78,205,196,0.15); }
.score-icon.wealth { background: rgba(212,175,55,0.15); }
.score-icon.health { background: rgba(150,206,180,0.15); }
.score-info { flex: 1; }
.score-label { font-size: 22rpx; color: rgba(245,240,232,0.6); margin-bottom: 8rpx; }
.score-stars { display: flex; align-items: center; gap: 4rpx; }
.star-sym { font-size: 24rpx; color: rgba(245,240,232,0.2); }
.star-sym.filled { color: #D4AF37; }
.score-value { font-size: 22rpx; color: #D4AF37; margin-left: 8rpx; }

/* 概述 */
.content-title {
  font-size: 28rpx; font-weight: 600; margin-bottom: 20rpx;
  color: #F5F0E8;
}
.content-title .icon { margin-right: 8rpx; }
.content-text {
  font-size: 26rpx; line-height: 1.8;
  color: rgba(245,240,232,0.85);
}

/* 幸运信息 */
.lucky-info {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 16rpx; margin-bottom: 24rpx;
}
.lucky-card { padding: 24rpx 16rpx; text-align: center; border-radius: 24rpx; }
.lucky-label { font-size: 22rpx; color: rgba(245,240,232,0.5); margin-bottom: 10rpx; }
.lucky-value { font-size: 28rpx; font-weight: 600; color: #D4AF37; }

/* 速配 */
.match-section { margin-bottom: 0; }
.match-title { font-size: 28rpx; font-weight: 600; text-align: center; margin-bottom: 24rpx; }
.match-grid { display: flex; justify-content: center; gap: 60rpx; }
.match-item { text-align: center; }
.match-icon { font-size: 72rpx; display: block; margin-bottom: 10rpx; }
.match-name { font-size: 26rpx; color: #F5F0E8; margin-bottom: 4rpx; }
.match-score { font-size: 22rpx; color: #D4AF37; }
</style>
