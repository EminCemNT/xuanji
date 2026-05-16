<template>
  <view class="page-wrap">
    <view class="stars">
      <view v-for="s in starList" :key="s.id" class="star"
        :style="{ left: s.x+'%', top: s.y+'%', animationDelay: s.delay+'s', animationDuration: s.dur+'s' }" />
    </view>

    <!-- 顶部 -->
    <view class="header">
      <view class="header-title">我的</view>
      <view class="header-sub">记录你的每一次探索</view>
    </view>

    <view class="page-content">
      <!-- 用户卡片 -->
      <view class="user-card">
        <view class="user-avatar">{{ user.avatar || '🌙' }}</view>
        <view class="user-name">{{ user.name }}</view>
        <view class="user-level">Lv.{{ user.level }} {{ levelName(user.level) }}</view>
        <view class="user-stats">
          <view class="stat-item">
            <view class="stat-num">{{ readingsCount }}</view>
            <view class="stat-label">占卜次数</view>
          </view>
          <view class="stat-item">
            <view class="stat-num">{{ usedDays }}</view>
            <view class="stat-label">使用天数</view>
          </view>
        </view>
      </view>

      <!-- 赞赏横幅 -->
      <view class="support-banner" @tap="showSupportModal = true">
        <view class="support-badge-row">
          <text class="support-badge">☕ 请作者喝杯茶</text>
          <text class="support-tag">自愿赞赏</text>
        </view>
        <view class="support-desc">玄机阁完全免费 · 如果喜欢，欢迎打赏支持持续开发 ❤️</view>
        <view class="support-features">
          <text class="vf-item">所有功能永久免费</text>
          <text class="vf-item">无广告无追踪</text>
          <text class="vf-item">持续更新优化</text>
        </view>
        <view class="support-btn" @tap.stop="showSupportModal = true">赞赏支持</view>
      </view>

      <!-- 每日任务 -->
      <view class="section-title">✦ 今日任务</view>
      <view class="task-list">
        <view v-for="t in tasks" :key="t.id" class="task-item" :class="{ done: t.done }">
          <text class="task-icon">{{ t.icon }}</text>
          <view class="task-info">
            <view class="task-name">{{ t.name }}</view>
          </view>
          <view class="task-btn" :class="{ done: t.done }" @tap="claimTask(t.id)">
            {{ t.done ? '已完成' : '完成' }}
          </view>
        </view>
      </view>

      <!-- 使用统计 -->
      <view class="section-title" style="margin-top: 32rpx;">📊 我的探索</view>
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-icon-big">🔮</text>
          <view class="stat-num-big">{{ readingsCount }}</view>
          <view class="stat-label-small">占卜次数</view>
        </view>
        <view class="stat-card">
          <text class="stat-icon-big">📅</text>
          <view class="stat-num-big">{{ usedDays }}</view>
          <view class="stat-label-small">使用天数</view>
        </view>
      </view>

      <!-- 历史记录 -->
      <view class="section-title">📜 占卜记录</view>
      <view v-if="history.length === 0" class="empty-state">
        <text class="es-icon">🌟</text>
        <view class="es-text">还没有占卜记录{{ '\n' }}快去试试吧！</view>
      </view>
      <view v-else>
        <view v-for="(h, i) in [...history].reverse()" :key="i" class="hist-item">
          <text class="hist-icon">{{ h.icon }}</text>
          <view class="hist-info">
            <view class="hist-type">{{ h.type }}</view>
            <view class="hist-detail">{{ h.detail }}</view>
            <view class="hist-time">{{ h.time }}</view>
          </view>
          <text class="hist-arrow">›</text>
        </view>
      </view>

      <!-- 菜单 -->
      <view class="menu-list">
        <view class="menu-group">
          <view class="menu-item" @tap="showSupportModal = true">
            <text class="menu-icon">☕</text>
            <view class="menu-label">赞赏支持</view>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @tap="toast('成就系统开发中')">
            <text class="menu-icon">🏆</text>
            <view class="menu-label">我的成就</view>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @tap="toast('设置页面开发中')">
            <text class="menu-icon">⚙️</text>
            <view class="menu-label">设置</view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        <view class="menu-group" style="margin-top: 16rpx;">
          <view class="menu-item" @tap="toast('客服功能开发中')">
            <text class="menu-icon">💬</text>
            <view class="menu-label">联系客服</view>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @tap="toast('玄机阁 v1.0.0\n用心做好每一份指引')">
            <text class="menu-icon">ℹ️</text>
            <view class="menu-label">关于</view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 赞赏弹窗 -->
    <view v-if="showSupportModal" class="modal-overlay" @tap.self="showSupportModal = false">
      <view class="modal-content">
        <view class="modal-close" @tap="showSupportModal = false">✕</view>
        <view class="modal-title">☕ 请作者喝杯茶</view>
        <view class="modal-desc">玄机阁所有功能永久免费，无广告无追踪 ❤️{{ '\n' }}如果喜欢，欢迎打赏支持持续开发</view>

        <!-- 赞赏金额选项 -->
        <view class="support-amounts">
          <view v-for="amt in amounts" :key="amt.val"
            class="support-amt" :class="{ active: selectedAmt === amt.val }"
            @tap="selectedAmt = amt.val">
            {{ amt.label }}
          </view>
        </view>

        <!-- 二维码提示区域 -->
        <view class="qrcode-container">
          <view class="qrcode-placeholder">
            <text class="qr-icon">📱</text>
            <view class="qr-tip">微信赞赏码</view>
            <view class="qr-tip2">（开发中，敬请期待）</view>
          </view>
          <view class="qrcode-tip">长按保存图片 · 打开微信扫一扫</view>
        </view>

        <view class="thanks-text">每一份支持都是动力 · 感谢你 ✨</view>
        <view class="confirm-btn" @tap="showSupportModal = false">谢谢支持 ❤️</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import storage from '@/utils/storage'
const getStorage = (k) => storage.get(k)
const setStorage = (k, v) => storage.set(k, v)

const starList = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: (Math.random() * 3).toFixed(1),
  dur: (2 + Math.random() * 3).toFixed(1)
}))

const amounts = [
  { val: 3, label: '☕ 3元' },
  { val: 6, label: '🍵 6元' },
  { val: 18, label: '🍰 18元' },
  { val: 66, label: '🎁 66元' }
]

// 状态
const showSupportModal = ref(false)
const selectedAmt = ref(6)
const user = ref({ name: '玄机旅人', level: 1, avatar: '🌙' })
const tasks = ref([
  { id: 'checkin',   icon: '📅', name: '每日签到',    done: false },
  { id: 'tarot1',    icon: '🃏', name: '完成一次占卜', done: false },
  { id: 'horoscope', icon: '⭐', name: '查看今日运势', done: false },
  { id: 'mbti',      icon: '🧬', name: '完成MBTI测试', done: false },
  { id: 'share',     icon: '📤', name: '分享一次结果', done: false }
])
const history = ref([])

const readingsCount = computed(() => history.value.length)
const usedDays = computed(() => {
  const ci = getStorage('checkin')
  return ci ? ci.days || 1 : 1
})

const levelNames = ['', '探索者', '寻道者', '洞察者', '预言师', '大法师']
function levelName(lv) { return levelNames[lv] || '传奇' }

function calcLevel(n) {
  if (n >= 50) return 5
  if (n >= 25) return 4
  if (n >= 10) return 3
  if (n >= 3) return 2
  return 1
}

onMounted(() => {
  // 加载用户数据
  const storedUser = getStorage('user')
  if (storedUser) user.value = storedUser
  else setStorage('user', user.value)

  // 加载任务（每日重置）
  const today = new Date().toDateString()
  const storedTasks = getStorage('tasks_date')
  if (storedTasks === today) {
    const savedTasks = getStorage('tasks')
    if (savedTasks) tasks.value = savedTasks
  } else {
    setStorage('tasks_date', today)
    // 重置任务
    tasks.value = tasks.value.map(t => ({ ...t, done: false }))
    setStorage('tasks', tasks.value)
  }

  // 加载历史
  const h = getStorage('history')
  if (h) history.value = h

  // 更新等级
  const newLevel = calcLevel(history.value.length)
  if (newLevel !== user.value.level) {
    user.value.level = newLevel
    setStorage('user', user.value)
  }
})

function claimTask(id) {
  const t = tasks.value.find(t => t.id === id)
  if (!t || t.done) return
  t.done = true
  setStorage('tasks', tasks.value)
  uni.showToast({ title: `完成：${t.name} ✨`, icon: 'none' })
}

function toast(msg) {
  uni.showToast({ title: msg, icon: 'none' })
}
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: var(--bg-deep, #0d0e1f);
  color: #e8e0f0;
}
.stars { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
.star { position: absolute; width: 3rpx; height: 3rpx; background: #fff; border-radius: 50%; animation: twinkle 3s infinite alternate; }
@keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }

/* 顶部 */
.header { position: relative; z-index: 1; text-align: center; padding: 48rpx 20rpx 16rpx; }
.header-title { font-size: 40rpx; font-weight: 700; color: #d4af37; }
.header-sub { font-size: 24rpx; color: #a09ab8; margin-top: 8rpx; }

/* 内容 */
.page-content { position: relative; z-index: 1; padding: 24rpx 32rpx 120rpx; }

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, rgba(123,94,167,0.3), rgba(212,175,55,0.15));
  border: 1rpx solid rgba(212,175,55,0.25); border-radius: 32rpx;
  padding: 40rpx 32rpx; text-align: center; margin-bottom: 24rpx;
}
.user-avatar { font-size: 64rpx; display: block; text-align: center; margin-bottom: 16rpx; }
.user-name { font-size: 36rpx; font-weight: 600; margin-bottom: 8rpx; color: #e8e0f0; }
.user-level {
  display: inline-block;
  background: linear-gradient(135deg, #d4af37, #f0d060);
  color: #0d0e1f; font-size: 22rpx; font-weight: 700;
  padding: 4rpx 20rpx; border-radius: 20rpx; margin-bottom: 16rpx;
}
.user-stats { display: flex; justify-content: center; gap: 48rpx; margin-top: 24rpx; }
.stat-item { text-align: center; }
.stat-num { font-size: 40rpx; font-weight: 700; color: #d4af37; }
.stat-label { font-size: 22rpx; color: #a09ab8; margin-top: 4rpx; }

/* 赞赏横幅 */
.support-banner {
  background: linear-gradient(135deg, rgba(80,180,100,0.15) 0%, rgba(212,175,55,0.08) 40%, rgba(26,27,60,0.8) 100%);
  border: 1rpx solid rgba(80,180,100,0.3); border-radius: 28rpx;
  padding: 32rpx; margin-bottom: 32rpx;
}
.support-badge-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.support-badge {
  font-size: 32rpx; font-weight: 800; color: #6ddc8b;
}
.support-tag {
  background: rgba(80,180,100,0.2); color: #6ddc8b;
  font-size: 22rpx; font-weight: 700; padding: 6rpx 20rpx; border-radius: 20rpx;
}
.support-desc { font-size: 26rpx; color: #a09ab8; line-height: 1.6; margin-bottom: 20rpx; }
.support-features { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 8rpx; }
.vf-item {
  font-size: 22rpx; color: #6ddc8b;
  background: rgba(80,180,100,0.12); border: 1rpx solid rgba(80,180,100,0.2);
  padding: 6rpx 20rpx; border-radius: 20rpx;
}
.support-btn {
  width: 100%; background: linear-gradient(135deg, #50b464, #6ddc8b);
  color: #fff; font-size: 28rpx; font-weight: 700;
  padding: 24rpx; border-radius: 40rpx; text-align: center; margin-top: 20rpx;
}

/* 任务 */
.section-title { font-size: 28rpx; font-weight: 600; color: #e8e0f0; margin-bottom: 20rpx; }
.task-list { margin-bottom: 0; }
.task-item {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 16rpx;
  display: flex; align-items: center;
}
.task-item.done { opacity: 0.55; }
.task-icon { font-size: 44rpx; margin-right: 20rpx; }
.task-info { flex: 1; }
.task-name { font-size: 28rpx; color: #e8e0f0; }
.task-btn {
  background: linear-gradient(135deg, #7b5ea7, #9b7ec8);
  color: #fff; font-size: 24rpx; padding: 12rpx 28rpx; border-radius: 24rpx;
}
.task-btn.done { background: #4ecdc4; color: #0d0e1f; }

/* 统计网格 */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin-bottom: 32rpx; }
.stat-card {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 24rpx; padding: 28rpx; text-align: center;
}
.stat-icon-big { font-size: 56rpx; display: block; margin-bottom: 12rpx; }
.stat-num-big { font-size: 48rpx; font-weight: 700; color: #d4af37; }
.stat-label-small { font-size: 22rpx; color: #a09ab8; margin-top: 8rpx; }

/* 历史 */
.empty-state { text-align: center; padding: 60rpx 0; }
.es-icon { font-size: 80rpx; display: block; opacity: 0.4; margin-bottom: 20rpx; }
.es-text { font-size: 26rpx; color: #a09ab8; white-space: pre-line; line-height: 1.8; }
.hist-item {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 20rpx; padding: 24rpx 28rpx; margin-bottom: 12rpx;
  display: flex; align-items: center; gap: 20rpx;
}
.hist-icon { font-size: 44rpx; }
.hist-info { flex: 1; }
.hist-type { font-size: 28rpx; color: #e8e0f0; }
.hist-detail { font-size: 24rpx; color: #a09ab8; margin-top: 4rpx; }
.hist-time { font-size: 22rpx; color: rgba(160,154,184,0.5); margin-top: 4rpx; }
.hist-arrow { font-size: 28rpx; color: #a09ab8; }

/* 菜单 */
.menu-list { margin-top: 32rpx; margin-bottom: 0; }
.menu-group {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 20rpx; overflow: hidden;
}
.menu-item {
  display: flex; align-items: center; padding: 28rpx 28rpx;
  border-bottom: 1rpx solid rgba(255,255,255,0.04);
}
.menu-item:last-child { border-bottom: none; }
.menu-item:active { background: rgba(255,255,255,0.04); }
.menu-icon { font-size: 36rpx; margin-right: 20rpx; }
.menu-label { flex: 1; font-size: 28rpx; color: #e8e0f0; }
.menu-arrow { font-size: 28rpx; color: #a09ab8; }

/* 弹窗 */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: #1a1b3c; border: 1rpx solid rgba(212,175,55,0.25);
  border-radius: 32rpx; width: 88%; padding: 48rpx 40rpx; position: relative;
}
.modal-close {
  position: absolute; top: 24rpx; right: 28rpx;
  color: #a09ab8; font-size: 40rpx;
}
.modal-title { font-size: 34rpx; color: #d4af37; text-align: center; margin-bottom: 24rpx; font-weight: 700; }
.modal-desc { font-size: 26rpx; color: #a09ab8; text-align: center; line-height: 1.8; margin-bottom: 32rpx; white-space: pre-line; }
.support-amounts { display: flex; flex-wrap: wrap; gap: 16rpx; justify-content: center; margin-bottom: 32rpx; }
.support-amt {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 20rpx; padding: 16rpx 28rpx;
  font-size: 26rpx; color: #e8e0f0; min-width: 140rpx; text-align: center;
}
.support-amt.active { border-color: #50b464; background: rgba(80,180,100,0.15); color: #6ddc8b; font-weight: 700; }

.qrcode-container { text-align: center; margin-bottom: 20rpx; }
.qrcode-placeholder {
  width: 320rpx; height: 320rpx; background: rgba(255,255,255,0.05);
  border-radius: 24rpx; margin: 0 auto 16rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 2rpx dashed rgba(212,175,55,0.3);
}
.qr-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.qr-tip { font-size: 26rpx; color: #d4af37; }
.qr-tip2 { font-size: 22rpx; color: #a09ab8; margin-top: 8rpx; }
.qrcode-tip { font-size: 22rpx; color: #a09ab8; }
.thanks-text { text-align: center; font-size: 22rpx; color: rgba(160,154,184,0.6); margin-bottom: 24rpx; }
.confirm-btn {
  width: 100%; background: linear-gradient(135deg, #50b464, #6ddc8b);
  color: #fff; font-size: 28rpx; font-weight: 700;
  padding: 28rpx; border-radius: 40rpx; text-align: center;
}
.confirm-btn:active { opacity: 0.85; }
</style>
