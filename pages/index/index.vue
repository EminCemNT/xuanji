<template>
  <view class="page-wrap">
    <!-- 星空背景 -->
    <canvas type="2d" id="stars-canvas" class="stars-canvas"></canvas>
    
    <!-- 日期导航栏 -->
    <view class="date-nav fade-in">
      <view class="date-nav-btn" @tap="goPrevDay">‹</view>
      <view class="date-nav-center">
        <view class="date-nav-label" @tap="openDatePicker">
          <text>{{ navDateText }}</text>
          <text class="cal-icon">📅</text>
        </view>
        <view class="date-nav-sub">{{ navSubText }}</view>
      </view>
      <view class="date-back-today" :class="{ visible: !isToday }" @tap="goToday">回今天</view>
      <view class="date-nav-btn" @tap="goNextDay">›</view>
    </view>

    <!-- 节气提示条 -->
    <view class="jieqi-bar fade-in delay-1">
      <view class="jieqi-dot"></view>
      <text>距下一个节气 <text class="gold-text">{{ jieqiName }}</text> 还有 <text class="gold-text">{{ jieqiDays }}</text> 天 · {{ jieqiDesc }}</text>
    </view>

    <!-- Hero 黄历卡 -->
    <view class="hero-card fade-in delay-1">
      <view class="hero-top">
        <view>
          <view class="hero-date-cn">🗓 {{ isToday ? '今日黄历' : '所选日期' }}</view>
          <view class="hero-date-big">{{ dateBig }}</view>
          <view class="hero-date-week">{{ dateWeek }}</view>
        </view>
        <view class="hero-lunar">
          <view class="hero-lunar-main">农历</view>
          <view class="hero-lunar-sub">{{ lunarMain }}</view>
          <view class="hero-lunar-sub">{{ lunarGanzhi }}</view>
        </view>
      </view>

      <view class="hero-divider"></view>

      <!-- 宜 -->
      <view class="yi-ji-row">
        <text class="yi-label">宜</text>
      </view>
      <view class="yi-ji-tags">
        <text class="tag tag-yi" v-for="(item, idx) in dayData.yi" :key="'yi'+idx">{{ item }}</text>
      </view>

      <!-- 忌 -->
      <view class="yi-ji-row" style="margin-top:8px">
        <text class="ji-label">忌</text>
      </view>
      <view class="yi-ji-tags">
        <text class="tag tag-ji" v-for="(item, idx) in dayData.ji" :key="'ji'+idx">{{ item }}</text>
      </view>

      <!-- 吉日数据 -->
      <view class="lucky-row">
        <view class="lucky-item">
          <view class="lucky-icon">🎨</view>
          <view class="lucky-key">吉色</view>
          <view class="lucky-val">{{ dayData.color || '--' }}</view>
        </view>
        <view class="lucky-item">
          <view class="lucky-icon">🔢</view>
          <view class="lucky-key">吉数</view>
          <view class="lucky-val">{{ dayData.num || '--' }}</view>
        </view>
        <view class="lucky-item">
          <view class="lucky-icon">🧭</view>
          <view class="lucky-key">贵人方</view>
          <view class="lucky-val">{{ dayData.dir || '--' }}</view>
        </view>
        <view class="lucky-item">
          <view class="lucky-icon">🌙</view>
          <view class="lucky-key">月相</view>
          <view class="lucky-val">{{ dayData.moonPhase || '--' }}</view>
        </view>
      </view>

      <view class="hero-btn" @tap="showModal">查看完整黄历 →</view>
    </view>

    <!-- 每日塔罗预告 -->
    <view class="tarot-preview fade-in delay-2" @tap="goTarot">
      <view class="tarot-card-thumb">{{ tarotCard.emoji }}</view>
      <view class="tarot-info">
        <view class="tarot-label">✦ 今日塔罗</view>
        <view class="tarot-name">{{ tarotCard.name }}</view>
        <view class="tarot-hint">{{ tarotCard.hint }}</view>
      </view>
      <view class="tarot-arrow">›</view>
    </view>

    <!-- 功能入口 -->
    <view class="section-title fade-in delay-3">探索更多</view>
    <view class="quick-grid fade-in delay-3">
      <view class="quick-card" @tap="goHoroscope">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">⭐</text>
        <view class="qc-title">星座运势</view>
        <view class="qc-desc">12星座日/周/月运势\n爱情·事业·财运</view>
      </view>
      <view class="quick-card" @tap="goMbti">
        <text class="qc-badge">热门</text>
        <text class="qc-icon">🧬</text>
        <view class="qc-title">MBTI 测试</view>
        <view class="qc-desc">16型人格完整版\n生成精美分享海报</view>
      </view>
      <view class="quick-card" @tap="goTarot">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">🔮</text>
        <view class="qc-title">塔罗占卜</view>
        <view class="qc-desc">多种专题牌阵\nAI 智能深度解读</view>
      </view>
      <view class="quick-card" @tap="showModal">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">🐉</text>
        <view class="qc-title">择吉黄历</view>
        <view class="qc-desc">婚期·开业·搬家\n自动筛选吉日</view>
      </view>
    </view>

    <!-- 黄历详情弹层 -->
    <view class="modal-overlay" :class="{ show: modalVisible }" @tap="hideModal">
      <view class="modal-sheet" @tap.stop>
        <view class="modal-handle"></view>
        <view class="modal-title">今日黄历详解</view>
        <view class="modal-subtitle">{{ navDateText }} · {{ lunarMain }}</view>

        <!-- 干支 -->
        <view class="detail-section">
          <view class="detail-section-title">今日干支</view>
          <view class="ganzhi-row">
            <view class="ganzhi-item">
              <view class="ganzhi-label">年柱</view>
              <view class="ganzhi-val">{{ lunarData.yearGZ }}</view>
            </view>
            <view class="ganzhi-item">
              <view class="ganzhi-label">月柱</view>
              <view class="ganzhi-val">{{ lunarData.monthGZ }}</view>
            </view>
            <view class="ganzhi-item">
              <view class="ganzhi-label">日柱</view>
              <view class="ganzhi-val">{{ lunarData.dayGZ }}</view>
            </view>
            <view class="ganzhi-item">
              <view class="ganzhi-label">值日星</view>
              <view class="ganzhi-val">{{ dayData.star || '--' }}</view>
            </view>
          </view>
        </view>

        <!-- 宜 -->
        <view class="detail-section">
          <view class="detail-section-title">宜 · 适合今日进行</view>
          <view class="detail-grid">
            <view class="detail-tag yi" v-for="(item, idx) in dayData.yi" :key="'myi'+idx">{{ item }}</view>
          </view>
        </view>

        <!-- 忌 -->
        <view class="detail-section">
          <view class="detail-section-title">忌 · 今日不宜</view>
          <view class="detail-grid">
            <view class="detail-tag ji" v-for="(item, idx) in dayData.ji" :key="'mji'+idx">{{ item }}</view>
          </view>
        </view>

        <!-- 吉神凶煞 -->
        <view class="detail-section">
          <view class="detail-section-title">吉神 / 凶煞</view>
          <view class="shens-row">
            <text class="shen-tag" v-for="(s, idx) in dayData.shens" :key="'shen'+idx">{{ s }}</text>
            <text class="sha-tag" v-for="(s, idx) in dayData.shas" :key="'sha'+idx">{{ s }}</text>
          </view>
        </view>

        <view class="modal-close" @tap="hideModal">收起</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getLunarDate, getDayData, getNextJieqi, getTodayTarot } from '@/utils/lunar.js'

export default {
  data() {
    return {
      currentDate: null,
      navDateText: '',
      navSubText: '',
      dateBig: '',
      dateWeek: '',
      lunarMain: '',
      lunarGanzhi: '',
      lunarData: {},
      dayData: {},
      tarotCard: { name: '', emoji: '🃏', hint: '' },
      jieqiName: '',
      jieqiDays: 0,
      jieqiDesc: '',
      modalVisible: false,
      starTimer: null
    }
  },
  computed: {
    isToday() {
      if (!this.currentDate) return true
      const now = new Date()
      return this.currentDate.toDateString() === now.toDateString()
    }
  },
  onLoad() {
    this.currentDate = new Date()
    this.currentDate.setHours(0, 0, 0, 0)
    this.refreshAll()
  },
  onReady() {
    this.$nextTick(() => {
      this.initStarfield()
    })
  },
  onUnload() {
    if (this.starTimer) clearInterval(this.starTimer)
  },
  onShareAppMessage() {
    return {
      title: '玄机阁 · 每天5分钟，读懂今天的自己',
      path: '/pages/index/index'
    }
  },
  methods: {
    refreshAll() {
      const d = this.currentDate
      
      // 日期文本
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      this.navDateText = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      this.navSubText = weekNames[d.getDay()]
      this.dateBig = `${d.getMonth() + 1}/${d.getDate()}`
      this.dateWeek = weekNames[d.getDay()]
      
      // 农历
      const lunar = getLunarDate(d)
      this.lunarData = lunar
      this.lunarMain = `${lunar.lunarMonth}${lunar.lunarDay}`
      this.lunarGanzhi = `${lunar.yearGZ}年 · 属${lunar.sx}`
      
      // 黄历
      this.dayData = getDayData(d)
      
      // 节气
      const jq = getNextJieqi(d)
      this.jieqiName = jq.name
      this.jieqiDays = jq.days
      this.jieqiDesc = jq.desc
      
      // 塔罗
      this.tarotCard = getTodayTarot(d)
    },
    goPrevDay() {
      this.currentDate.setDate(this.currentDate.getDate() - 1)
      this.refreshAll()
    },
    goNextDay() {
      this.currentDate.setDate(this.currentDate.getDate() + 1)
      this.refreshAll()
    },
    goToday() {
      this.currentDate = new Date()
      this.currentDate.setHours(0, 0, 0, 0)
      this.refreshAll()
    },
    openDatePicker() {
      // 使用微信原生日期选择器
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth() + 1
      const day = this.currentDate.getDate()
      
      // #ifdef MP-WEIXIN
      wx.showModal({
        title: '选择日期',
        content: `当前：${year}年${month}月${day}日`,
        showCancel: true,
        cancelText: '返回今天',
        confirmText: '我知道了',
        success: (res) => {
          if (res.cancel) {
            this.goToday()
          }
        }
      })
      // #endif
      
      // #ifndef MP-WEIXIN
      uni.showToast({ title: '请在微信小程序中体验此功能', icon: 'none' })
      // #endif
    },
    showModal() {
      this.modalVisible = true
    },
    hideModal() {
      this.modalVisible = false
    },
    goHoroscope() {
      uni.switchTab({ url: '/pages/horoscope/horoscope' })
    },
    goTarot() {
      uni.switchTab({ url: '/pages/tarot/tarot' })
    },
    goMbti() {
      uni.navigateTo({ url: '/pages/mbti/mbti' })
    },
    initStarfield() {
      // 使用 uni-app canvas
      const query = uni.createSelectorQuery().in(this)
      query.select('#stars-canvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio
        
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        
        const width = res[0].width
        const height = res[0].height
        
        // 生成星星
        const stars = []
        for (let i = 0; i < 80; i++) {
          stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random(),
            speed: Math.random() * 0.02 + 0.005
          })
        }
        
        const draw = () => {
          ctx.clearRect(0, 0, width, height)
          stars.forEach(s => {
            s.alpha += s.speed
            if (s.alpha > 1 || s.alpha < 0.2) s.speed *= -1
            
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,255,255,${s.alpha})`
            ctx.fill()
          })
        }
        
        const animate = () => {
          draw()
          this.starTimer = setTimeout(() => animate(), 50)
        }
        animate()
      })
    }
  }
}
</script>

<style scoped>
.page-wrap {
  position: relative;
  z-index: 1;
  padding: 0 16px 40px;
  min-height: 100vh;
}

/* 星空背景 */
.stars-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* 日期导航栏 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 10px;
  gap: 8px;
}
.date-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(212, 175, 55, 0.25);
  background: rgba(212, 175, 55, 0.08);
  color: #d4af37;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.date-nav-center {
  flex: 1;
  text-align: center;
}
.date-nav-label {
  font-size: 15px;
  font-weight: 600;
  color: #f5f0e8;
  letter-spacing: 1px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cal-icon {
  font-size: 14px;
  opacity: 0.7;
}
.date-nav-sub {
  font-size: 11px;
  color: #a09ab8;
  margin-top: 2px;
}
.date-back-today {
  font-size: 11px;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
  display: none;
}
.date-back-today.visible {
  display: inline-block;
}

/* 节气提示 */
.jieqi-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.03));
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #a09ab8;
}
.jieqi-dot {
  width: 6px;
  height: 6px;
  background: #d4af37;
  border-radius: 50%;
  flex-shrink: 0;
}
.gold-text {
  color: #d4af37;
}

/* Hero 黄历卡 */
.hero-card {
  background: linear-gradient(135deg, rgba(26, 27, 60, 0.85) 0%, rgba(40, 20, 60, 0.85) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.hero-date-cn {
  font-size: 13px;
  color: #d4af37;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.hero-date-big {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  color: #f5f0e8;
}
.hero-date-week {
  font-size: 13px;
  color: #a09ab8;
  margin-top: 4px;
}
.hero-lunar {
  text-align: right;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  padding: 8px 12px;
}
.hero-lunar-main {
  font-size: 15px;
  color: #d4af37;
  font-weight: 600;
}
.hero-lunar-sub {
  font-size: 11px;
  color: #a09ab8;
  margin-top: 2px;
}
.hero-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.25), transparent);
  margin: 16px 0;
}

/* 宜忌标签 */
.yi-ji-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.yi-label, .ji-label {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}
.yi-label {
  background: rgba(80, 180, 100, 0.15);
  color: #6ddc8b;
  border: 1px solid rgba(80, 180, 100, 0.25);
}
.ji-label {
  background: rgba(220, 80, 80, 0.12);
  color: #e88080;
  border: 1px solid rgba(220, 80, 80, 0.2);
}
.yi-ji-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
}
.tag-yi {
  background: rgba(80, 180, 100, 0.12);
  color: #9de8b0;
  border: 1px solid rgba(80, 180, 100, 0.2);
}
.tag-ji {
  background: rgba(220, 80, 80, 0.1);
  color: #e8a0a0;
  border: 1px solid rgba(220, 80, 80, 0.15);
}

/* 吉日行 */
.lucky-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.lucky-item {
  background: rgba(212, 175, 55, 0.07);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 10px;
  padding: 10px 6px;
  text-align: center;
}
.lucky-icon { font-size: 18px; margin-bottom: 4px; }
.lucky-key { font-size: 10px; color: #a09ab8; margin-bottom: 2px; }
.lucky-val { font-size: 13px; color: #d4af37; font-weight: 600; }

.hero-btn {
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 11px;
  text-align: center;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  color: #d4af37;
  font-size: 13px;
}

/* 塔罗预览 */
.tarot-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(80, 40, 120, 0.4), rgba(26, 27, 60, 0.7));
  border: 1px solid rgba(150, 80, 200, 0.2);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}
.tarot-card-thumb {
  width: 52px;
  height: 80px;
  background: linear-gradient(135deg, #2a1060, #4a20a0);
  border-radius: 8px;
  border: 1px solid rgba(150, 80, 200, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(80, 40, 120, 0.4);
}
.tarot-info { flex: 1; }
.tarot-label {
  font-size: 11px;
  color: #b080e0;
  margin-bottom: 4px;
  letter-spacing: 1px;
}
.tarot-name {
  font-size: 18px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 6px;
}
.tarot-hint {
  font-size: 12px;
  color: #a09ab8;
  line-height: 1.6;
}
.tarot-arrow {
  font-size: 18px;
  color: #a09ab8;
  flex-shrink: 0;
}

/* 功能入口 */
.section-title {
  font-size: 13px;
  color: #a09ab8;
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(212, 175, 55, 0.25);
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.quick-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 18px 16px;
  position: relative;
  overflow: hidden;
}
.qc-icon { font-size: 28px; margin-bottom: 8px; display: block; }
.qc-title { font-size: 16px; font-weight: 600; color: #f5f0e8; margin-bottom: 4px; }
.qc-desc { font-size: 11px; color: #a09ab8; line-height: 1.5; white-space: pre-line; }
.qc-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  background: rgba(212, 175, 55, 0.15);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.25);
}

/* 弹层 */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 200;
  align-items: flex-end;
  justify-content: center;
}
.modal-overlay.show { display: flex; }
.modal-sheet {
  width: 100%;
  max-width: 480px;
  background: #131428;
  border-top: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px 20px 0 0;
  padding: 0 20px 32px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.modal-handle {
  width: 36px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  margin: 12px auto 20px;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 4px;
}
.modal-subtitle {
  font-size: 12px;
  color: #a09ab8;
  margin-bottom: 20px;
}
.detail-section { margin-bottom: 20px; }
.detail-section-title {
  font-size: 12px;
  color: #d4af37;
  letter-spacing: 2px;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.detail-tag {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
  font-size: 13px;
}
.detail-tag.yi { border-color: rgba(80, 180, 100, 0.2); color: #9de8b0; }
.detail-tag.ji { border-color: rgba(220, 80, 80, 0.15); color: #e8a0a0; }

.shens-row { display: flex; gap: 8px; flex-wrap: wrap; }
.shen-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(212, 175, 55, 0.08);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.2);
}
.sha-tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(220, 80, 80, 0.08);
  color: #e88080;
  border: 1px solid rgba(220, 80, 80, 0.15);
}

.ganzhi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.ganzhi-item {
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 10px;
  padding: 10px 6px;
  text-align: center;
}
.ganzhi-label { font-size: 10px; color: #a09ab8; margin-bottom: 4px; }
.ganzhi-val { font-size: 15px; color: #f5f0e8; font-weight: 600; }

.modal-close {
  width: 100%;
  padding: 13px;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 12px;
  color: #d4af37;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
}

/* 动效 */
.fade-in { animation: fadeIn 0.5s ease both; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
</style>
