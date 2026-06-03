<template>
  <view class="page-wrap">
    <!-- 开始页 -->
    <view v-if="page === 'start'" class="start-page">
      <view class="start-emoji">🧬</view>
      <view class="start-title">MBTI 人格测试</view>
      <view class="start-subtitle">28道题 · 4个维度 · 16种人格类型</view>
      <view class="start-desc">
        了解你的能量来源、认知方式、决策依据和生活态度。
        <br>发现真实的自己。
      </view>
      <view class="start-btn" @tap="startQuiz">开始测试</view>

      <view class="dimension-preview">
        <view class="dim-label">测试四个维度</view>
        <view class="dim-grid">
          <view class="dim-item">
            <text class="dim-emoji">🌍</text>
            <text>外向 E / I 内向</text>
          </view>
          <view class="dim-item">
            <text class="dim-emoji">🔍</text>
            <text>感觉 S / N 直觉</text>
          </view>
          <view class="dim-item">
            <text class="dim-emoji">🧠</text>
            <text>思考 T / F 情感</text>
          </view>
          <view class="dim-item">
            <text class="dim-emoji">📋</text>
            <text>判断 J / P 感知</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 答题页 -->
    <view v-if="page === 'quiz'" class="quiz-page">
      <view class="quiz-header">
        <view class="back-link" @tap="goBackToStart">← 返回</view>
        <view class="exit-link" @tap="exitQuiz">退出</view>
        <view class="progress-wrap">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <text class="progress-text">{{ currentQ + 1 }} / {{ questions.length }}</text>
        </view>
      </view>

      <view class="dimension-hint">{{ dimHint }}</view>
      <view class="question-text">{{ currentQuestion.text }}</view>

      <view class="options-list">
        <view 
          v-for="(opt, idx) in currentQuestion.options" 
          :key="idx"
          class="option-btn"
          :style="{ animationDelay: idx * 0.1 + 's' }"
          @tap="selectOption(idx, opt.value)"
        >
          <text class="option-prefix">{{ optionLetters[idx] }}</text>
          {{ opt.text }}
        </view>
      </view>
    </view>

    <!-- 结果页 -->
    <view v-if="page === 'result'" class="result-page">
      <view class="result-type">{{ resultType }}</view>
      <view class="result-emoji">{{ resultData.emoji }}</view>
      <view class="result-name">{{ resultData.name }}</view>
      <view class="result-brief">{{ resultData.brief }}</view>

      <!-- 维度分析 -->
      <view class="result-section">
        <view class="section-title">维度分析</view>
        <view v-for="d in dimensions" :key="d.dim" class="dimension-card">
          <view class="dimension-row">
            <text class="dimension-label">{{ d.info.left }}</text>
            <text class="dimension-pct">{{ d.leftPct }}%</text>
            <text class="dimension-divider"></text>
            <text class="dimension-pct">{{ d.rightPct }}%</text>
            <text class="dimension-label">{{ d.info.right }}</text>
          </view>
          <view class="dimension-bar">
            <view class="dimension-fill" :style="{ width: d.leftPct + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 特质标签 -->
      <view class="result-section">
        <view class="section-title">核心特质</view>
        <view class="traits-grid">
          <text v-for="t in resultData.traits" :key="t" class="trait-tag">{{ t }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="result-actions">
        <view class="action-btn primary" @tap="restartQuiz">重新测试</view>
        <view class="action-btn" @tap="shareResult">分享结果</view>
      </view>
      <view class="back-home-link" @tap="exitQuiz">← 返回首页</view>
    </view>
  </view>
</template>

<script>
import { questions, mbtiTypes, dimInfo, calcMbtiType } from '@/utils/mbti-data.js'

export default {
  data() {
    return {
      page: 'start',
      questions,
      currentQ: 0,
      scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
      resultType: '',
      resultData: {},
      dimensions: [],
      optionLetters: ['A', 'B']
    }
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentQ] || {}
    },
    progressPercent() {
      return Math.round(((this.currentQ + 1) / this.questions.length) * 100)
    },
    dimHint() {
      const dim = this.currentQuestion.dim
      return dimInfo[dim] ? dimInfo[dim].hint : ''
    }
  },
  onShareAppMessage() {
    if (this.resultType) {
      return {
        title: `我是${this.resultType} ${this.resultData.name}，测测你是什么人格？`,
        path: '/pages/mbti/mbti'
      }
    }
    return {
      title: '玄机阁 · MBTI人格测试',
      path: '/pages/mbti/mbti'
    }
  },
  methods: {
    startQuiz() {
      this.currentQ = 0
      this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
      this.page = 'quiz'
    },
    goBackToStart() {
      this.page = 'start'
      this.currentQ = 0
      this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    },
    exitQuiz() {
      uni.navigateBack()
    },
    selectOption(index, value) {
      this.scores[value]++
      
      setTimeout(() => {
        this.currentQ++
        if (this.currentQ < this.questions.length) {
          // 继续下一题
          this.$forceUpdate()
        } else {
          this.showResult()
        }
      }, 400)
    },
    showResult() {
      this.resultType = calcMbtiType(this.scores)
      this.resultData = mbtiTypes[this.resultType] || { name: '未知', emoji: '❓', brief: '', traits: [] }
      
      // 维度分析
      const dims = [
        { dim: 'EI', leftScore: this.scores.E, rightScore: this.scores.I },
        { dim: 'SN', leftScore: this.scores.S, rightScore: this.scores.N },
        { dim: 'TF', leftScore: this.scores.T, rightScore: this.scores.F },
        { dim: 'JP', leftScore: this.scores.J, rightScore: this.scores.P }
      ]
      
      this.dimensions = dims.map(d => {
        const total = d.leftScore + d.rightScore
        const leftPct = Math.round((d.leftScore / total) * 100)
        const info = dimInfo[d.dim]
        return {
          dim: d.dim,
          leftPct,
          rightPct: 100 - leftPct,
          info
        }
      })
      
      this.page = 'result'
    },
    restartQuiz() {
      this.startQuiz()
    },
    shareResult() {
      // #ifdef MP-WEIXIN
      wx.showShareMenu({ withShareTicket: true })
      uni.showToast({ title: '点击右上角分享', icon: 'none' })
      // #endif
      
      // #ifndef MP-WEIXIN
      const text = `我是${this.resultType} ${this.resultData.name}，测测你是什么人格？`
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
  padding: 20px 20px 40px;
  min-height: 100vh;
  background: #0d0e1f;
}

/* 开始页 */
.start-page {
  text-align: center;
  padding-top: 40px;
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.start-emoji { font-size: 64px; margin-bottom: 16px; }
.start-title {
  font-size: 26px;
  font-weight: 700;
  color: #d4af37;
  margin-bottom: 8px;
}
.start-subtitle {
  font-size: 14px;
  color: #a09ab8;
  margin-bottom: 16px;
}
.start-desc {
  font-size: 13px;
  color: #6a6580;
  line-height: 1.8;
  margin-bottom: 24px;
}
.start-btn {
  display: inline-block;
  padding: 14px 48px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 30px;
  color: #d4af37;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
}

/* 维度预览 */
.dimension-preview {
  margin-top: 32px;
  padding: 20px;
  background: rgba(26, 27, 60, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
}
.dim-label {
  font-size: 12px;
  color: #a09ab8;
  margin-bottom: 12px;
  letter-spacing: 1px;
}
.dim-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.dim-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #e8e0f0;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
}
.dim-emoji { font-size: 18px; }

/* 答题页 */
.quiz-page {
  animation: fadeIn 0.4s ease;
}
.quiz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.back-link {
  color: #d4af37;
  font-size: 14px;
}
.exit-link {
  color: #6a6580;
  font-size: 13px;
}
.progress-wrap {
  flex: 1;
  margin-left: 20px;
}
.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #7b5ea7, #d4af37);
  border-radius: 2px;
  transition: width 0.3s;
}
.progress-text {
  font-size: 11px;
  color: #a09ab8;
  text-align: right;
  display: block;
  margin-top: 4px;
}

.dimension-hint {
  font-size: 11px;
  color: #7b5ea7;
  padding: 6px 12px;
  background: rgba(123, 94, 167, 0.1);
  border: 1px solid rgba(123, 94, 167, 0.2);
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 16px;
}

.question-text {
  font-size: 18px;
  color: #f5f0e8;
  line-height: 1.6;
  margin-bottom: 24px;
  animation: slideIn 0.4s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.option-btn {
  padding: 16px;
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 14px;
  color: #e8e0f0;
  font-size: 14px;
  text-align: left;
  line-height: 1.5;
  transition: all 0.2s;
  animation: slideIn 0.4s ease both;
}
.option-btn:active {
  border-color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
  transform: scale(0.98);
}
.option-prefix {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: rgba(212, 175, 55, 0.15);
  border-radius: 50%;
  color: #d4af37;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
}

/* 结果页 */
.result-page {
  text-align: center;
  animation: fadeIn 0.5s ease;
}
.result-type {
  font-size: 28px;
  font-weight: 700;
  color: #d4af37;
  letter-spacing: 4px;
  margin-bottom: 8px;
}
.result-emoji { font-size: 56px; margin-bottom: 8px; }
.result-name {
  font-size: 22px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 12px;
}
.result-brief {
  font-size: 14px;
  color: #a09ab8;
  line-height: 1.8;
  margin-bottom: 24px;
  padding: 0 10px;
}

.result-section {
  text-align: left;
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}
.section-title {
  font-size: 12px;
  color: #d4af37;
  letter-spacing: 2px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}

.dimension-card { margin-bottom: 14px; }
.dimension-card:last-child { margin-bottom: 0; }
.dimension-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.dimension-label { font-size: 11px; color: #a09ab8; }
.dimension-pct { font-size: 12px; color: #d4af37; font-weight: 600; }
.dimension-divider { flex: 1; }
.dimension-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}
.dimension-fill {
  height: 100%;
  background: linear-gradient(90deg, #7b5ea7, #d4af37);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.traits-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.trait-tag {
  font-size: 12px;
  padding: 6px 14px;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 20px;
  color: #d4af37;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.action-btn {
  flex: 1;
  padding: 14px;
  text-align: center;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  color: #d4af37;
}
.action-btn.primary {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  border-color: rgba(212, 175, 55, 0.4);
}

.back-home-link {
  text-align: center;
  color: #6a6580;
  font-size: 13px;
  padding: 16px 0;
}
</style>
