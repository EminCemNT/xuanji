<template>
  <view class="page-wrap">
    <view class="stars">
      <view v-for="s in starList" :key="s.id" class="star"
        :style="{ left: s.x+'%', top: s.y+'%', animationDelay: s.delay+'s', animationDuration: s.dur+'s' }" />
    </view>

    <!-- 顶部 -->
    <view class="header">
      <view class="header-title">✦ AI塔罗占卜 ✦</view>
      <view class="header-sub">心诚则灵，静心选牌</view>
    </view>

    <!-- 步骤指示 -->
    <view class="steps">
      <view v-for="n in 4" :key="n" class="step-dot"
        :class="{ active: step === n, done: step > n }" />
    </view>

    <!-- 步骤1: 选问题 -->
    <view v-if="step === 1" class="page-content">
      <view class="hint-text">你想占卜什么？</view>
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

      <textarea
        v-if="selectedType"
        class="custom-input"
        v-model="customQ"
        placeholder="描述你的具体问题（选填，越具体越准）"
        maxlength="100"
      />

      <view class="free-hint">全部功能免费开放 · 单牌 / 三牌阵 / 五牌阵</view>

      <view class="btn-primary" :class="{ disabled: !selectedType }" @tap="goStep(2)">
        下一步 · 选牌阵
      </view>
    </view>

    <!-- 步骤2: 选牌阵 -->
    <view v-else-if="step === 2" class="page-content">
      <view class="hint-text">选择牌阵</view>
      <view class="spread-select">
        <view
          v-for="sp in spreads"
          :key="sp.count"
          class="spread-option"
          :class="{ selected: selectedSpread === sp.count }"
          @tap="selectedSpread = sp.count"
        >
          <text class="so-icon">{{ sp.icon }}</text>
          <view class="so-title">{{ sp.title }}</view>
          <view class="so-desc">{{ sp.desc }}</view>
          <view class="so-price">免费</view>
        </view>
      </view>
      <view class="btn-primary" @tap="goStep(3)">下一步 · 静心选牌</view>
      <view class="btn-secondary" @tap="goStep(1)">返回</view>
    </view>

    <!-- 步骤3: 选牌 -->
    <view v-else-if="step === 3" class="page-content">
      <view class="hint-text">闭上眼，深呼吸，凭直觉选牌</view>
      <view class="pick-hint">{{ pickHintText }}</view>
      <view class="card-pool">
        <view
          v-for="i in 22"
          :key="i"
          class="tarot-card-back"
          :class="{ selected: selectedCards.includes(i-1) }"
          @tap="pickCard(i-1)"
        >
          <text class="card-back-icon">🌟</text>
        </view>
      </view>
      <view class="btn-primary" :class="{ disabled: selectedCards.length !== selectedSpread }" @tap="revealCards">
        揭示命运
      </view>
      <view class="btn-secondary" @tap="goStep(2)">返回选牌阵</view>
    </view>

    <!-- 步骤4: 解读 -->
    <view v-else-if="step === 4" class="page-content">
      <!-- 揭牌展示 -->
      <view class="reveal-area">
        <view v-for="(d, i) in drawnCards" :key="i" class="revealed-card">
          <view class="rc-img" :class="{ reversed: d.reversed }">
            <text class="rc-card-icon">{{ d.card.icon }}</text>
          </view>
          <view class="rc-name">{{ d.card.name }}{{ d.reversed ? '（逆位）' : '' }}</view>
          <view class="rc-pos">{{ d.pos }}</view>
        </view>
      </view>

      <!-- 逐牌解读 -->
      <view v-for="(d, i) in drawnCards" :key="'r'+i" class="reading-section">
        <view class="rs-title">{{ d.card.icon }} {{ d.card.name }}{{ d.reversed ? '（逆位）' : '' }} — {{ d.pos }}</view>
        <view class="card-reading">
          <view class="cr-title">关键词：{{ d.card.keyword }}</view>
          <view class="cr-text">{{ d.reversed ? d.card.rev : d.card.up }}</view>
        </view>
      </view>

      <!-- AI 综合解读 -->
      <view class="ai-reading">
        <view class="ai-badge">✦ AI 灵感解读 ✦</view>
        <view class="ai-title">{{ aiTitle }}</view>
        <view class="ai-text">{{ aiText }}</view>
      </view>

      <!-- 深度解读 -->
      <view class="ai-reading">
        <view class="ai-badge">✦ 深度解读 ✦</view>
        <view class="ai-title">行动建议 · 时间节点 · 避坑指南</view>
        <view class="ai-text">{{ deepText }}</view>
      </view>

      <view class="btn-row">
        <view class="btn-secondary" @tap="goStep(1)">再占一卦</view>
        <view class="btn-primary" @tap="copyResult">复制结果</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const starList = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: (Math.random() * 3).toFixed(1),
  dur: (2 + Math.random() * 3).toFixed(1)
}))

const MAJOR_ARCANA = [
  { id: 0,  name: '愚者',     icon: '🃏', keyword: '新开始·冒险·自由',   up: '新的旅程即将开始，保持初心与勇气，大胆迈出第一步。不必过度计划，相信直觉。', rev: '过于鲁莽或逃避责任，需要停下脚步审视方向，不要盲目乐观。' },
  { id: 1,  name: '魔术师',   icon: '🎩', keyword: '创造·技巧·意志',     up: '你拥有实现目标的一切资源，行动的时机已到。将想法付诸实践，专注集中。', rev: '才能未被充分利用，或存在欺骗。审视自己是否在自欺欺人。' },
  { id: 2,  name: '女祭司',   icon: '🌙', keyword: '直觉·神秘·潜意识',   up: '相信你的直觉和内在智慧，答案不在外界而在内心。静下心来倾听自己。', rev: '忽视直觉，过于依赖外在信息。需要重新连接内在声音。' },
  { id: 3,  name: '女皇',     icon: '👸', keyword: '丰盛·滋养·美',       up: '丰盛与创造力降临，享受生活的美好。适合培养感情或开启创意项目。', rev: '过度消耗或匮乏感，需要学会自我滋养，关注内在需求。' },
  { id: 4,  name: '皇帝',     icon: '🏛️', keyword: '权威·结构·掌控',     up: '建立秩序与规则，用理性和纪律来推进事情。领导力彰显的时期。', rev: '控制欲过强或缺乏纪律，需要在权威与灵活之间找平衡。' },
  { id: 5,  name: '教皇',     icon: '📿', keyword: '传统·信仰·指引',     up: '寻求前辈或传统的智慧指引，遵循内心的信念。适合学习或拜师。', rev: '打破陈规的时机，不要被传统束缚，寻找自己的道路。' },
  { id: 6,  name: '恋人',     icon: '💕', keyword: '选择·结合·和谐',     up: '重要的选择或结合出现，遵从内心做出决定。感情和谐，关系深化。', rev: '选择困难或关系不和谐，需要诚实面对内心真正的渴望。' },
  { id: 7,  name: '战车',     icon: '🏇', keyword: '胜利·意志·前进',     up: '凭借坚定意志取得胜利，勇往直前。克服障碍，掌控局势。', rev: '方向感迷失或内在冲突，需要先解决内心矛盾再行动。' },
  { id: 8,  name: '力量',     icon: '🦁', keyword: '勇气·耐心·内力',     up: '内在力量强大，以柔克刚。温和的坚持比强硬更有力量。', rev: '自我怀疑或恐惧占上风，需要重新找回自信和勇气。' },
  { id: 9,  name: '隐者',     icon: '🏔️', keyword: '内省·独处·智慧',     up: '独处和内省带来智慧，暂时远离喧嚣，向内探索答案。', rev: '过度封闭或逃避社交，需要在独处与连接之间找平衡。' },
  { id: 10, name: '命运之轮', icon: '🎡', keyword: '转变·机遇·循环',     up: '命运的转折点到来，好运降临。抓住机遇，接受变化。', rev: '运势低迷或抗拒变化，低谷是暂时的，保持信心。' },
  { id: 11, name: '正义',     icon: '⚖️', keyword: '公平·因果·真相',     up: '公正的审判到来，种瓜得瓜种豆得豆。真相将大白。', rev: '不公或逃避责任，需要面对真相，承担应尽的义务。' },
  { id: 12, name: '倒吊人',   icon: '🙃', keyword: '牺牲·等待·新视角',   up: '换个角度看问题，暂时的等待与牺牲会带来更深的领悟。', rev: '无意义的牺牲或固执，需要果断行动，不要被动等待。' },
  { id: 13, name: '死神',     icon: '🦋', keyword: '结束·转化·重生',     up: '旧的结束为新的腾出空间，不要害怕改变，凤凰涅槃。', rev: '抗拒必然的改变，执着于过去，需要学会放下。' },
  { id: 14, name: '节制',     icon: '🏺', keyword: '平衡·调和·耐心',     up: '保持平衡与耐心，不走极端。调和各方力量，循序渐进。', rev: '失衡或急躁，需要回归中道，重新调整节奏。' },
  { id: 15, name: '恶魔',     icon: '🔗', keyword: '束缚·欲望·阴影',     up: '审视什么在束缚你——欲望、执念或恐惧。看清锁链才能解脱。', rev: '开始从束缚中解脱，摆脱有害的模式或关系。' },
  { id: 16, name: '塔',       icon: '⚡', keyword: '突变·崩塌·觉醒',     up: '突如其来的变故打破旧结构，虽然痛苦但是必要的觉醒。', rev: '避免了灾难或灾难影响减弱，但仍需警惕潜在危机。' },
  { id: 17, name: '星星',     icon: '⭐', keyword: '希望·灵感·治愈',     up: '希望之光降临，灵感涌现。经历困难后的治愈与指引。', rev: '失去希望或信心，需要重新连接内心的光芒。' },
  { id: 18, name: '月亮',     icon: '🌕', keyword: '幻象·恐惧·潜意识',   up: '注意表象之下的真相，潜意识的信息值得关注。警惕幻觉。', rev: '走出迷雾，恐惧开始消散，真相逐渐浮现。' },
  { id: 19, name: '太阳',     icon: '☀️', keyword: '成功·喜悦·光明',     up: '阳光普照，成功与快乐降临。充满自信和活力，一切顺遂。', rev: '短暂的低谷或内在的阴影，但阳光终会再次照耀。' },
  { id: 20, name: '审判',     icon: '📯', keyword: '觉醒·召唤·重生',     up: '内在的觉醒与召唤到来，重新审视人生方向。好消息将至。', rev: '忽视内心的召唤，逃避反省。需要倾听灵魂的声音。' },
  { id: 21, name: '世界',     icon: '🌍', keyword: '完成·圆满·成就',     up: '一个完整的周期圆满完成，收获成果。新的层次即将开启。', rev: '差最后一步完成，需要坚持到底，不要半途而废。' }
]

const POS_NAMES = {
  1: ['指引'],
  3: ['过去', '现在', '未来'],
  5: ['现状', '阻碍', '过去影响', '未来趋势', '最终结果']
}

const READING_TEMPLATES = {
  love: {
    title: '💕 爱情姻缘解读',
    summaries: [
      '从牌面来看，你的感情正处于一个微妙的转折期。{card_name}出现在{pos}的位置，暗示着{keyword}。这说明你内心深处渴望一段真挚的连接，但时机和方式需要斟酌。',
      '牌面显示，关于你的感情问题，宇宙给出的信号是——{keyword}。{card_name}在{pos}位提醒你，爱情不是等待，而是两个灵魂的同频共振。',
      '你的爱情运势正在{keyword}的影响下缓缓展开。{card_name}的出现并非偶然，它在{pos}位为你揭示了一个重要信息：先成为完整的自己，才能吸引对的人。'
    ]
  },
  career: {
    title: '💼 事业财运解读',
    summaries: [
      '从牌面分析，你的事业正处于{keyword}的阶段。{card_name}在{pos}位说明，当前的挑战是暂时的，关键在于如何把握{keyword}的能量转化为行动力。',
      '财运方面，{card_name}出现在{pos}位，暗示{keyword}的影响。这不是一个急于求成的时期，而是需要扎实积累的阶段。厚积薄发，方为正道。',
      '你的事业方向受到了{keyword}的指引。{card_name}在{pos}位揭示：当下最重要的不是速度，而是方向。确认方向正确后，全力以赴。'
    ]
  },
  choice: {
    title: '⚖️ 抉择指引解读',
    summaries: [
      '关于你的抉择，{card_name}在{pos}位给出了{keyword}的信号。牌面暗示，你内心其实已经有了答案，只是需要勇气去承认和行动。',
      '面对选择，{card_name}出现在{pos}位，核心信息是{keyword}。宇宙在告诉你：无论选择哪条路，最重要的是全身心地投入，不要回头。',
      '抉择的时刻，{card_name}带来{keyword}的启示。在{pos}位它提醒你：不要被恐惧驱动决策，而要被热爱和信念指引方向。'
    ]
  },
  growth: {
    title: '🌱 个人成长解读',
    summaries: [
      '在成长的道路上，{card_name}在{pos}位为你照亮了{keyword}的方向。你正在经历一次深层的内在蜕变，这个过程可能不舒适，但绝对是值得的。',
      '关于你的成长课题，{card_name}出现在{pos}位，核心主题是{keyword}。这说明你需要突破的恰恰是你最回避的，勇敢面对就能迎来蜕变。',
      '你的灵魂正在呼唤{keyword}的力量。{card_name}在{pos}位的出现是宇宙的温柔提醒：成长不是消灭阴影，而是与阴影和解。'
    ]
  }
}

const DEEP_TEMPLATES = {
  love: '🔮 深度行动建议：\n\n本周适合主动表达心意，尤其是周三到周五能量最旺。如果心中有想念的人，不要犹豫发送那条消息。对于有伴侣的人，建议安排一次深度对话，坦诚分享内心感受。\n\n⏰ 关键时间节点：本月15号前后、下月初\n\n⚠️ 避坑指南：不要在情绪激动时做感情决定；警惕过于理想化对方；给彼此留出独立空间。',
  career: '🔮 深度行动建议：\n\n现在是梳理职业规划的好时机。建议列出你最核心的三项优势，寻找能发挥这些优势的机会。如果是考虑跳槽，先确认下一站的成长空间而非仅看薪资。\n\n⏰ 关键时间节点：下周一、本月20号前后\n\n⚠️ 避坑指南：不要因为焦虑而匆忙做决定；避免与同事发生正面冲突；保存好工作成果的证据。',
  choice: '🔮 深度行动建议：\n\n试试这个方法：想象自己已经选择了A，感受身体的反应；再想象选择了B，对比两者。身体不会撒谎，你的直觉反应就是最好的指引。另外，可以设定一个7天观察期，不急于做最终决定。\n\n⏰ 关键时间节点：本周末、下月中旬\n\n⚠️ 避坑指南：不要让别人的意见代替你的感受；避免在疲惫状态做重大决定；选择后不要反复纠结。',
  growth: '🔮 深度行动建议：\n\n建议从今天开始写觉察日记，记录每天的情绪波动和触发点。每周复盘一次，你会发现自己重复的模式。找到模式，就能打破循环。另外，尝试一件你一直想做但不敢做的事，哪怕很小。\n\n⏰ 关键时间节点：下一个满月前后、本月底\n\n⚠️ 避坑指南：不要试图一次性改变所有习惯；避免自我批判，成长是螺旋上升的；允许自己有停滞期。'
}

const questionTypes = [
  { type: 'love',   icon: '💕', title: '爱情姻缘', desc: 'Ta的心意·复合时机·正缘' },
  { type: 'career', icon: '💼', title: '事业财运', desc: '跳槽时机·创业方向·财运' },
  { type: 'choice', icon: '⚖️', title: '抉择指引', desc: 'A还是B·去还是留' },
  { type: 'growth', icon: '🌱', title: '个人成长', desc: '突破瓶颈·自我探索' }
]

const spreads = [
  { count: 1, icon: '🃏',           title: '单牌指引', desc: '一针见血' },
  { count: 3, icon: '🃏🃏🃏',       title: '三牌阵',   desc: '过去·现在·未来' },
  { count: 5, icon: '🃏🃏🃏🃏🃏', title: '五牌阵',   desc: '深度全面解读' }
]

// 状态
const step = ref(1)
const selectedType = ref('')
const customQ = ref('')
const selectedSpread = ref(1)
const selectedCards = ref([])
const drawnCards = ref([])
const aiTitle = ref('')
const aiText = ref('')
const deepText = ref('')

const pickHintText = computed(() => {
  const remaining = selectedSpread.value - selectedCards.value.length
  if (remaining > 0) return `请再选择 ${remaining} 张牌`
  return '已选满，点击「揭示命运」'
})

function selectType(type) {
  selectedType.value = type
}

function goStep(n) {
  if (n === 1 && step.value !== 1) {
    selectedCards.value = []
    drawnCards.value = []
  }
  if (n === 3) {
    selectedCards.value = []
  }
  step.value = n
}

function pickCard(idx) {
  const arr = [...selectedCards.value]
  if (arr.includes(idx)) {
    selectedCards.value = arr.filter(i => i !== idx)
  } else {
    if (arr.length >= selectedSpread.value) return
    selectedCards.value = [...arr, idx]
  }
}

function revealCards() {
  if (selectedCards.value.length !== selectedSpread.value) return
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const cards = []
  const usedIds = new Set()

  for (let i = 0; i < selectedSpread.value; i++) {
    let cardId = (seed * (i + 1) * 7 + selectedCards.value[i] * 13) % 22
    while (usedIds.has(cardId)) cardId = (cardId + 1) % 22
    usedIds.add(cardId)
    const isReversed = ((seed + i * 17 + selectedCards.value[i] * 3) % 5) < 2
    cards.push({
      card: MAJOR_ARCANA[cardId],
      reversed: isReversed,
      pos: POS_NAMES[selectedSpread.value][i]
    })
  }

  drawnCards.value = cards
  generateReading(cards)
  step.value = 4
}

function generateReading(cards) {
  const tpl = READING_TEMPLATES[selectedType.value]
  if (!tpl) return
  const summaries = tpl.summaries
  let text = summaries[Math.floor(Math.random() * summaries.length)]
  const firstCard = cards[0]
  const midCard = cards[Math.floor(cards.length / 2)]
  text = text
    .replace(/{card_name}/g, firstCard.card.name)
    .replace(/{pos}/g, midCard.pos)
    .replace(/{keyword}/g, firstCard.card.keyword.split('·')[0])

  if (cards.length >= 3) {
    text += '\n\n过去的影响：' + cards[0].card.name + '告诉你，' + (cards[0].reversed ? cards[0].card.rev : cards[0].card.up)
    text += '\n\n当下的状态：' + cards[1].card.name + '揭示，' + (cards[1].reversed ? cards[1].card.rev : cards[1].card.up)
    text += '\n\n未来的趋势：' + cards[2].card.name + '预示，' + (cards[2].reversed ? cards[2].card.rev : cards[2].card.up)
  }

  if (cards.length >= 5) {
    text += '\n\n⚠️ 需要注意的阻碍：' + cards[1].card.name + '提醒你，' + (cards[1].reversed ? cards[1].card.rev : cards[1].card.up)
    text += '\n\n✨ 最终走向：' + cards[4].card.name + '显示，' + (cards[4].reversed ? cards[4].card.rev : cards[4].card.up)
  }

  aiTitle.value = tpl.title
  aiText.value = text
  deepText.value = DEEP_TEMPLATES[selectedType.value] || ''
}

function copyResult() {
  const names = drawnCards.value.map(d => d.card.name + (d.reversed ? '(逆)' : '')).join(' · ')
  const text = `🔮 玄机阁·AI塔罗占卜\n我抽到了 ${names}\n解读超准！`
  uni.setClipboardData({ data: text, success: () => uni.showToast({ title: '已复制', icon: 'success' }) })
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
.header-title { font-size: 40rpx; font-weight: 600; color: #d4af37; letter-spacing: 4rpx; margin-bottom: 8rpx; }
.header-sub { font-size: 24rpx; color: #a09ab8; }

/* 步骤 */
.steps { display: flex; justify-content: center; gap: 16rpx; margin-bottom: 32rpx; position: relative; z-index: 1; }
.step-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.3s; }
.step-dot.active { background: #d4af37; transform: scale(1.3); }
.step-dot.done { background: rgba(212,175,55,0.4); }

/* 页面内容 */
.page-content { position: relative; z-index: 1; padding: 0 32rpx 120rpx; }
.hint-text { text-align: center; font-size: 26rpx; color: #a09ab8; margin-bottom: 24rpx; }

/* 问题类型 */
.question-types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; margin-bottom: 24rpx; }
.q-type {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 24rpx; padding: 28rpx 20rpx; text-align: center; transition: all 0.3s;
}
.q-type.selected { border-color: #d4af37; background: rgba(212,175,55,0.12); }
.q-type:active { opacity: 0.8; }
.q-type-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.q-type-title { font-size: 28rpx; font-weight: 600; color: #e8e0f0; margin-bottom: 6rpx; }
.q-type-desc { font-size: 22rpx; color: #a09ab8; }

/* 自定义输入 */
.custom-input {
  width: 100%; background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.25);
  border-radius: 20rpx; padding: 24rpx; color: #e8e0f0; font-size: 26rpx;
  margin-bottom: 20rpx; min-height: 100rpx;
}

.free-hint { text-align: center; font-size: 22rpx; color: #a09ab8; margin-bottom: 24rpx; }

/* 牌阵选择 */
.spread-select { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 32rpx; }
.spread-option {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 24rpx; padding: 28rpx 32rpx;
  display: flex; align-items: center; gap: 24rpx; transition: all 0.3s;
}
.spread-option.selected { border-color: #d4af37; background: rgba(212,175,55,0.1); }
.so-icon { font-size: 32rpx; min-width: 80rpx; }
.so-title { font-size: 28rpx; font-weight: 600; color: #e8e0f0; flex: 1; }
.so-desc { font-size: 22rpx; color: #a09ab8; }
.so-price { font-size: 22rpx; color: #d4af37; }

/* 牌池 */
.pick-hint { text-align: center; font-size: 26rpx; color: #d4af37; margin: 16rpx 0 24rpx; font-weight: 500; }
.card-pool { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12rpx; margin-bottom: 32rpx; }
.tarot-card-back {
  aspect-ratio: 0.65; background: linear-gradient(135deg, #2a1b4e, #1a2a5e);
  border-radius: 12rpx; border: 2rpx solid rgba(212,175,55,0.25);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.tarot-card-back.selected {
  border-color: #d4af37;
  background: linear-gradient(135deg, #4a2b6e, #2a3a7e);
  transform: translateY(-8rpx);
  box-shadow: 0 8rpx 24rpx rgba(212,175,55,0.3);
}
.card-back-icon { font-size: 28rpx; opacity: 0.3; }
.tarot-card-back.selected .card-back-icon { opacity: 1; }

/* 揭牌 */
.reveal-area { display: flex; justify-content: center; flex-wrap: wrap; gap: 24rpx; margin-bottom: 40rpx; }
.revealed-card { text-align: center; width: 140rpx; }
.rc-img {
  width: 120rpx; height: 184rpx; background: linear-gradient(135deg, #2a1b4e, #1a2a5e);
  border-radius: 16rpx; border: 2rpx solid rgba(212,175,55,0.4);
  display: flex; align-items: center; justify-content: center; margin: 0 auto 12rpx;
}
.rc-img.reversed { transform: rotate(180deg); }
.rc-card-icon { font-size: 48rpx; }
.rc-name { font-size: 22rpx; color: #e8e0f0; margin-bottom: 4rpx; }
.rc-pos { font-size: 20rpx; color: #a09ab8; }

/* 解读 */
.reading-section {
  background: rgba(26,27,60,0.65); border: 1rpx solid rgba(212,175,55,0.2);
  border-radius: 24rpx; padding: 32rpx; margin-bottom: 20rpx;
}
.rs-title { font-size: 28rpx; font-weight: 600; color: #d4af37; margin-bottom: 16rpx; }
.cr-title { font-size: 22rpx; color: #a09ab8; margin-bottom: 12rpx; }
.cr-text { font-size: 26rpx; line-height: 1.8; color: #e8e0f0; }

/* AI 解读 */
.ai-reading {
  background: linear-gradient(135deg, rgba(123,94,167,0.2), rgba(26,27,60,0.65));
  border: 1rpx solid rgba(212,175,55,0.3); border-radius: 24rpx;
  padding: 32rpx; margin-bottom: 20rpx;
}
.ai-badge { text-align: center; font-size: 22rpx; color: #d4af37; letter-spacing: 4rpx; margin-bottom: 16rpx; }
.ai-title { font-size: 28rpx; font-weight: 600; color: #e8e0f0; margin-bottom: 16rpx; }
.ai-text { font-size: 26rpx; line-height: 1.9; color: rgba(232,224,240,0.85); white-space: pre-line; }

/* 按钮 */
.btn-primary {
  display: block; width: 100%;
  background: linear-gradient(135deg, #d4af37, #b8960c);
  color: #1a1b3c; font-size: 30rpx; font-weight: 600;
  padding: 28rpx; border-radius: 20rpx; text-align: center;
  margin-bottom: 16rpx; box-shadow: 0 8rpx 24rpx rgba(212,175,55,0.3);
}
.btn-primary.disabled { opacity: 0.4; }
.btn-primary:active { opacity: 0.85; }
.btn-secondary {
  display: block; width: 100%;
  background: rgba(255,255,255,0.05); border: 1rpx solid rgba(255,255,255,0.12);
  color: #e8e0f0; font-size: 28rpx; padding: 24rpx;
  border-radius: 20rpx; text-align: center; margin-bottom: 16rpx;
}
.btn-secondary:active { background: rgba(212,175,55,0.1); }
.btn-row { display: flex; gap: 20rpx; }
.btn-row .btn-secondary, .btn-row .btn-primary { flex: 1; }
</style>
