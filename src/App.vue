<script>
export default {
  globalData: {
    userName: '玄机旅人',
    level: 1,
    statReadings: 0,
    statDays: 1,
    tasks: [],
    history: []
  },
  onLaunch() {
    // 初始化全局数据
    this.loadFromStorage()
  },
  onShow() {
    // 前台显示时刷新数据
  },
  onHide() {
    // 后台时保存
    this.saveToStorage()
  },
  methods: {
    loadFromStorage() {
      try {
        const db = uni.getStorageSync('xuanji_db')
        if (db) {
          const data = JSON.parse(db)
          this.globalData.level = data.level || 1
          this.globalData.statReadings = data.statReadings || 0
          this.globalData.statDays = data.statDays || 1
          this.globalData.tasks = data.tasks || []
          this.globalData.history = data.history || []
          this.globalData.userName = data.userName || '玄机旅人'
        }
      } catch (e) {
        console.error('Load storage failed:', e)
      }
    },
    saveToStorage() {
      try {
        const data = {
          level: this.globalData.level,
          statReadings: this.globalData.statReadings,
          statDays: this.globalData.statDays,
          tasks: this.globalData.tasks,
          history: this.globalData.history,
          userName: this.globalData.userName
        }
        uni.setStorageSync('xuanji_db', JSON.stringify(data))
      } catch (e) {
        console.error('Save storage failed:', e)
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #0f0f1a;
  color: #e0d5c1;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  min-height: 100vh;
}

/* 星空动画关键帧 */
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(201, 169, 110, 0.2); }
  50% { box-shadow: 0 0 40px rgba(201, 169, 110, 0.5); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

/* 通用工具类 */
.container {
  padding: 0 20rpx;
  padding-bottom: 40rpx;
}

.gold-text {
  color: #c9a96e;
}

.gold-gradient {
  background: linear-gradient(135deg, #c9a96e, #e8d5a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
