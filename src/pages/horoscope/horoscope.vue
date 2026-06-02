<template>
  <view class="page-wrap">
    <!-- 星空背景 (CSS动画) -->
    <view class="stars-bg">
      <view class="star s1"></view><view class="star s2"></view><view class="star s3"></view>
      <view class="star s4"></view><view class="star s5"></view><view class="star s6"></view>
      <view class="star s7"></view><view class="star s8"></view><view class="star s9"></view>
      <view class="star s10"></view><view class="star s11"></view><view class="star s12"></view>
    </view>

    <!-- 星座选择页 -->
    <view v-if="!selectedZodiac" class="select-page">
      <view class="header">
        <view class="title">✨ 星座运势</view>
        <view class="subtitle">选择一个星座，查看完整运势</view>
      </view>
      <view class="zodiac-grid">
        <view 
          v-for="(z, idx) in zodiacList" 
          :key="idx" 
          class="zodiac-card"
          @tap="selectZodiac(idx)"
        >
          <text class="zodiac-icon">{{ z.icon }}</text>
          <view class="zodiac-name">{{ z.name }}</view>
          <view class="zodiac-date">{{ z.date }}</view>
        </view>
      </view>
    </view>

    <!-- 运势详情页 -->
    <view v-if="selectedZodiac" class="detail-page">
      <!-- 返回按钮 -->
      <view class="back-btn" @tap="goBack">← 返回</view>
      
      <!-- 星座头部 -->
      <view class="detail-header">
        <text class="detail-icon">{{ selectedZodiac.icon }}</text>
        <view class="detail-name">{{ selectedZodiac.name }}</view>
        <view class="detail-date">{{ selectedZodiac.date }}</view>
      </view>

      <!-- 周期切换 -->
      <view class="period-tabs">
        <view 
          v-for="p in periods" 
          :key="p.value" 
          class="period-tab"
          :class="{ active: currentPeriod === p.value }"
          @tap="switchPeriod(p.value)"
        >{{ p.label }}</view>
      </view>

      <!-- 运势评分 -->
      <view class="glass-card">
        <view class="card-title">今日评分</view>
        <view v-for="(score, key) in scores" :key="key" class="score-item">
          <text class="score-icon">{{ scoreIcons[key] }}</text>
          <view class="score-info">
            <view class="score-label">{{ scoreLabels[key] }}</view>
            <view class="score-stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ filled: i <= score }">★</text>
              <text class="score-value">{{ score }}.0</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 运势概述 -->
      <view class="glass-card">
        <view class="card-title">运势概述</view>
        <view class="fortune-text">{{ fortuneSummary }}</view>
      </view>

      <!-- 幸运信息 -->
      <view class="glass-card">
        <view class="card-title">幸运信息</view>
        <view class="lucky-grid">
          <view class="lucky-card">
            <view class="lucky-label">幸运色</view>
            <view class="lucky-value">{{ luckyColor }}</view>
          </view>
          <view class="lucky-card">
            <view class="lucky-label">幸运数字</view>
            <view class="lucky-value">{{ luckyNumber }}</view>
          </view>
          <view class="lucky-card">
            <view class="lucky-label">吉时</view>
            <view class="lucky-value">{{ luckyTime }}</view>
          </view>
        </view>
      </view>

      <!-- 速配星座 -->
      <view class="glass-card">
        <view class="card-title">最佳配对</view>
        <view class="match-grid">
          <view v-for="(m, idx) in matches" :key="idx" class="match-item">
            <text class="match-icon">{{ m.icon }}</text>
            <view class="match-name">{{ m.name }}</view>
            <view class="match-score">匹配度 {{ m.score }}%</view>
          </view>
        </view>
      </view>

      <!-- 分享按钮 -->
      <view class="share-btn" @tap="shareFortune">📤 分享运势</view>
    </view>
  </view>
</template>

<script>
import { zodiacData, fortuneTemplates, getFortuneScores, getMatchZodiacs, colors, numbers, scoreIcons, scoreLabels } from '@/utils/horoscope-data.js'

export default {
  data() {
    return {
      zodiacList: zodiacData,
      selectedZodiac: null,
      currentPeriod: 'today',
      periods: [
        { value: 'today', label: '今日' },
        { value: 'week', label: '本周' },
        { value: 'month', label: '本月' }
      ],
      scores: {},
      fortuneSummary: '',
      luckyColor: '',
      luckyNumber: '',
      luckyTime: '',
      matches: [],
      scoreIcons,
      scoreLabels
    }
  },
  onShareAppMessage() {
    if (this.selectedZodiac) {
      return {
        title: `我在玄机阁查看了${this.selectedZodiac.name}运势，快来测测你的！`,
        path: '/pages/horoscope/horoscope'
      }
    }
    return {
      title: '玄机阁 · 星座运势',
      path: '/pages/horoscope/horoscope'
    }
  },
  methods: {
    selectZodiac(index) {
      this.selectedZodiac = this.zodiacList[index]
      this.refreshFortune()
    },
    goBack() {
      this.selectedZodiac = null
    },
    switchPeriod(period) {
      this.currentPeriod = period
      this.refreshFortune()
    },
    refreshFortune() {
      if (!this.selectedZodiac) return
      
      const today = new Date()
      const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      const zodiacIndex = this.zodiacList.indexOf(this.selectedZodiac)
      const seed = dateSeed + zodiacIndex * 1000
      
      // 评分
      this.scores = getFortuneScores(dateSeed, zodiacIndex)
      
      // 运势概述
      const summaries = fortuneTemplates[this.currentPeriod] || fortuneTemplates.today
      const summaryIndex = (seed * 31) % summaries.length
      this.fortuneSummary = summaries[summaryIndex]
      
      // 幸运信息
      this.luckyColor = colors[(seed * 3) % colors.length]
      this.luckyNumber = numbers[(seed * 7) % numbers.length]
      this.luckyTime = `${9 + (seed % 5)}:00`
      
      // 速配星座
      this.matches = getMatchZodiacs(seed, zodiacIndex)
    },
    shareFortune() {
      if (!this.selectedZodiac) {
        uni.showToast({ title: '请先选择星座', icon: 'none' })
        return
      }
      
      // #ifdef MP-WEIXIN
      // 微信小程序会自动使用 onShareAppMessage
      wx.showShareMenu({ withShareTicket: true })
      uni.showToast({ title: '点击右上角分享', icon: 'none' })
      // #endif
      
      // #ifndef MP-WEIXIN
      const text = `我在玄机阁查看了${this.selectedZodiac.name}今日运势，快来测测你的！`
      uni.setClipboardData({ data: text })
      uni.showToast({ title: '已复制分享内容', icon: 'success' })
      // #endif
  }
  }
}
</script>

<style scoped>
.page-wrap {
  position: relative;
  z-index: 1;
  padding: 16px 20px 40px;
  min-height: 100vh;
}

/* 星空背景 - CSS动画 */
.stars-bg {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 0; pointer-events: none; overflow: hidden;
}
.star { position: absolute; width: 2px; height: 2px; background: #fff; border-radius: 50%; animation: twinkle 3s ease-in-out infinite; }
.star.s1  { top: 5%; left: 10%; animation-delay: 0s; }
.star.s2  { top: 12%; left: 25%; animation-delay: 0.3s; width: 2.5px; height: 2.5px; }
.star.s3  { top: 8%; left: 45%; animation-delay: 0.7s; }
.star.s4  { top: 18%; left: 65%; animation-delay: 1.2s; width: 1.5px; height: 1.5px; }
.star.s5  { top: 3%; left: 80%; animation-delay: 1.8s; }
.star.s6  { top: 22%; left: 90%; animation-delay: 0.5s; width: 3px; height: 3px; }
.star.s7  { top: 35%; left: 5%; animation-delay: 2.1s; }
.star.s8  { top: 45%; left: 20%; animation-delay: 1.5s; width: 2.5px; height: 2.5px; }
.star.s9  { top: 55%; left: 40%; animation-delay: 0.8s; }
.star.s10 { top: 65%; left: 60%; animation-delay: 2.4s; }
.star.s11 { top: 75%; left: 85%; animation-delay: 1.1s; width: 1.5px; height: 1.5px; }
.star.s12 { top: 90%; left: 12%; animation-delay: 0.2s; }
@keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }

/* 选择页 */
.header {
  text-align: center;
  padding: 20px 0 16px;
}
.title {
  font-size: 22px;
  color: #d4af37;
  letter-spacing: 4px;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 13px;
  color: #a09ab8;
}

.zodiac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.zodiac-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 16px 8px;
  text-align: center;
  transition: all 0.2s;
}
.zodiac-card:active {
  border-color: rgba(212, 175, 55, 0.5);
  transform: scale(0.97);
}
.zodiac-icon { font-size: 36px; display: block; margin-bottom: 8px; }
.zodiac-name {
  font-size: 15px;
  font-weight: 600;
  color: #f5f0e8;
  margin-bottom: 4px;
}
.zodiac-date {
  font-size: 11px;
  color: #a09ab8;
}

/* 详情页 */
.back-btn {
  display: inline-block;
  color: #d4af37;
  font-size: 14px;
  padding: 8px 0;
  margin-bottom: 8px;
}

.detail-header {
  text-align: center;
  padding: 8px 0 16px;
}
.detail-icon { font-size: 52px; display: block; margin-bottom: 8px; }
.detail-name {
  font-size: 24px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 4px;
}
.detail-date {
  font-size: 13px;
  color: #a09ab8;
}

/* 周期切换 */
.period-tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}
.period-tab {
  padding: 8px 24px;
  border-radius: 20px;
  background: rgba(26, 27, 60, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.2);
  color: #a09ab8;
  font-size: 13px;
  transition: all 0.2s;
}
.period-tab.active {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.4);
  color: #d4af37;
}

/* 通用卡片 */
.glass-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}
.card-title {
  font-size: 12px;
  color: #d4af37;
  letter-spacing: 2px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

/* 评分 */
.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.score-item:last-child { border-bottom: none; }
.score-icon { font-size: 24px; width: 36px; text-align: center; flex-shrink: 0; }
.score-info { flex: 1; }
.score-label { font-size: 12px; color: #a09ab8; margin-bottom: 4px; }
.score-stars { display: flex; align-items: center; gap: 2px; }
.star { font-size: 16px; color: rgba(255, 255, 255, 0.15); }
.star.filled { color: #d4af37; }
.score-value { font-size: 13px; color: #d4af37; font-weight: 600; margin-left: 6px; }

/* 运势文字 */
.fortune-text {
  font-size: 14px;
  color: #e8e0f0;
  line-height: 1.8;
}

/* 幸运信息 */
.lucky-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.lucky-card {
  background: rgba(212, 175, 55, 0.07);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
}
.lucky-label { font-size: 10px; color: #a09ab8; margin-bottom: 4px; }
.lucky-value { font-size: 15px; color: #d4af37; font-weight: 600; }

/* 速配星座 */
.match-grid {
  display: flex;
  gap: 12px;
}
.match-item {
  flex: 1;
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
}
.match-icon { font-size: 30px; display: block; margin-bottom: 6px; }
.match-name { font-size: 14px; color: #f5f0e8; margin-bottom: 4px; }
.match-score { font-size: 11px; color: #d4af37; }

/* 分享按钮 */
.share-btn {
  width: 100%;
  padding: 13px;
  text-align: center;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  color: #d4af37;
  font-size: 14px;
  margin-top: 16px;
}
</style>
