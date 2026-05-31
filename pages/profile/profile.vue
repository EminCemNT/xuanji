<template>
  <view class="page-wrap">
    <!-- 用户卡片 -->
    <view class="user-card">
      <view class="user-avatar">🌙</view>
      <view class="user-name">{{ userName }}</view>
      <view class="user-level">Lv.{{ level }} {{ levelTitle }}</view>
      <view class="user-stats">
        <view class="stat-item">
          <view class="stat-num">{{ statReadings }}</view>
          <view class="stat-label">占卜次数</view>
        </view>
        <view class="stat-item">
          <view class="stat-num">{{ statDays }}</view>
          <view class="stat-label">使用天数</view>
        </view>
      </view>
    </view>

    <!-- 赞赏支持 -->
    <view class="support-banner" @tap="showSupport">
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
      <view class="support-btn" @tap.stop="showSupport">赞赏支持</view>
    </view>

    <!-- 每日任务 -->
    <view class="section-title">✦ 今日任务</view>
    <view class="daily-tasks">
      <view class="task-list">
        <view v-for="(task, idx) in tasks" :key="idx" class="task-item" :class="{ done: task.done }">
          <view class="task-icon">{{ task.done ? '✅' : task.icon }}</view>
          <view class="task-info">
            <view class="task-name">{{ task.name }}</view>
            <view class="task-reward">+{{ task.reward }}经验</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 使用统计 -->
    <view class="section-title">📊 我的探索</view>
    <view class="stats-grid">
      <view class="stat-card">
        <view class="stat-icon-big">🔮</view>
        <view class="stat-num-big">{{ statReadings }}</view>
        <view class="stat-label-small">占卜次数</view>
      </view>
      <view class="stat-card">
        <view class="stat-icon-big">📅</view>
        <view class="stat-num-big">{{ statDays }}</view>
        <view class="stat-label-small">使用天数</view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="section-title">📜 占卜记录</view>
    <view class="history-section">
      <view v-if="history.length === 0" class="empty-state">
        <view class="es-icon">🌟</view>
        <view class="es-text">还没有占卜记录\n快去试试吧！</view>
      </view>
      <view v-for="(item, idx) in history" :key="idx" class="history-item">
        <view class="hi-type">{{ item.type }}</view>
        <view class="hi-date">{{ item.date }}</view>
        <view class="hi-desc">{{ item.desc }}</view>
      </view>
    </view>

    <!-- 菜单 -->
    <view class="menu-list">
      <view class="menu-group">
        <view class="menu-item" @tap="showSupport">
          <text class="menu-icon">☕</text>
          <text class="menu-label">赞赏支持</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="showToast('成就系统开发中')">
          <text class="menu-icon">🏆</text>
          <text class="menu-label">我的成就</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="showSettings">
          <text class="menu-icon">⚙️</text>
          <text class="menu-label">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
      <view class="menu-group">
        <view class="menu-item" @tap="showToast('客服功能开发中')">
          <text class="menu-icon">💬</text>
          <text class="menu-label">联系客服</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="showAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-label">关于</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 赞赏弹窗 -->
    <view class="modal-overlay" :class="{ show: supportVisible }" @tap="closeSupport">
      <view class="modal-content" @tap.stop>
        <view class="modal-close-btn" @tap="closeSupport">✕</view>
        <view class="support-modal-title">☕ 请作者喝杯茶</view>
        <view class="support-modal-desc">感谢您的支持！每一份赞赏都是持续开发的动力</view>
        
        <!-- 微信赞赏码 -->
        <view class="qrcode-wrap">
          <image 
            class="qrcode-img" 
            src="/static/images/support-qrcode.jpg" 
            mode="widthFix"
            show-menu-by-longpress
          />
          <view class="qrcode-hint">长按识别赞赏码</view>
        </view>

        <view class="support-note">
          <view class="note-item">✨ 所有功能仍然完全免费</view>
          <view class="note-item">🔒 无广告 · 无追踪 · 无强制付费</view>
          <view class="note-item">❤️ 您的支持让玄机阁走得更远</view>
        </view>
      </view>
    </view>

    <!-- 设置弹窗 -->
    <view class="modal-overlay" :class="{ show: settingsVisible }" @tap="closeSettings">
      <view class="modal-content" @tap.stop>
        <view class="modal-close-btn" @tap="closeSettings">✕</view>
        <view class="support-modal-title">⚙️ 设置</view>
        <view class="settings-list">
          <view class="settings-item" @tap="clearHistory">
            <text class="settings-label">清除占卜记录</text>
            <text class="settings-arrow">›</text>
          </view>
          <view class="settings-item" @tap="showToast('数据已是最新')">
            <text class="settings-label">检查更新</text>
            <text class="settings-arrow">›</text>
          </view>
        </view>
        <view class="version-text">玄机阁 v1.0.0</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userName: '玄机旅人',
      level: 1,
      levelTitle: '探索者',
      statReadings: 0,
      statDays: 1,
      tasks: [
        { icon: '🔮', name: '完成一次塔罗占卜', reward: 30, done: false },
        { icon: '⭐', name: '查看今日星座运势', reward: 20, done: false },
        { icon: '🧬', name: '完成MBTI人格测试', reward: 50, done: false },
        { icon: '📅', name: '查看今日黄历', reward: 10, done: true }
      ],
      history: [],
      supportVisible: false,
      settingsVisible: false
    }
  },
  onShow() {
    this.loadData()
  },
  onShareAppMessage() {
    return {
      title: '玄机阁 · 每天5分钟，读懂今天的自己',
      path: '/pages/index/index'
    }
  },
  methods: {
    loadData() {
      try {
        const db = uni.getStorageSync('xuanji_db')
        if (db) {
          const data = JSON.parse(db)
          this.level = data.level || 1
          this.statReadings = data.statReadings || 0
          this.statDays = data.statDays || 1
          this.tasks = data.tasks || this.tasks
          this.history = data.history || []
          this.userName = data.userName || '玄机旅人'
          this.updateLevelTitle()
        }
      } catch (e) {
        console.error('Load data failed:', e)
      }
    },
    saveData() {
      try {
        const data = {
          level: this.level,
          statReadings: this.statReadings,
          statDays: this.statDays,
          tasks: this.tasks,
          history: this.history,
          userName: this.userName
        }
        uni.setStorageSync('xuanji_db', JSON.stringify(data))
      } catch (e) {
        console.error('Save data failed:', e)
      }
    },
    updateLevelTitle() {
      const titles = ['探索者', '学徒', '占卜师', '预言家', '贤者', '先知']
      this.levelTitle = titles[Math.min(this.level - 1, titles.length - 1)] || '探索者'
    },
    showSupport() {
      this.supportVisible = true
    },
    closeSupport() {
      this.supportVisible = false
    },
    showSettings() {
      this.settingsVisible = true
    },
    closeSettings() {
      this.settingsVisible = false
    },
    showToast(msg) {
      uni.showToast({ title: msg, icon: 'none', duration: 2000 })
    },
    showAbout() {
      uni.showModal({
        title: '关于玄机阁',
        content: '版本 v1.0.0\n\n融合东方玄学与现代心理学\n黄历宜忌 · 星座运势 · 塔罗占卜 · MBTI测试\n\n完全免费 · 无广告 · 无追踪\n用心做好每一份指引',
        showCancel: false,
        confirmText: '我知道了'
      })
    },
    clearHistory() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除所有占卜记录吗？此操作不可恢复。',
        success: (res) => {
          if (res.confirm) {
            this.history = []
            this.statReadings = 0
            this.saveData()
            uni.showToast({ title: '已清除', icon: 'success' })
          }
        }
      })
    },
    addReading(type, desc) {
      this.statReadings++
      const now = new Date()
      const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
      this.history.unshift({
        type,
        date: dateStr,
        desc
      })
      // 保留最近20条
      if (this.history.length > 20) this.history = this.history.slice(0, 20)
      this.saveData()
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
  background: #0d0e1f;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, rgba(26, 27, 60, 0.85), rgba(40, 20, 60, 0.85));
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px;
  padding: 24px 20px;
  text-align: center;
  margin-bottom: 16px;
}
.user-avatar {
  font-size: 48px;
  margin-bottom: 8px;
}
.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 4px;
}
.user-level {
  font-size: 12px;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 20px;
  padding: 3px 14px;
  display: inline-block;
  margin-bottom: 16px;
}
.user-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}
.stat-item { text-align: center; }
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #d4af37;
}
.stat-label {
  font-size: 11px;
  color: #a09ab8;
  margin-top: 2px;
}

/* 赞赏 */
.support-banner {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.03));
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}
.support-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.support-badge {
  font-size: 15px;
  color: #d4af37;
  font-weight: 600;
}
.support-tag {
  font-size: 10px;
  color: #a09ab8;
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 10px;
  padding: 2px 8px;
}
.support-desc {
  font-size: 12px;
  color: #a09ab8;
  line-height: 1.6;
  margin-bottom: 10px;
}
.support-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.vf-item {
  font-size: 11px;
  color: #6ddc8b;
  background: rgba(80, 180, 100, 0.1);
  border: 1px solid rgba(80, 180, 100, 0.2);
  border-radius: 10px;
  padding: 3px 8px;
}
.support-btn {
  width: 100%;
  padding: 11px;
  text-align: center;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 10px;
  color: #d4af37;
  font-size: 14px;
  font-weight: 600;
}

/* 任务 */
.section-title {
  font-size: 13px;
  color: #a09ab8;
  letter-spacing: 1px;
  margin-bottom: 12px;
}
.task-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(26, 27, 60, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
}
.task-item.done {
  opacity: 0.6;
}
.task-icon { font-size: 20px; width: 32px; text-align: center; }
.task-info { flex: 1; }
.task-name { font-size: 14px; color: #e8e0f0; }
.task-reward { font-size: 11px; color: #d4af37; margin-top: 2px; }

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
}
.stat-icon-big { font-size: 28px; margin-bottom: 6px; }
.stat-num-big {
  font-size: 26px;
  font-weight: 700;
  color: #d4af37;
  margin-bottom: 4px;
}
.stat-label-small { font-size: 11px; color: #a09ab8; }

/* 历史记录 */
.history-section { margin-bottom: 16px; }
.empty-state {
  text-align: center;
  padding: 24px;
  background: rgba(26, 27, 60, 0.3);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 12px;
}
.es-icon { font-size: 28px; margin-bottom: 8px; }
.es-text {
  font-size: 13px;
  color: #a09ab8;
  line-height: 1.6;
  white-space: pre-line;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(26, 27, 60, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.1);
  border-radius: 10px;
  margin-bottom: 6px;
}
.hi-type {
  font-size: 18px;
  width: 36px;
  text-align: center;
}
.hi-date {
  font-size: 11px;
  color: #a09ab8;
  white-space: nowrap;
}
.hi-desc {
  font-size: 13px;
  color: #e8e0f0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 菜单 */
.menu-list { margin-top: 8px; }
.menu-group {
  background: rgba(26, 27, 60, 0.5);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 18px; width: 28px; text-align: center; }
.menu-label { flex: 1; font-size: 14px; color: #e8e0f0; }
.menu-arrow { font-size: 16px; color: #a09ab8; }

/* 弹窗 */
.modal-overlay {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 200;
  align-items: center;
  justify-content: center;
}
.modal-overlay.show { display: flex; }
.modal-content {
  width: 85%;
  max-width: 360px;
  background: #131428;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px;
  padding: 24px 20px;
  position: relative;
}
.modal-close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 20px;
  color: #a09ab8;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.support-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 8px;
  text-align: center;
}
.support-modal-desc {
  font-size: 13px;
  color: #a09ab8;
  text-align: center;
  margin-bottom: 20px;
}

.qrcode-wrap {
  text-align: center;
  margin-bottom: 16px;
}
.qrcode-img {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 2px solid rgba(212, 175, 55, 0.2);
}
.qrcode-hint {
  font-size: 11px;
  color: #a09ab8;
  margin-top: 8px;
}

.support-note {
  background: rgba(212, 175, 55, 0.05);
  border-radius: 12px;
  padding: 12px;
}
.note-item {
  font-size: 12px;
  color: #a09ab8;
  padding: 4px 0;
}

/* 设置 */
.settings-list { margin-bottom: 16px; }
.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.08);
}
.settings-label { font-size: 14px; color: #e8e0f0; }
.settings-arrow { font-size: 16px; color: #a09ab8; }
.version-text {
  text-align: center;
  font-size: 11px;
  color: #6a6580;
}
</style>
