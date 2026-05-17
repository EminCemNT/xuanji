<template>
  <view class="page-wrap">

    <!-- 顶部导航 -->
    <view class="topbar">
      <view class="logo">
        <text class="logo-text">玄机阁</text>
        <text class="logo-sub">XuanJi · 每天5分钟</text>
      </view>
      <view class="topbar-right" @tap="goProfile">
        <text class="topbar-icon">🔔</text>
        <text class="topbar-icon">👤</text>
      </view>
    </view>

    <!-- 节气提示 -->
    <view class="jieqi-bar" v-if="jieqi">
      <view class="jieqi-dot"></view>
      <text class="jieqi-text">
        {{ jieqi.isToday ? '🎉 今天是' : '距下一个节气' }}
        <text class="jieqi-name">{{ jieqi.name }}</text>
        <template v-if="!jieqi.isToday"> 还有 <text class="jieqi-days">{{ jieqi.days }}</text> 天</template>
        · {{ jieqi.desc }}
      </text>
    </view>

    <!-- Hero 黄历卡 -->
    <view class="hero-card">
      <!-- 日期导航栏 -->
      <view class="date-nav">
        <view class="date-nav-btn" hover-class="btn-pressed" @tap="goPrevDay">‹</view>
        <view class="date-nav-center" @tap="showDatePicker = true">
          <view class="date-nav-label">
            <text class="nav-date-text">{{ dateLabel }}</text>
            <text class="cal-icon" @tap.stop="showDatePicker = true">📅</text>
          </view>
          <text class="date-nav-sub">{{ isToday ? '今天 · 点击切换日期' : '点击切换日期' }}</text>
        </view>
        <text v-if="!isToday" class="date-back-today" hover-class="btn-pressed" @tap="goToday">回今天</text>
        <view class="date-nav-btn" hover-class="btn-pressed" @tap="goNextDay">›</view>
      </view>

      <view class="hero-top">
        <view>
          <text class="hero-date-cn">{{ isToday ? '🗓 今日黄历' : '🗓 黄历' }}</text>
          <text class="hero-date-big">{{ currentDate.getDate() }}</text>
          <text class="hero-date-week">{{ weekMap[currentDate.getDay()] }}</text>
        </view>
        <view class="hero-lunar">
          <text class="hero-lunar-main">{{ lunar ? lunar.lunarMonth + lunar.lunarDay : '' }}</text>
          <text class="hero-lunar-sub">{{ lunar ? lunar.yearGZ + '(' + lunar.sx + '年)' : '' }}</text>
          <text class="hero-lunar-sub">{{ lunar ? lunar.monthGZ + '月 ' + lunar.dayGZ + '日' : '' }}</text>
        </view>
      </view>

      <view class="hero-divider"></view>

      <!-- 宜 -->
      <view class="yi-ji-row"><text class="yi-label">宜</text></view>
      <view class="yi-ji-tags">
        <text class="tag tag-yi" v-for="(item, idx) in dayData.yi" :key="'yi'+idx">{{ item }}</text>
      </view>

      <!-- 忌 -->
      <view class="yi-ji-row" style="margin-top:8px"><text class="ji-label">忌</text></view>
      <view class="yi-ji-tags">
        <text class="tag tag-ji" v-for="(item, idx) in dayData.ji" :key="'ji'+idx">{{ item }}</text>
      </view>

      <!-- 吉日数据 -->
      <view class="lucky-row">
        <view class="lucky-item">
          <text class="lucky-icon">🎨</text><text class="lucky-key">吉色</text>
          <text class="lucky-val">{{ dayData.color }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-icon">🔢</text><text class="lucky-key">吉数</text>
          <text class="lucky-val">{{ dayData.num }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-icon">🧭</text><text class="lucky-key">贵人方</text>
          <text class="lucky-val">{{ dayData.dir }}</text>
        </view>
        <view class="lucky-item">
          <text class="lucky-icon">🌙</text><text class="lucky-key">月相</text>
          <text class="lucky-val">{{ dayData.moonPhase }}</text>
        </view>
      </view>

      <view class="hero-btn" @tap="showModal = true">查看完整黄历 →</view>
    </view>

    <!-- 每日塔罗预告 -->
    <view class="tarot-preview" @tap="goTarot">
      <text class="tarot-card-thumb">{{ todayTarot.emoji || '🃏' }}</text>
      <view class="tarot-info">
        <text class="tarot-label">✦ 今日塔罗</text>
        <text class="tarot-name">{{ todayTarot.name || '正在抽取...' }}</text>
        <text class="tarot-hint">{{ todayTarot.hint || '点击查看今日牌义与建议' }}</text>
      </view>
      <text class="tarot-arrow">›</text>
    </view>

    <!-- 功能入口 -->
    <text class="section-title">探索更多</text>
    <view class="quick-grid">
      <view class="quick-card" @tap="goPage('/pages/horoscope/horoscope')">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">⭐</text>
        <text class="qc-title">星座运势</text>
        <text class="qc-desc">12星座日/周/月运势\n爱情·事业·财运</text>
      </view>
      <view class="quick-card" @tap="goPage('/pages/mbti/mbti')">
        <text class="qc-badge">热门</text>
        <text class="qc-icon">🧬</text>
        <text class="qc-title">MBTI 测试</text>
        <text class="qc-desc">16型人格完整版\n生成精美分享海报</text>
      </view>
      <view class="quick-card" @tap="goPage('/pages/tarot/tarot')">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">🔮</text>
        <text class="qc-title">塔罗占卜</text>
        <text class="qc-desc">多种专题牌阵\nAI 智能深度解读</text>
      </view>
      <view class="quick-card" @tap="showModal = true">
        <text class="qc-badge">免费</text>
        <text class="qc-icon">🐉</text>
        <text class="qc-title">择吉黄历</text>
        <text class="qc-desc">婚期·开业·搬家\n自动筛选吉日</text>
      </view>
    </view>

  </view><!-- end page-wrap -->

  <!-- 黄历详情弹层 -->
  <view class="modal-overlay" v-if="showModal" @tap.self="showModal = false" catchtouchmove>
    <view class="modal-sheet" catchtouchmove>
      <view class="modal-handle"></view>
      <text class="modal-title">{{ modalTitle }}</text>
      <text class="modal-subtitle">{{ modalSubtitle }}</text>

      <!-- 干支 -->
      <view class="detail-section">
        <text class="detail-h4">今日干支</text>
        <view class="ganzhi-row">
          <view class="ganzhi-item" v-for="(item, idx) in ganzhiList" :key="idx">
            <text class="ganzhi-label">{{ item.label }}</text>
            <text class="ganzhi-val">{{ item.val }}</text>
          </view>
        </view>
      </view>

      <!-- 宜 -->
      <view class="detail-section">
        <text class="detail-h4">宜 · 适合今日进行</text>
        <view class="detail-grid">
          <text class="detail-tag detail-tag-yi" v-for="(t, i) in dayData.yi" :key="'my'+i">{{ t }}</text>
        </view>
      </view>

      <!-- 忌 -->
      <view class="detail-section">
        <text class="detail-h4">忌 · 今日不宜</text>
        <view class="detail-grid">
          <text class="detail-tag detail-tag-ji" v-for="(t, i) in dayData.ji" :key="'mj'+i">{{ t }}</text>
        </view>
      </view>

      <!-- 吉神凶煞 -->
      <view class="detail-section">
        <text class="detail-h4">吉神 / 凶煞</text>
        <view class="shens-row">
          <text class="shen-tag shen-good" v-for="(s, i) in dayData.shens" :key="'s'+i">✦ {{ s }}</text>
          <text class="shen-tag shen-bad" v-for="(s, i) in dayData.shas" :key="'a'+i">✧ {{ s }}</text>
        </view>
      </view>

      <button class="modal-close" @tap="showModal = false">收起</button>
    </view>
  </view>

  <!-- 日期选择器（简化版） -->
  <view class="picker-overlay" v-if="showDatePicker" @tap.self="showDatePicker = false" catchtouchmove>
    <view class="picker-sheet" catchtouchmove>
      <view class="picker-header">
        <text class="picker-cancel" @tap="showDatePicker = false">取消</text>
        <text class="picker-title">{{ pickerYear }}年{{ pickerMonth }}月</text>
        <text class="picker-ok" @tap="confirmDate">确定</text>
      </view>
      <view class="picker-month-nav">
        <text class="picker-arrow" @tap="pickerPrevMonth">‹</text>
        <text class="picker-year-month">{{ pickerYear }}年{{ pickerMonth }}月</text>
        <text class="picker-arrow" @tap="pickerNextMonth">›</text>
      </view>
      <!-- 星期标题行 -->
      <view class="picker-weekdays">
        <text class="pw-day" v-for="d in weekdays" :key="d">{{ d }}</text>
      </view>
      <!-- 日历格子 -->
      <view class="picker-grid">
        <view
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          :class="[
            'picker-cell',
            { 'cell-empty': !cell.day },
            { 'cell-today': cell.isToday },
            { 'cell-selected': cell.isSelected }
          ]"
          @tap="cell.day && selectDate(cell.day)"
        >{{ cell.day || '' }}</view>
      </view>
      <view class="picker-footer">
        <text class="picker-today-btn" @tap="pickToday">今天</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getLunarDate } from '@/utils/lunar.js'
import { getDayData } from '@/utils/fortune.js'
import { getNextJieqi } from '@/utils/jieqi.js'
import { getTodayTarot } from '@/utils/tarot.js'

export default {
  data() {
    return {
      currentDate: new Date(),
      showModal: false,
      showDatePicker: false,
      pickerDate: new Date(),
      weekMap: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
      weekdays: ['日','一','二','三','四','五','六']
    }
  },

  computed: {
    isToday() {
      const now = new Date()
      return this.currentDate.getFullYear() === now.getFullYear() &&
             this.currentDate.getMonth() === now.getMonth() &&
             this.currentDate.getDate() === now.getDate()
    },
    dateLabel() {
      const m = this.currentDate.getMonth() + 1
      const d = this.currentDate.getDate()
      if (this.isToday) return `今天 ${m}月${d}日`
      return `${m}月${d}日`
    },
    lunar() {
      try { return getLunarDate(this.currentDate) } catch(e) { return null }
    },
    dayData() {
      try { return getDayData(this.currentDate) } catch(e) { return { yi:[], ji:[], color:'--', num:'--', dir:'--', star:'--', moonPhase:'--', shens:[], shas:[] } }
    },
    jieqi() {
      try {
        const jq = getNextJieqi(this.currentDate)
        // 判断是否是节气当天
        const todayStr = this.hashDay(this.currentDate)
        const isJqToday = jq.days === 0 && this.isToday
        return { ...jq, isToday: isJqToday }
      } catch(e) { return null }
    },
    todayTarot() {
      try { return getTodayTarot(this.currentDate) } catch(e) { return {} }
    },
    modalTitle() {
      const d = this.currentDate
      return `${d.getMonth()+1}月${d.getDate()}日 黄历详解`
    },
    modalSubtitle() {
      if (!this.lunar) return ''
      return `${this.lunar.yearGZ}年 ${this.lunar.monthGZ}月 ${this.lunar.dayGZ}日 · ${this.dayData.moonPhase}`
    },
    ganzhiList() {
      if (!this.lunar) return []
      return [
        { label: '年柱', val: this.lunar.yearGZ },
        { label: '月柱', val: this.lunar.monthGZ },
        { label: '日柱', val: this.lunar.dayGZ },
        { label: '值日星', val: this.dayData.star }
      ]
    },
    // 日历选择器数据
    pickerYear() { return this.pickerDate.getFullYear() },
    pickerMonth() { return this.pickerDate.getMonth() + 1 },
    calendarCells() {
      const y = this.pickerYear
      const m = this.pickerMonth - 1
      const firstDay = new Date(y, m, 1).getDay()
      const daysInMonth = new Date(y, m + 1, 0).getDate()
      const cells = []
      const today = new Date()
      const selY = this.currentDate.getFullYear()
      const selM = this.currentDate.getMonth()
      const selD = this.currentDate.getDate()

      for (let i = 0; i < firstDay; i++) cells.push({ day: 0 })
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
          day: d,
          isToday: y === today.getFullYear() && m === today.getMonth() && d === today.getDate(),
          isSelected: y === selY && m === selM && d === selD
        })
      }
      return cells
    }
  },

  watch: {
    currentDate: {
      immediate: true,
      handler() {
        // 数据变化时自动更新视图（Vue 响应式）
      }
    }
  },

  methods: {
    hashDay(date) {
      return date.getFullYear() * 10000 + (date.getMonth()+1) * 100 + date.getDate()
    },

    goPrevDay() {
      const d = new Date(this.currentDate)
      d.setDate(d.getDate() - 1)
      this.currentDate = d
    },

    goNextDay() {
      const d = new Date(this.currentDate)
      d.setDate(d.getDate() + 1)
      this.currentDate = d
    },

    goToday() {
      this.currentDate = new Date()
    },

    goProfile() { uni.navigateTo({ url: '/pages/profile/profile' }) },
    goTarot() { uni.switchTab({ url: '/pages/tarot/tarot' }) },
    goPage(url) { uni.navigateTo({ url }) },

    // 日期选择器方法
    pickerPrevMonth() {
      const d = new Date(this.pickerDate)
      d.setMonth(d.getMonth() - 1)
      this.pickerDate = d
    },
    pickerNextMonth() {
      const d = new Date(this.pickerDate)
      d.setMonth(d.getMonth() + 1)
      this.pickerDate = d
    },
    selectDate(day) {
      this.pickerDate = new Date(this.pickerYear, this.pickerMonth - 1, day)
    },
    confirmDate() {
      this.currentDate = new Date(this.pickerDate)
      this.showDatePicker = false
    },
    pickToday() {
      this.pickerDate = new Date()
      this.currentDate = new Date()
    },

    // 分享
    onShareAppMessage() {
      return {
        title: `玄机阁 | ${this.dateLabel} 黄历`,
        path: '/pages/index/index'
      }
    }
  }
}
</script>

<style scoped>
/* ===== 首页样式 ===== */

.page-wrap {
  padding: 20rpx 32rpx 180rpx;
  min-height: 100vh;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 0 24rpx;
}
.logo-text {
  font-size: 44rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  background: linear-gradient(135deg, #d4af37, #f0d060);
  -webkit-background-clip: text;
  color: transparent;
}
.logo-sub {
  display: block;
  font-size: 22rpx;
  font-weight: 400;
  color: #a09ab8;
  letter-spacing: 2rpx;
}
.topbar-right { display: flex; gap: 32rpx; }
.topbar-icon { font-size: 40rpx; opacity: 0.7; }

/* 节气条 */
.jieqi-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 24rpx;
  background: rgba(212,175,55,0.08);
  border-radius: 40rpx;
  border: 1px solid rgba(212,175,55,0.15);
}
.jieqi-dot {
  width: 12rpx; height: 12rpx;
  border-radius: 50%;
  background: #d4af37;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100%{opacity:1}50%{opacity:0.3}
}
.jieqi-text { font-size: 24rpx; color: #e8e0f0; line-height: 1.5; }
.jieqi-name { color: #d4af37; font-weight: 600; }
.jieqi-days { color: #f0d060; font-weight: 600; }

/* Hero 卡片 */
.hero-card {
  background: linear-gradient(135deg, rgba(26,27,60,0.85), rgba(40,20,60,0.85));
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 40rpx;
  padding: 48rpx 36rpx 36rpx;
  position: relative;
  overflow: hidden;
}
.hero-card::before {
  content: "☽";
  position: absolute;
  right: 36rpx;
  top: 28rpx;
  font-size: 80rpx;
  opacity: 0.06;
}

/* 日期导航 */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}
.date-nav-btn {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  background: rgba(212,175,55,0.08);
  color: #d4af37;
  font-size: 40rpx;
  border: 1px solid rgba(212,175,55,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}
.btn-pressed {
  background: rgba(212,175,55,0.25) !important;
  transform: scale(0.92);
}
.date-nav-center { flex: 1; text-align: center; }
.date-nav-label {
  font-size: 30rpx;
  color: var(--gold);
  font-weight: 500;
}
.cal-icon { margin-left: 8rpx; font-size: 28rpx; opacity: 0.7; }
.date-nav-sub { display: block; font-size: 22rpx; color: #a09ab8; margin-top: 4rpx; }
.date-back-today {
  font-size: 22rpx;
  color: #d4af37;
  padding: 6rpx 16rpx;
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 20rpx;
  margin-right: 12rpx;
}

/* 日期显示 */
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.hero-date-cn { font-size: 28rpx; color: #f0d060; display: block; margin-bottom: 8rpx; }
.hero-date-big { font-size: 72rpx; font-weight: 700; color: #fff; display: block; line-height: 1; }
.hero-date-week { font-size: 26rpx; color: #a09ab8; display: block; margin-top: 4rpx; }
.hero-lunar { text-align: right; }
.hero-lunar-main { font-size: 32rpx; color: #f0d060; font-weight: 600; display: block; }
.hero-lunar-sub { font-size: 22rpx; color: #a09ab8; display: block; margin-top: 2rpx; }
.hero-divider { height: 1px; background: rgba(212,175,55,0.15); margin: 24rpx 0; }

/* 宜忌标签 */
.yi-ji-row { margin-bottom: 8rpx; }
.yi-label { color: #81c784; font-size: 26rpx; font-weight: 600; }
.ji-label { color: #e57373; font-size: 26rpx; font-weight: 600; }
.yi-ji-tags { display: flex; flex-wrap: wrap; }

/* 吉日数据 */
.lucky-row {
  display: flex;
  justify-content: space-around;
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1px solid rgba(212,175,55,0.1);
}
.lucky-item { text-align: center; }
.lucky-icon { font-size: 32rpx; display: block; margin-bottom: 4rpx; }
.lucky-key { font-size: 20rpx; color: #a09ab8; display: block; }
.lucky-val { font-size: 26rpx; color: #e8e0f0; font-weight: 500; display: block; margin-top: 2rpx; }
.hero-btn {
  display: block;
  text-align: center;
  padding: 18rpx 0;
  margin-top: 28rpx;
  background: rgba(212,175,55,0.08);
  border-radius: 24rpx;
  color: #d4af37;
  font-size: 26rpx;
  border: none;
}

/* 塔罗预览卡 */
.tarot-preview {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  background: rgba(26,27,60,0.65);
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}
.tarot-card-thumb { font-size: 64rpx; margin-right: 24rpx; }
.tarot-info { flex: 1; }
.tarot-label { font-size: 22rpx; color: #d4af37; display: block; }
.tarot-name { font-size: 30rpx; color: #e8e0f0; font-weight: 600; display: block; margin: 4rpx 0; }
.tarot-hint { font-size: 22rpx; color: #a09ab8; display: block; }
.tarot-arrow { font-size: 36rpx; color: #d4af37; opacity: 0.5; }

/* 快捷入口 */
.section-title {
  display: block;
  font-size: 28rpx;
  color: #e8e0f0;
  font-weight: 500;
  margin-bottom: 20rpx;
}
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.quick-card {
  background: rgba(26,27,60,0.65);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  position: relative;
}
.qc-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  font-size: 18rpx;
  color: #d4af37;
  padding: 2rpx 10rpx;
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 16rpx;
}
.qc-icon { font-size: 44rpx; display: block; margin-bottom: 8rpx; }
.qc-title { font-size: 28rpx; color: #e8e0f0; font-weight: 500; display: block; margin-bottom: 6rpx; }
.qc-desc { font-size: 20rpx; color: #a09ab8; line-height: 1.5; white-space: pre-line; }

/* 弹层 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-sheet {
  width: 100%;
  max-height: 80vh;
  background: #1a1b3c;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  box-sizing: border-box;
}
.modal-handle {
  width: 64rpx; height: 8rpx;
  border-radius: 4rpx;
  background: rgba(255,255,255,0.15);
  margin: 0 auto 24rpx;
}
.modal-title {
  font-size: 34rpx;
  color: #e8e0f0;
  font-weight: 600;
  display: block;
  text-align: center;
}
.modal-subtitle {
  font-size: 24rpx;
  color: #a09ab8;
  display: block;
  text-align: center;
  margin-top: 8rpx;
  margin-bottom: 24rpx;
}
.detail-section { margin-bottom: 28rpx; }
.detail-h4 { font-size: 26rpx; color: #d4af37; font-weight: 500; display: block; margin-bottom: 16rpx; }

/* 干支行 */
.ganzhi-row { display: flex; justify-content: space-around; }
.ganzhi-item { text-align: center; }
.ganzhi-label { font-size: 22rpx; color: #a09ab8; display: block; margin-bottom: 4rpx; }
.ganzhi-val { font-size: 28rpx; color: #e8e0f0; font-weight: 500; }

/* 详情网格 */
.detail-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.detail-tag {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
}
.detail-tag-yi { background: rgba(76,175,80,0.12); color: #81c784; border: 1px solid rgba(76,175,80,0.25); }
.detail-tag-ji { background: rgba(244,67,54,0.12); color: #e57373; border: 1px solid rgba(244,67,54,0.25); }

/* 吉神凶煞 */
.shens-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.shen-tag { font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 20rpx; }
.shen-good { background: rgba(76,175,80,0.08); color: #81c784; }
.shen-bad { background: rgba(244,67,54,0.08); color: #e57373; }

.modal-close {
  display: block;
  width: 100%;
  padding: 24rpx 0;
  background: rgba(212,175,55,0.1);
  border-radius: 24rpx;
  color: #d4af37;
  font-size: 28rpx;
  text-align: center;
  border: none;
  margin-top: 16rpx;
}

/* 日期选择器 */
.picker-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.75);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker-sheet {
  width: 90%;
  max-width: 580rpx;
  background: #1a1b3c;
  border-radius: 32rpx;
  padding: 32rpx;
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.picker-cancel, .picker-ok { font-size: 28rpx; color: #d4af37; }
.picker-title { font-size: 30rpx; color: #e8e0f0; font-weight: 500; }
.picker-month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
}
.picker-arrow { font-size: 36rpx; color: #d4af37; padding: 0 24rpx; }
.picker-year-month { font-size: 30rpx; color: #e8e0f0; font-weight: 500; }

/* 星期标题行 */
.picker-weekdays {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 12rpx;
}
.pw-day {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #a09ab8;
  font-weight: 500;
}

/* 日历格子 */
.picker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4rpx;
  padding: 16rpx 0;
}
.picker-cell {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #e8e0f0;
  border-radius: 16rpx;
  margin: 0 auto;
}
.cell-empty { opacity: 0; }
.cell-today { border: 2px solid #d4af37; }
.cell-selected { background: rgba(212,175,55,0.2); color: #f0d060; font-weight: 600; }
.picker-footer { text-align: center; margin-top: 16rpx; }
.picker-today-btn {
  font-size: 26rpx;
  color: #d4af37;
  padding: 12rpx 32rpx;
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 24rpx;
}
</style>
