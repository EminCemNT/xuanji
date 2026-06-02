<template>
  <view class="page-wrap">
    <!-- 星空背景 (CSS动画，无Canvas依赖) -->
    <view class="stars-bg">
      <view class="star s1"></view><view class="star s2"></view><view class="star s3"></view>
      <view class="star s4"></view><view class="star s5"></view><view class="star s6"></view>
      <view class="star s7"></view><view class="star s8"></view><view class="star s9"></view>
      <view class="star s10"></view><view class="star s11"></view><view class="star s12"></view>
    </view>
    
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

    <!-- 日历弹窗 -->
    <view class="calendar-overlay" :class="{ show: calendarVisible }" @tap="closeCalendar">
      <view class="calendar-sheet" @tap.stop>
        <view class="cal-header">
          <view class="cal-nav-btn" @tap="calPrevMonth">‹</view>
          <view class="cal-title">{{ calYear }}年 {{ calMonth }}月</view>
          <view class="cal-nav-btn" @tap="calNextMonth">›</view>
        </view>
        <view class="cal-weekdays">
          <text v-for="wd in ['日','一','二','三','四','五','六']" :key="wd" class="cal-wd">{{ wd }}</text>
        </view>
        <view class="cal-days">
          <view
            v-for="(day, idx) in calDays"
            :key="idx"
            class="cal-day"
            :class="{
              'cal-day-empty': !day.day,
              'cal-day-today': day.isToday,
              'cal-day-selected': day.isSelected
            }"
            @tap="day.day ? onCalDayTap(day) : null"
          >
            <text>{{ day.day || '' }}</text>
            <text class="cal-day-lunar" v-if="day.lunar">{{ day.lunar }}</text>
          </view>
        </view>
        <view class="cal-footer">
          <view class="cal-footer-btn" @tap="calGoToday">回到今天</view>
          <view class="cal-footer-btn cal-footer-btn-primary" @tap="calConfirm">确定</view>
        </view>
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

// 简化版农历日（只用日期数字）
function getLunarDay(y, m, d) {
  try {
    const l = getLunarDate(new Date(y, m - 1, d))
    const parts = l.lunarDay.match(/[^\d]*(\d+)/)
    return parts ? parts[1] : l.lunarDay.slice(0, 2)
  } catch (e) {
    return ''
  }
}

export default {
  data() {
    const now = new Date()
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
      // 日历弹窗
      calendarVisible: false,
      pendingDate: null,   // 日历中临时选中的日期（未确认）
      calYear: now.getFullYear(),
      calMonth: now.getMonth() + 1
    }
  },
  computed: {
    isToday() {
      if (!this.currentDate) return true
      const now = new Date()
      return this.currentDate.toDateString() === now.toDateString()
    },
    calDays() {
      const y = this.calYear
      const m = this.calMonth
      const firstDay = new Date(y, m - 1, 1)
      const startDow = firstDay.getDay() // 0=Sun
      const totalDays = new Date(y, m, 0).getDate()
      const today = new Date()
      const todayStr = `${today.getFullYear()}/${today.getMonth()}/${today.getDate()}`
      // 用 pendingDate 判断高亮，没有则用 currentDate
      const pending = this.pendingDate || this.currentDate
      const selStr = pending
        ? `${pending.getFullYear()}/${pending.getMonth()}/${pending.getDate()}`
        : ''

      const cells = []
      // 填充上月空白
      for (let i = 0; i < startDow; i++) {
        cells.push({ day: 0, isToday: false, isSelected: false, lunar: '' })
      }
      // 本月日期
      for (let d = 1; d <= totalDays; d++) {
        const ds = `${y}/${m - 1}/${d}`
        cells.push({
          day: d,
          isToday: ds === todayStr,
          isSelected: ds === selStr,
          lunar: getLunarDay(y, m, d)
        })
      }
      return cells
    }
  },
  onLoad() {
    this.currentDate = new Date()
    this.currentDate.setHours(0, 0, 0, 0)
    this.refreshAll()
  },
  onReady() {},
  onUnload() {},
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
      // 打开时同步到当前选中日期
      if (this.currentDate) {
        this.calYear = this.currentDate.getFullYear()
        this.calMonth = this.currentDate.getMonth() + 1
      }
      this.calendarVisible = true
    },
    closeCalendar() {
      this.calendarVisible = false
    },
    calPrevMonth() {
      if (this.calMonth === 1) {
        this.calYear--
        this.calMonth = 12
      } else {
        this.calMonth--
      }
    },
    calNextMonth() {
      if (this.calMonth === 12) {
        this.calYear++
        this.calMonth = 1
      } else {
        this.calMonth++
      }
    },
    calGoToday() {
      const now = new Date()
      this.pendingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      this.calYear = now.getFullYear()
      this.calMonth = now.getMonth() + 1
    },
    calConfirm() {
      if (this.pendingDate) {
        this.currentDate = new Date(this.pendingDate)
        this.pendingDate = null
        this.refreshAll()
      }
      this.calendarVisible = false
    },
    onCalDayTap(day) {
      // 只记录临时选择，不关闭弹窗
      console.log('[onCalDayTap] day=' + day.day + ', setting pendingDate only')
      this.pendingDate = new Date(this.calYear, this.calMonth - 1, day.day)
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

/* 星空背景 - CSS动画 */
.stars-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s ease-in-out infinite;
}
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

@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
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

/* ===== 日历弹窗 ===== */
.calendar-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.25s;
}
.calendar-overlay.show { opacity: 1; pointer-events: auto; }

.calendar-sheet {
  width: 100%; max-width: 420px;
  background: #1a1a2e; border-radius: 20px 20px 0 0;
  padding: 20px 16px 30px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.calendar-overlay.show .calendar-sheet { transform: translateY(0); }

.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.cal-nav-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(201,169,110,0.15); color: #c9a96e;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: bold;
}
.cal-title { font-size: 18px; font-weight: 600; color: #eee; }

.cal-weekdays {
  display: flex; justify-content: space-around;
  margin-bottom: 8px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.cal-wd {
  width: 40px; text-align: center; font-size: 13px; color: #888;
}
.cal-wd:first-child { color: #c9a96e; }

.cal-days {
  display: flex; flex-wrap: wrap;
}
.cal-day {
  width: calc(100% / 7); aspect-ratio: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  border-radius: 12px; font-size: 16px; color: #ccc;
  transition: background 0.15s;
  box-sizing: border-box;
}
.cal-day-empty { pointer-events: none; }
.cal-day-today {
  background: rgba(201,169,110,0.12); color: #c9a96e; font-weight: 700;
}
.cal-day-selected {
  background: rgba(201,169,110,0.3); color: #fff; font-weight: 700;
  box-shadow: 0 0 0 2px #c9a96e;
}
.cal-day-lunar {
  font-size: 10px; color: #777; margin-top: -2px;
  white-space: nowrap; overflow: hidden; max-width: 36px; text-align: center;
}
.cal-day-today .cal-day-lunar { color: rgba(201,169,110,0.7); }
.cal-day-selected .cal-day-lunar { color: rgba(255,255,255,0.6); }

.cal-footer {
  display: flex; gap: 12px; margin-top: 16px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.cal-footer-btn {
  flex: 1; text-align: center; padding: 12px; border-radius: 10px;
  font-size: 15px; font-weight: 600; color: #c9a96e;
  background: rgba(201,169,110,0.1);
}
.cal-footer-btn-primary {
  background: rgba(201,169,110,0.22);
  color: #f0dca0;
}
</style>
