<template>
  <view class="page-wrap">
    <!-- 星空背景 -->
    <view class="stars-bg">
      <view class="star" v-for="s in 50" :key="s"
        :style="{ left: starStyles[s-1].left, top: starStyles[s-1].top, animationDelay: starStyles[s-1].delay }"
      ></view>
    </view>

    <!-- 顶部 -->
    <view class="header">
      <view class="header-title">🔮 AI 塔罗占卜</view>
      <view class="header-sub">静心冥想，让直觉指引你选择</view>
    </view>

    <!-- 步骤指示器 -->
    <view class="steps">
      <view class="step-dot" :class="{ active: step === 1, done: step > 1 }">1</view>
      <view class="step-line" :class="{ done: step > 1 }"></view>
      <view class="step-dot" :class="{ active: step === 2, done: step > 2 }">2</view>
      <view class="step-line" :class="{ done: step > 2 }"></view>
      <view class="step-dot" :class="{ active: step === 3, done: step > 3 }">3</view>
      <view class="step-line" :class="{ done: step > 3 }"></view>
      <view class="step-dot" :class="{ active: step === 4, done: step > 4 }">4</view>
    </view>

    <!-- 步骤1：选择问题类型 -->
    <view v-if="step === 1" class="step-content">
      <view class="question-types">
        <view 
          v-for="qt in questionTypes" 
          :key="qt.type"
          class="q-type"
          :class="{ selected: selectedType === qt.type }"
          @tap="selectType(qt.type)"
        >
          <text class="q-type-icon">{{ qt.icon }}</text>
          <view class="q-type-title">{{ qt.title }}</view>
          <view class="q-type-desc">{{ qt.desc }}</view>
        </view>
      </view>
      <view class="custom-wrap" :class="{ show: selectedType }">
        <input 
          class="custom-input" 
          v-model="customQuestion" 
          placeholder="写下你的具体问题（可选）" 
          placeholder-style="color:#6a6580"
        />
      </view>
      <view class="step-btn" :class="{ disabled: !selectedType }" @tap="goStep2">下一步 →</view>
    </view>

    <!-- 步骤2：选择牌阵 -->
    <view v-if="step === 2" class="step-content">
      <view class="spread-grid">
        <view 
          v-for="sp in spreads" 
          :key="sp.value"
          class="spread-option"
          :class="{ selected: selectedSpread === sp.value }"
          @tap="selectSpread(sp.value)"
        >
          <view class="spread-cards">{{ sp.display }}</view>
          <view class="spread-name">{{ sp.name }}</view>
          <view class="spread-desc">{{ sp.desc }}</view>
        </view>
      </view>
      <view class="step-btn" @tap="goStep3">开始抽牌 →</view>
    </view>

    <!-- 步骤3：选牌 -->
    <view v-if="step === 3" class="step-content">
      <view class="pick-hint" v-if="remainingToPick > 0">请再选择 {{ remainingToPick }} 张牌</view>
      <view class="pick-hint" v-else>已选满，点击「揭示命运」</view>
      <view class="card-pool">
        <view 
          v-for="(card, idx) in cardPool" 
          :key="idx"
          class="tarot-card-back"
          :class="{ selected: selectedCards.includes(idx) }"
          @tap="pickCard(idx)"
        >🃏</view>
      </view>
      <view 
        class="step-btn"
        :class="{ disabled: selectedCards.length !== selectedSpread }"
        @tap="revealCards"
      >揭示命运 ✨</view>
    </view>

    <!-- 步骤4：揭牌 + 解读 -->
    <view v-if="step === 4" class="step-content">
      <view class="reveal-area">
        <view 
          v-for="(d, idx) in drawnCards" 
          :key="idx"
          class="revealed-card"
          :style="{ animationDelay: idx * 0.3 + 's' }"
        >
          <view class="rc-img" :class="{ reversed: d.reversed }">
            {{ d.card.icon }}
          </view>
          <view class="rc-name">{{ d.card.name }}{{ d.reversed ? '（逆位）' : '' }}</view>
          <view class="rc-pos">{{ d.pos }}</view>
          <view class="rc-keyword">{{ d.card.keyword }}</view>
          <view class="rc-meaning">{{ d.reversed ? d.card.rev : d.card.up }}</view>
        </view>
      </view>

      <!-- AI 解读 -->
      <view v-if="reading" class="reading-card">
        <view class="reading-title">{{ readingTitle }}</view>
        <view class="reading-text">{{ displayedReading }}</view>
      </view>

      <view v-if="deepReading" class="reading-card deep">
        <view class="reading-title">💡 深度解读</view>
        <view class="reading-text deep-text">{{ displayedDeepReading }}</view>
      </view>

      <view class="step-btn" @tap="reset">重新占卜 🔄</view>
    </view>
  </view>
</template>

<script>
import { MAJOR_ARCANA, POS_NAMES, READING_TEMPLATES, DEEP_TEMPLATES } from '@/utils/tarot-data.js'

export default {
  data() {
    return {
      step: 1,
      selectedType: null,
      selectedSpread: 1,
      customQuestion: '',
      selectedCards: [],
      drawnCards: [],
      cardPool: Array.from({ length: 22 }, (_, i) => i),
      reading: '',
      deepReading: '',
      readingTitle: '',
      displayedReading: '',
      displayedDeepReading: '',
      typingTimer: null,
      starStyles: [],
      
      questionTypes: [
        { type: 'love', icon: '💕', title: '爱情姻缘', desc: '感情走向、缘分指引' },
        { type: 'career', icon: '💼', title: '事业财运', desc: '工作发展、财富机遇' },
        { type: 'choice', icon: '⚖️', title: '抉择指引', desc: '两难选择、方向建议' },
        { type: 'growth', icon: '🌱', title: '个人成长', desc: '自我探索、心灵成长' }
      ],
      spreads: [
        { value: 1, name: '单张指引', display: '🃏', desc: '快速获得宇宙指引' },
        { value: 3, name: '三张牌阵', display: '🃏🃏🃏', desc: '过去·现在·未来' },
        { value: 5, name: '五张牌阵', display: '🃏🃏🃏🃏🃏', desc: '深度全景解析' }
      ]
    }
  },
  computed: {
    remainingToPick() {
      return this.selectedSpread - this.selectedCards.length
    }
  },
  created() {
    const styles = []
    for (let i = 0; i < 50; i++) {
      styles.push({
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        delay: Math.random() * 3 + 's'
      })
    }
    this.starStyles = styles
  },
  onUnload() {
    if (this.typingTimer) clearInterval(this.typingTimer)
  },
  onShareAppMessage() {
    return {
      title: '我在玄机阁用塔罗占卜了，快来试试！',
      path: '/pages/tarot/tarot'
    }
  },
  methods: {
    selectType(type) {
      this.selectedType = type
      this.customQuestion = ''
    },
    goStep2() {
      if (!this.selectedType) return
      this.step = 2
    },
    selectSpread(spread) {
      this.selectedSpread = spread
    },
    goStep3() {
      this.step = 3
      this.selectedCards = []
      this.cardPool = Array.from({ length: 22 }, (_, i) => i)
    },
    pickCard(idx) {
      if (this.selectedCards.includes(idx)) {
        this.selectedCards = this.selectedCards.filter(i => i !== idx)
      } else {
        if (this.selectedCards.length >= this.selectedSpread) return
        this.selectedCards.push(idx)
      }
    },
    revealCards() {
      if (this.selectedCards.length !== this.selectedSpread) return
      
      const today = new Date()
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
      
      this.drawnCards = []
      const usedIds = new Set()
      
      for (let i = 0; i < this.selectedSpread; i++) {
        let cardId = (seed * (i + 1) * 7 + this.selectedCards[i] * 13) % 22
        while (usedIds.has(cardId)) cardId = (cardId + 1) % 22
        usedIds.add(cardId)
        
        const isReversed = ((seed + i * 17 + this.selectedCards[i] * 3) % 5) < 2
        this.drawnCards.push({
          card: MAJOR_ARCANA[cardId],
          reversed: isReversed,
          pos: POS_NAMES[this.selectedSpread][i]
        })
      }
      
      this.step = 4
      this.generateReading()
    },
    generateReading() {
      const template = READING_TEMPLATES[this.selectedType]
      if (!template) return
      
      this.readingTitle = template.title
      
      const mainCard = this.drawnCards[0]
      const summaryIdx = Math.floor(Math.random() * template.summaries.length)
      let reading = template.summaries[summaryIdx]
        .replace('{card_name}', mainCard.card.name)
        .replace('{pos}', mainCard.pos)
        .replace(/{keyword}/g, mainCard.card.keyword)
      
      this.reading = reading
      this.deepReading = DEEP_TEMPLATES[this.selectedType]
      
      this.typewriterEffect()
    },
    typewriterEffect() {
      if (this.typingTimer) clearInterval(this.typingTimer)
      
      const fullReading = this.reading
      const fullDeep = this.deepReading
      this.displayedReading = ''
      this.displayedDeepReading = ''
      
      let idx = 0
      const full = fullReading + '\n\n' + fullDeep
      const isReadingPart = () => idx < fullReading.length
      
      this.typingTimer = setInterval(() => {
        if (idx < full.length) {
          if (isReadingPart()) {
            this.displayedReading += full[idx]
          } else {
            const deepIdx = idx - fullReading.length - 2
            if (deepIdx >= 0) {
              this.displayedDeepReading += full[idx]
            }
          }
          idx++
        } else {
          clearInterval(this.typingTimer)
        }
      }, 30)
    },
    reset() {
      if (this.typingTimer) clearInterval(this.typingTimer)
      this.step = 1
      this.selectedType = null
      this.selectedCards = []
      this.drawnCards = []
      this.reading = ''
      this.deepReading = ''
      this.displayedReading = ''
      this.displayedDeepReading = ''
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

/* 星空 */
.stars-bg {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
}
.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 3s infinite alternate;
}
@keyframes twinkle {
  0% { opacity: 0.2; }
  100% { opacity: 0.8; }
}

/* 顶部 */
.header {
  text-align: center;
  padding: 16px 0;
}
.header-title {
  font-size: 22px;
  color: #d4af37;
  letter-spacing: 4px;
  margin-bottom: 4px;
}
.header-sub {
  font-size: 13px;
  color: #a09ab8;
}

/* 步骤指示器 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 20px;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(212, 175, 55, 0.3);
  color: #a09ab8;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.step-dot.active {
  border-color: #d4af37;
  background: rgba(212, 175, 55, 0.2);
  color: #d4af37;
}
.step-dot.done {
  border-color: #6ddc8b;
  background: rgba(80, 180, 100, 0.2);
  color: #6ddc8b;
}
.step-line {
  width: 28px;
  height: 1px;
  background: rgba(212, 175, 55, 0.2);
}
.step-line.done {
  background: rgba(80, 180, 100, 0.5);
}

.step-content {
  animation: fadeUp 0.4s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 问题类型 */
.question-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}
.q-type {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  transition: all 0.3s;
}
.q-type.selected {
  border-color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
  transform: scale(0.97);
}
.q-type-icon { font-size: 36px; margin-bottom: 8px; display: block; }
.q-type-title { font-size: 15px; color: #e8e0f0; margin-bottom: 4px; }
.q-type-desc { font-size: 12px; color: #a09ab8; }

.custom-wrap { margin-top: 16px; display: none; }
.custom-wrap.show { display: block; }
.custom-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.2);
  color: #e8e0f0;
  font-size: 14px;
  box-sizing: border-box;
}

/* 牌阵选择 */
.spread-grid {
  display: grid;
  gap: 12px;
  margin-top: 8px;
}
.spread-option {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  transition: all 0.2s;
}
.spread-option.selected {
  border-color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
}
.spread-cards { font-size: 22px; margin-bottom: 8px; letter-spacing: 4px; }
.spread-name { font-size: 16px; color: #f5f0e8; font-weight: 600; margin-bottom: 4px; }
.spread-desc { font-size: 12px; color: #a09ab8; }

/* 牌池 */
.pick-hint {
  text-align: center;
  font-size: 14px;
  color: #d4af37;
  margin-bottom: 16px;
}
.card-pool {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.tarot-card-back {
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, #1a1060, #2a1b4e);
  border: 2px solid rgba(150, 80, 200, 0.3);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s;
}
.tarot-card-back.selected {
  border-color: #d4af37;
  box-shadow: 0 0 16px rgba(212, 175, 55, 0.4);
  transform: scale(1.05);
}

/* 揭示卡 */
.reveal-area {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}
.revealed-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 16px;
  width: calc(50% - 6px);
  text-align: center;
  box-sizing: border-box;
  animation: fadeUp 0.5s ease both;
}
.rc-img {
  width: 56px;
  height: 84px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #2a1b4e, #1a2a5e);
  border-radius: 8px;
  border: 1px solid rgba(150, 80, 200, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}
.rc-img.reversed {
  transform: rotate(180deg);
}
.rc-name {
  font-size: 16px;
  font-weight: 700;
  color: #f5f0e8;
  margin-bottom: 4px;
}
.rc-pos {
  font-size: 11px;
  color: #b080e0;
  margin-bottom: 4px;
}
.rc-keyword {
  font-size: 12px;
  color: #d4af37;
  margin-bottom: 8px;
}
.rc-meaning {
  font-size: 12px;
  color: #a09ab8;
  line-height: 1.6;
}

/* 解读 */
.reading-card {
  background: rgba(26, 27, 60, 0.65);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
}
.reading-card.deep {
  border-color: rgba(150, 80, 200, 0.3);
  background: linear-gradient(135deg, rgba(80, 40, 120, 0.2), rgba(26, 27, 60, 0.5));
}
.reading-title {
  font-size: 15px;
  color: #d4af37;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
}
.reading-text {
  font-size: 14px;
  color: #e8e0f0;
  line-height: 1.8;
  white-space: pre-line;
}
.deep-text {
  font-size: 13px;
  color: #b080e0;
  line-height: 1.8;
}

/* 按钮 */
.step-btn {
  width: 100%;
  padding: 14px;
  text-align: center;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  color: #d4af37;
  font-size: 15px;
  font-weight: 600;
  margin-top: 16px;
}
.step-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
