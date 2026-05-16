<template>
  <view class="page-wrap">
    <view class="stars">
      <view v-for="s in starList" :key="s.id" class="star"
        :style="{ left: s.x+'%', top: s.y+'%', animationDelay: s.delay+'s', animationDuration: s.dur+'s' }" />
    </view>

    <view class="container">
      <view class="header">
        <view class="page-title">🧠 MBTI 测试</view>
      </view>

      <!-- 开始页 -->
      <view v-if="phase === 'start'" class="start-page">
        <text class="start-icon">🧠</text>
        <view class="start-title">探索你的性格密码</view>
        <view class="start-desc">28 道精选题目，5 分钟了解真实的自己{{ '\n' }}基于 MBTI 16 型人格理论，解读你的性格奥秘</view>
        <view class="start-stats">
          <view class="stat-item"><view class="stat-value">28</view><view class="stat-label">精选题目</view></view>
          <view class="stat-item"><view class="stat-value">5min</view><view class="stat-label">测试时长</view></view>
          <view class="stat-item"><view class="stat-value">16</view><view class="stat-label">性格类型</view></view>
        </view>
        <view class="start-btn" @tap="startQuiz">开始测试 ✨</view>
      </view>

      <!-- 测试页 -->
      <view v-else-if="phase === 'quiz'" class="quiz-page">
        <view class="progress-bar-wrap">
          <view class="progress-bar-fill" :style="{ width: progressPct + '%' }"></view>
        </view>
        <view class="progress-info">
          <text class="question-num">{{ currentQ + 1 }}</text><text> / {{ questions.length }}</text>
          <text class="dim-hint">{{ dimInfo[questions[currentQ].dim].hint }}</text>
        </view>
        <view class="question-text">{{ questions[currentQ].text }}</view>
        <view class="options-list">
          <view
            v-for="(opt, i) in questions[currentQ].options"
            :key="i"
            class="option-btn"
            :class="{ selected: selectedOption === i }"
            @tap="selectOption(i, opt.value)"
          >
            <text class="option-prefix">{{ String.fromCharCode(65 + i) }}</text>
            <text>{{ opt.text }}</text>
          </view>
        </view>
      </view>

      <!-- 结果页 -->
      <view v-else-if="phase === 'result'" class="result-page">
        <view class="result-badge">你的 MBTI 类型</view>
        <view class="result-type">{{ resultType }}</view>
        <text class="result-emoji">{{ resultData.emoji }}</text>
        <view class="result-name">{{ resultData.name }}</view>
        <view class="result-brief">{{ resultData.brief }}</view>

        <!-- 维度分析 -->
        <view class="dimension-cards">
          <view v-for="d in dimAnalysis" :key="d.dim" class="dimension-card">
            <view class="dimension-row">
              <text class="dimension-label">{{ d.info.left }} {{ d.leftPct }}%</text>
              <text class="dimension-value">{{ d.isLeft ? '← 倾向' : '倾向 →' }}</text>
              <text class="dimension-label">{{ d.rightPct }}% {{ d.info.right }}</text>
            </view>
            <view class="dimension-bar">
              <view class="dimension-fill" :style="{ width: d.leftPct + '%' }"></view>
            </view>
          </view>
        </view>

        <!-- 核心特质 -->
        <view class="traits-section">
          <view class="traits-title">✨ 你的核心特质</view>
          <view class="traits-grid">
            <view v-for="t in resultData.traits" :key="t" class="trait-tag">{{ t }}</view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-btns">
          <view class="action-btn" @tap="copyResult">
            <text class="icon">📋</text> 复制结果
          </view>
          <view class="action-btn" @tap="startQuiz">
            <text class="icon">🔄</text> 重新测试
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const starList = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: (Math.random() * 3).toFixed(1),
  dur: (2 + Math.random() * 2).toFixed(1)
}))

const dimInfo = {
  EI: { left: 'E 外向', right: 'I 内向', hint: 'E / I 维度' },
  SN: { left: 'S 感觉', right: 'N 直觉', hint: 'S / N 维度' },
  TF: { left: 'T 思考', right: 'F 情感', hint: 'T / F 维度' },
  JP: { left: 'J 判断', right: 'P 感知', hint: 'J / P 维度' }
}

const questions = [
  { dim: 'EI', text: '周末到了，你更想怎么过？', options: [{ text: '约朋友出去聚会或逛街，越热闹越好', value: 'E' }, { text: '窝在家里看剧、读书，享受独处时光', value: 'I' }] },
  { dim: 'EI', text: '在一个陌生派对上，你通常会？', options: [{ text: '主动找人聊天，很快交到新朋友', value: 'E' }, { text: '躲在角落观察，等别人来搭话', value: 'I' }] },
  { dim: 'EI', text: '遇到烦心事，你倾向于？', options: [{ text: '找朋友倾诉，说出来就好了', value: 'E' }, { text: '自己消化，想清楚再决定要不要说', value: 'I' }] },
  { dim: 'EI', text: '你更喜欢哪种工作方式？', options: [{ text: '团队协作，头脑风暴，越聊越有灵感', value: 'E' }, { text: '独立思考，安静地完成自己的部分', value: 'I' }] },
  { dim: 'EI', text: '一天没和人说话，你会？', options: [{ text: '觉得闷，想找人聊聊天', value: 'E' }, { text: '觉得挺舒服的，难得清静', value: 'I' }] },
  { dim: 'EI', text: '朋友圈发了动态，你更在意？', options: [{ text: '多少个赞和评论，互动越多越开心', value: 'E' }, { text: '记录自己的心情，别人看不看无所谓', value: 'I' }] },
  { dim: 'EI', text: '旅行时你更享受？', options: [{ text: '认识新朋友，和当地人交流', value: 'E' }, { text: '独自探索，按自己的节奏走', value: 'I' }] },
  { dim: 'SN', text: '看电影时，你更关注？', options: [{ text: '剧情细节、特效、演员表演等具体内容', value: 'S' }, { text: '背后的隐喻、主题和想要表达的深层含义', value: 'N' }] },
  { dim: 'SN', text: '学习新东西，你更偏好？', options: [{ text: '跟着步骤一步步来，先掌握基础操作', value: 'S' }, { text: '先了解整体框架和大方向，再补充细节', value: 'N' }] },
  { dim: 'SN', text: '做决定时，你更依赖？', options: [{ text: '过往经验和实际数据，眼见为实', value: 'S' }, { text: '直觉和第六感，相信自己的判断', value: 'N' }] },
  { dim: 'SN', text: '描述一件事，你更习惯？', options: [{ text: '把细节说清楚，时间地点人物都要交代', value: 'S' }, { text: '说大意和感觉，用比喻让别人理解', value: 'N' }] },
  { dim: 'SN', text: '你更欣赏哪种人？', options: [{ text: '脚踏实地、执行力强的实干家', value: 'S' }, { text: '天马行空、创意无限的梦想家', value: 'N' }] },
  { dim: 'SN', text: '面对一个问题，你先想的是？', options: [{ text: '这个问题以前怎么解决的？有什么现成方案？', value: 'S' }, { text: '能不能换个思路？有没有更有趣的解法？', value: 'N' }] },
  { dim: 'SN', text: '看一本小说，你更享受？', options: [{ text: '精彩的情节推进和世界观的细节设定', value: 'S' }, { text: '人物的心理变化和故事背后的深层主题', value: 'N' }] },
  { dim: 'TF', text: '朋友跟你说一件难过的事，你第一反应是？', options: [{ text: '分析问题出在哪，给出解决方案', value: 'T' }, { text: '先安慰对方，让对方知道你在乎', value: 'F' }] },
  { dim: 'TF', text: '团队合作出现分歧，你觉得最重要的是？', options: [{ text: '谁的方案更合理就用谁的，效率优先', value: 'T' }, { text: '照顾每个人的感受，找到大家都能接受的方案', value: 'F' }] },
  { dim: 'TF', text: '评价一个人，你更看重？', options: [{ text: '能力、效率和成果，实力说话', value: 'T' }, { text: '人品、善良和对他人的态度', value: 'F' }] },
  { dim: 'TF', text: '买东西做选择时，你更依赖？', options: [{ text: '参数对比、性价比分析、用户评价', value: 'T' }, { text: '感觉对不对，喜不喜欢，有没有眼缘', value: 'F' }] },
  { dim: 'TF', text: '工作中发现同事的方案有明显问题，你会？', options: [{ text: '直接指出问题，帮对方改进', value: 'T' }, { text: '先肯定对方的努力，再委婉提出建议', value: 'F' }] },
  { dim: 'TF', text: '你认为好的规则应该是？', options: [{ text: '一视同仁，规则面前人人平等', value: 'T' }, { text: '有弹性，特殊情况应该特殊对待', value: 'F' }] },
  { dim: 'TF', text: '面对批评，你通常？', options: [{ text: '理性分析批评是否合理，有则改之', value: 'T' }, { text: '先有点受伤，需要时间消化情绪', value: 'F' }] },
  { dim: 'JP', text: '关于计划，你更接近哪种？', options: [{ text: '提前规划好每一天，喜欢掌控感', value: 'J' }, { text: '计划赶不上变化，走一步看一步', value: 'P' }] },
  { dim: 'JP', text: '旅行前你会？', options: [{ text: '做详细攻略，行程安排到小时', value: 'J' }, { text: '订个机票酒店就行，到了再随缘', value: 'P' }] },
  { dim: 'JP', text: '截止日期前，你通常？', options: [{ text: '提前完成，留出检查和修改的时间', value: 'J' }, { text: '最后几天冲刺，压力下反而更有灵感', value: 'P' }] },
  { dim: 'JP', text: '你的桌面/房间通常是？', options: [{ text: '收拾得整整齐齐，东西各归其位', value: 'J' }, { text: '有点乱但我知道东西在哪，创意需要混乱', value: 'P' }] },
  { dim: 'JP', text: '对于改变计划，你的态度是？', options: [{ text: '有点烦躁，计划好了的事不想变', value: 'J' }, { text: '无所谓，新安排说不定更有趣', value: 'P' }] },
  { dim: 'JP', text: '做一件事，你更在意？', options: [{ text: '结果，完成比完美重要', value: 'J' }, { text: '过程，享受当下的体验', value: 'P' }] },
  { dim: 'JP', text: '购物时你更可能？', options: [{ text: '想好要买什么，直奔目标，买完就走', value: 'J' }, { text: '随便逛逛，看到喜欢的就买', value: 'P' }] }
]

const mbtiTypes = {
  INTJ: { name: '建筑师', emoji: '🏛️', brief: '富有想象力的战略家，一切皆在计划之中。你独立、果断，对知识有着永不满足的渴望。', traits: ['战略思维', '独立自主', '追求完美', '理性果断', '远见卓识', '高标准'] },
  INTP: { name: '逻辑学家', emoji: '🔬', brief: '富有创造力的发明家，对知识有着不可抑制的渴望。你热衷于探索理论，喜欢拆解万物运行的规律。', traits: ['逻辑分析', '好奇心强', '独立思考', '抽象思维', '追求真理', '创意无限'] },
  ENTJ: { name: '指挥官', emoji: '👑', brief: '大胆、富有想象力的强势领导者，总能找到或创造解决方案。天生的领袖，对挑战充满热情。', traits: ['领导力', '高效执行', '战略规划', '目标导向', '自信果断', '挑战精神'] },
  ENTP: { name: '辩论家', emoji: '💡', brief: '聪明好奇的思想者，不会放弃任何智力挑战。你热爱头脑风暴，总是在寻找新的可能性。', traits: ['思维敏捷', '善于辩论', '创新精神', '适应力强', '挑战常规', '知识广博'] },
  INFJ: { name: '提倡者', emoji: '🦋', brief: '安静而神秘，同时鼓舞人心且不知疲倦的理想主义者。你对人性有深刻的洞察，总能看到更美好的可能。', traits: ['洞察力强', '理想主义', '富有同理心', '坚持信念', '深度思考', '助人为乐'] },
  INFP: { name: '调停者', emoji: '🌙', brief: '诗意、善良的利他主义者，总是热切地为正义事业提供帮助。你的内心世界丰富而美好。', traits: ['理想主义', '共情能力', '创意丰富', '价值驱动', '内心丰富', '追求和谐'] },
  ENFJ: { name: '主人公', emoji: '🌟', brief: '富有魅力且鼓舞人心的领导者，有能力吸引听众。你天生善于激发他人的潜能。', traits: ['感染力', '善于激励', '人际洞察', '组织能力', '利他精神', '责任感强'] },
  ENFP: { name: '竞选者', emoji: '🌈', brief: '热情、有创造力且社交能力强的自由精灵，总能找到理由微笑。你把生活变成一场冒险。', traits: ['热情洋溢', '创意十足', '社交达人', '好奇心强', '灵活变通', '感染力强'] },
  ISTJ: { name: '物流师', emoji: '📋', brief: '实际且注重事实的人，其可靠性无可置疑。你是秩序的守护者，说到做到。', traits: ['可靠务实', '注重细节', '遵守规则', '条理清晰', '责任感强', '坚持不懈'] },
  ISFJ: { name: '守卫者', emoji: '🛡️', brief: '非常专注且温暖的守护者，随时准备保护所爱的人。你默默付出，是团队的基石。', traits: ['忠诚可靠', '体贴入微', '耐心细致', '默默奉献', '尊重传统', '脚踏实地'] },
  ESTJ: { name: '总经理', emoji: '📊', brief: '出色的管理者，在管理事物或人方面无与伦比。你建立秩序，确保一切井井有条。', traits: ['组织能力', '执行力强', '务实高效', '重视传统', '领导才能', '目标导向'] },
  ESFJ: { name: '执政官', emoji: '🤝', brief: '极有爱心、善于社交的人，总是热切地伸出援手。你是团队的粘合剂，让大家更紧密。', traits: ['热心助人', '善于社交', '团队意识', '照顾他人', '重视和谐', '组织能力'] },
  ISTP: { name: '鉴赏家', emoji: '🔧', brief: '大胆而实际的实验家，擅长使用各种形式的工具。你冷静理性，在危机中最为可靠。', traits: ['冷静理性', '动手能力', '独立自主', '适应力强', '注重实效', '问题解决'] },
  ISFP: { name: '探险家', emoji: '🎨', brief: '灵活而有魅力的艺术家，随时准备探索和体验新事物。你用行动表达自我，追求美与和谐。', traits: ['艺术感强', '自由随性', '温和善良', '活在当下', '审美独到', '行动派'] },
  ESTP: { name: '企业家', emoji: '🚀', brief: '聪明、精力充沛且善于感知的人，真正享受在边缘生活。你抓住当下，让每一刻都精彩。', traits: ['行动力强', '随机应变', '冒险精神', '观察力强', '务实果断', '精力充沛'] },
  ESFP: { name: '表演者', emoji: '🎭', brief: '自发、精力充沛且热情的人——生活永远不会在他们身边无聊。你是派对的灵魂，用快乐感染所有人。', traits: ['热情奔放', '活在当下', '感染力强', '适应力强', '乐观开朗', '善于表达'] }
}

// 状态
const phase = ref('start')
const currentQ = ref(0)
const selectedOption = ref(-1)
const scores = ref({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 })
const resultType = ref('')

const progressPct = computed(() => Math.round((currentQ.value / questions.length) * 100))

const resultData = computed(() => {
  if (!resultType.value) return {}
  return mbtiTypes[resultType.value] || {}
})

const dimAnalysis = computed(() => {
  const sc = scores.value
  return [
    { dim: 'EI', info: dimInfo.EI, leftScore: sc.E, rightScore: sc.I },
    { dim: 'SN', info: dimInfo.SN, leftScore: sc.S, rightScore: sc.N },
    { dim: 'TF', info: dimInfo.TF, leftScore: sc.T, rightScore: sc.F },
    { dim: 'JP', info: dimInfo.JP, leftScore: sc.J, rightScore: sc.P }
  ].map(d => {
    const total = d.leftScore + d.rightScore || 1
    const leftPct = Math.round((d.leftScore / total) * 100)
    return { ...d, leftPct, rightPct: 100 - leftPct, isLeft: d.leftScore >= d.rightScore }
  })
})

function startQuiz() {
  currentQ.value = 0
  selectedOption.value = -1
  scores.value = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  phase.value = 'quiz'
}

function selectOption(index, value) {
  if (selectedOption.value !== -1) return
  selectedOption.value = index
  scores.value[value]++

  setTimeout(() => {
    selectedOption.value = -1
    currentQ.value++
    if (currentQ.value >= questions.length) {
      calcResult()
    }
  }, 400)
}

function calcResult() {
  const sc = scores.value
  resultType.value = (sc.E >= sc.I ? 'E' : 'I')
    + (sc.S >= sc.N ? 'S' : 'N')
    + (sc.T >= sc.F ? 'T' : 'F')
    + (sc.J >= sc.P ? 'J' : 'P')
  phase.value = 'result'
}

function copyResult() {
  const text = `我是${resultType.value}「${resultData.value.name}」！来玄机阁测测你的MBTI性格吧 ✨`
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
}
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1b3c 50%, #0d0d1f 100%);
  color: #F5F0E8;
}
.stars { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
.star { position: absolute; width: 3rpx; height: 3rpx; background: #d4af37; border-radius: 50%; animation: twinkle 3s infinite alternate; }
@keyframes twinkle { 0% { opacity: 0.15; } 100% { opacity: 0.8; } }

.container { position: relative; z-index: 1; padding: 20rpx 32rpx 120rpx; }

.header { margin-bottom: 40rpx; padding-top: 20rpx; }
.page-title {
  font-size: 36rpx; font-weight: 600; text-align: center;
  background: linear-gradient(135deg, #D4AF37, #F5F0E8);
  -webkit-background-clip: text; color: transparent;
}

/* 开始页 */
.start-page { text-align: center; padding-top: 40rpx; }
.start-icon { font-size: 120rpx; display: block; margin-bottom: 24rpx; }
.start-title { font-size: 44rpx; font-weight: 600; color: #D4AF37; margin-bottom: 24rpx; }
.start-desc { font-size: 26rpx; color: rgba(245,240,232,0.7); line-height: 1.8; margin-bottom: 48rpx; white-space: pre-line; }
.start-stats { display: flex; justify-content: center; gap: 48rpx; margin-bottom: 64rpx; }
.stat-item { text-align: center; }
.stat-value { font-size: 48rpx; font-weight: 700; color: #D4AF37; }
.stat-label { font-size: 22rpx; color: rgba(245,240,232,0.6); margin-top: 8rpx; }
.start-btn {
  display: inline-block;
  background: linear-gradient(135deg, #D4AF37, #B8960C);
  color: #1A1B3C; font-size: 32rpx; font-weight: 600;
  padding: 24rpx 80rpx; border-radius: 60rpx;
  box-shadow: 0 8rpx 32rpx rgba(212,175,55,0.4);
}
.start-btn:active { opacity: 0.85; }

/* 测试页 */
.quiz-page { padding-top: 20rpx; }
.progress-bar-wrap { height: 8rpx; background: rgba(255,255,255,0.1); border-radius: 4rpx; margin-bottom: 16rpx; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #D4AF37, #F5D060); border-radius: 4rpx; transition: width 0.4s ease; }
.progress-info { display: flex; justify-content: space-between; margin-bottom: 40rpx; font-size: 24rpx; color: rgba(245,240,232,0.6); }
.question-num { color: #D4AF37; font-weight: 600; font-size: 28rpx; }
.dim-hint { color: rgba(212,175,55,0.7); }
.question-text { font-size: 34rpx; font-weight: 500; line-height: 1.6; margin-bottom: 48rpx; color: #F5F0E8; }
.options-list { display: flex; flex-direction: column; gap: 20rpx; }
.option-btn {
  background: rgba(255,255,255,0.06);
  border: 1rpx solid rgba(255,255,255,0.12);
  border-radius: 20rpx; padding: 28rpx 32rpx;
  font-size: 28rpx; color: #F5F0E8;
  display: flex; align-items: flex-start; gap: 20rpx;
  transition: all 0.3s;
}
.option-btn.selected {
  background: rgba(212,175,55,0.2);
  border-color: rgba(212,175,55,0.6);
}
.option-btn:active { background: rgba(212,175,55,0.15); }
.option-prefix {
  width: 44rpx; height: 44rpx; border-radius: 50%;
  background: rgba(212,175,55,0.15); color: #D4AF37;
  font-weight: 600; font-size: 24rpx;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  line-height: 44rpx; text-align: center;
}

/* 结果页 */
.result-page { padding-top: 20rpx; }
.result-badge {
  text-align: center; font-size: 22rpx; color: rgba(245,240,232,0.6);
  margin-bottom: 12rpx; letter-spacing: 2rpx;
}
.result-type {
  text-align: center; font-size: 80rpx; font-weight: 800;
  background: linear-gradient(135deg, #D4AF37, #F5D060);
  -webkit-background-clip: text; color: transparent; margin-bottom: 8rpx;
}
.result-emoji { font-size: 80rpx; display: block; text-align: center; margin-bottom: 12rpx; }
.result-name {
  text-align: center; font-size: 40rpx; font-weight: 600;
  color: #F5F0E8; margin-bottom: 24rpx;
}
.result-brief {
  font-size: 26rpx; line-height: 1.8; color: rgba(245,240,232,0.8);
  text-align: center; margin-bottom: 40rpx; padding: 0 8rpx;
}

/* 维度分析 */
.dimension-cards { margin-bottom: 32rpx; display: flex; flex-direction: column; gap: 20rpx; }
.dimension-card {
  background: rgba(255,255,255,0.05);
  border: 1rpx solid rgba(255,255,255,0.1);
  border-radius: 20rpx; padding: 24rpx 28rpx;
}
.dimension-row { display: flex; justify-content: space-between; margin-bottom: 16rpx; align-items: center; }
.dimension-label { font-size: 22rpx; color: rgba(245,240,232,0.7); }
.dimension-value { font-size: 22rpx; color: #D4AF37; }
.dimension-bar { height: 10rpx; background: rgba(255,255,255,0.1); border-radius: 5rpx; overflow: hidden; }
.dimension-fill { height: 100%; background: linear-gradient(90deg, #D4AF37, #7b5ea7); border-radius: 5rpx; }

/* 特质 */
.traits-section { margin-bottom: 40rpx; }
.traits-title { font-size: 28rpx; font-weight: 600; margin-bottom: 20rpx; color: #F5F0E8; }
.traits-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.trait-tag {
  background: rgba(212,175,55,0.12);
  border: 1rpx solid rgba(212,175,55,0.3);
  color: #D4AF37; font-size: 24rpx;
  padding: 10rpx 24rpx; border-radius: 30rpx;
}

/* 操作按钮 */
.action-btns { display: flex; gap: 20rpx; }
.action-btn {
  flex: 1; text-align: center;
  background: rgba(255,255,255,0.06);
  border: 1rpx solid rgba(255,255,255,0.12);
  border-radius: 20rpx; padding: 28rpx 16rpx;
  font-size: 26rpx; color: #F5F0E8;
}
.action-btn:active { background: rgba(212,175,55,0.12); }
.action-btn .icon { margin-right: 8rpx; }
</style>
