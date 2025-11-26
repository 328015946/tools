<script setup lang="ts">
  import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'

  const { t } = useI18n()

  // --- SEO ---
  useHead({
    title: t('typing_master.title'),
    meta: [{ name: 'description', content: t('typing_master.desc') }]
  })

  // --- 配置 ---
  const TEST_DURATION = 60
  const SAMPLE_TEXT_EN =
    'The quick brown fox jumps over the lazy dog. Programming languages are tools that allow us to communicate instructions to a computer. Learning to code is an essential skill in the modern world, unlocking endless possibilities for creation and innovation.'
  const SAMPLE_TEXT_ZH =
    '敏捷的棕色狐狸跳过懒惰的狗。编程语言是允许我们向计算机传达指令的工具。学习编码是现代世界的一项基本技能，可以开启无限的创造和创新可能性。'

  const { locale } = useI18n()
  const sampleText = computed(() => {
    return locale.value.startsWith('zh') ? SAMPLE_TEXT_ZH : SAMPLE_TEXT_EN
  })
  const totalChars = computed(() => sampleText.value.length)

  // --- 状态 ---
  const userInput = ref('')
  const currentCharIndex = ref(0)
  const errorsCount = ref(0)
  const startTime = ref<number | null>(null)
  const timer = ref<any>(null)
  const timeLeft = ref(TEST_DURATION)
  const isRunning = ref(false)
  const isFinished = ref(false)
  const inputRef = ref<HTMLInputElement | null>(null)
  const isComposing = ref(false)

  // 【新增】监听输入框是否聚焦，用于控制遮罩层显示
  const isInputFocused = ref(false)

  // --- 统计计算 ---
  const wpm = computed(() => {
    if (!startTime.value || (!isRunning.value && !isFinished.value)) return 0
    const correctChars = Math.max(0, currentCharIndex.value - errorsCount.value)
    const durationSeconds = isFinished.value ? TEST_DURATION : TEST_DURATION - timeLeft.value
    const durationMinutes = durationSeconds / 60
    if (durationMinutes === 0) return 0
    return Math.max(0, Math.round(correctChars / 5 / durationMinutes))
  })

  const accuracy = computed(() => {
    if (currentCharIndex.value === 0) return 100
    const correctChars = Math.max(0, currentCharIndex.value - errorsCount.value)
    return Math.round((correctChars / currentCharIndex.value) * 100)
  })

  // --- 核心方法 ---
  const stopTimer = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  const finishTest = () => {
    stopTimer()
    isRunning.value = false
    isFinished.value = true
    isInputFocused.value = false // 结束时失去焦点状态
    inputRef.value?.blur()
    const message = t('typing_master.finish_message', { wpm: wpm.value, accuracy: accuracy.value })
  }

  const startTest = () => {
    if (isRunning.value) return
    if (isFinished.value) {
      resetTest()
    }
    isRunning.value = true
    isFinished.value = false
    startTime.value = Date.now()

    nextTick(() => {
      inputRef.value?.focus()
    })

    timer.value = setInterval(() => {
      if (timeLeft.value > 1) {
        timeLeft.value--
      } else {
        timeLeft.value = 0
        finishTest()
      }
    }, 1000)
  }

  const resetTest = () => {
    stopTimer()
    isRunning.value = false
    isFinished.value = false
    userInput.value = ''
    currentCharIndex.value = 0
    errorsCount.value = 0
    timeLeft.value = TEST_DURATION
    startTime.value = null
    isComposing.value = false
    // 重置时不强制聚焦，等待用户点击
    isInputFocused.value = false
    inputRef.value?.blur()
  }

  // 输入处理
  const handleInput = (event: Event) => {
    let input = (event.target as HTMLInputElement).value

    // 开始计时逻辑
    if (!isRunning.value && !isFinished.value) {
      startTest()
      if (!isRunning.value) return
    }

    if (isComposing.value) {
      userInput.value = input
      return
    }

    if (input.length < userInput.value.length) {
      currentCharIndex.value = input.length
    }

    if (input.length > totalChars.value) {
      input = input.substring(0, totalChars.value)
    }

    if (input.length > currentCharIndex.value) {
      const newCharIndex = input.length - 1
      const lastChar = input[newCharIndex]
      const expectedChar = sampleText.value[newCharIndex]
      if (lastChar !== expectedChar) {
        errorsCount.value++
      }
      currentCharIndex.value = input.length
    }

    userInput.value = input

    if (currentCharIndex.value === totalChars.value) {
      finishTest()
    }
  }

  const handleCompositionStart = () => {
    isComposing.value = true
  }

  const handleCompositionEnd = (event: Event) => {
    isComposing.value = false
    handleInput(event)
  }

  const renderText = computed(() => {
    const text = sampleText.value
    const input = userInput.value
    const parts = []

    for (let i = 0; i < totalChars.value; i++) {
      const expected = text[i]
      const actual = input[i]
      let className = 'text-gray-400'

      if (i < input.length) {
        if (actual === expected) {
          className = 'text-gray-800 font-medium'
        } else {
          className = 'text-red-500 bg-red-50 rounded px-[1px]'
        }
      }
      parts.push({ char: expected, className })
    }
    return parts
  })

  onBeforeUnmount(() => {
    stopTimer()
  })

  onMounted(() => {
    resetTest()
  })
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    <!-- 头部信息 -->
    <div class="mb-10 text-center">
      <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">{{ $t('typing_master.title') }}</h1>
      <p class="text-gray-500 mt-3 text-lg">{{ $t('typing_master.desc') }}</p>
    </div>

    <div class="space-y-6">
      <!-- 统计面板 -->
      <div
        class="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <!-- 倒计时 -->
        <div class="flex-1 flex flex-col items-center justify-center min-w-[100px]">
          <div class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            {{ $t('typing_master.time_left') }}
          </div>
          <div class="text-4xl font-mono font-bold text-indigo-600 tabular-nums">
            {{ timeLeft }}<span class="text-base ml-1 text-gray-400 font-normal">s</span>
          </div>
        </div>
        <div class="hidden md:block w-px h-12 bg-gray-100"></div>
        <!-- WPM -->
        <div class="flex-1 flex flex-col items-center justify-center min-w-[100px]">
          <div class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            {{ $t('typing_master.wpm') }}
          </div>
          <div class="text-4xl font-mono font-bold text-gray-800 tabular-nums">{{ wpm }}</div>
        </div>
        <div class="hidden md:block w-px h-12 bg-gray-100"></div>
        <!-- 准确率 -->
        <div class="flex-1 flex flex-col items-center justify-center min-w-[100px]">
          <div class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            {{ $t('typing_master.accuracy') }}
          </div>
          <div
            class="text-4xl font-mono font-bold tabular-nums"
            :class="accuracy < 90 ? 'text-orange-500' : 'text-green-600'">
            {{ accuracy }}<span class="text-base ml-1 text-gray-400 font-normal">%</span>
          </div>
        </div>
        <div class="hidden md:block w-px h-12 bg-gray-100"></div>
        <!-- 错误数 -->
        <div class="flex-1 flex flex-col items-center justify-center min-w-[100px]">
          <div class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
            {{ $t('typing_master.errors') }}
          </div>
          <div class="text-4xl font-mono font-bold text-red-500 tabular-nums">{{ errorsCount }}</div>
        </div>
      </div>

      <!-- 主体容器 (注意：relative group) -->
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm relative group">
        <!-- 文本展示区 -->
        <div
          @click="!isFinished ? inputRef?.focus() : null"
          class="text-area relative w-full min-h-[320px] p-8 text-xl leading-9 cursor-text outline-none">
          <!-- 文本渲染 -->
          <div class="select-none pointer-events-none">
            <span v-for="(item, index) in renderText" :key="index" :class="item.className">
              <span :class="{ 'current-char-marker': index === currentCharIndex && isRunning }">
                {{ item.char === ' ' ? '&nbsp;' : item.char }}
              </span>
            </span>
          </div>

          <!-- 输入框 -->
          <input
            ref="inputRef"
            type="text"
            :value="userInput"
            @input="handleInput"
            @focus="isInputFocused = true"
            @blur="isInputFocused = false"
            @compositionstart="handleCompositionStart"
            @compositionend="handleCompositionEnd"
            :disabled="isFinished || timeLeft === 0"
            class="typing-input-handler"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false" />

          <!-- 开始提示遮罩 -->
          <div
            v-if="!isRunning && !isFinished && userInput.length === 0 && !isInputFocused"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer rounded-t-2xl"
            @click="inputRef?.focus()">
            <div
              class="text-indigo-600 text-xl font-bold animate-pulse flex items-center gap-2 transform transition hover:scale-105">
              <span>⌨️</span> 点击此处开始输入...
            </div>
          </div>
        </div>

        <!-- 底部控制栏 -->
        <div class="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <div class="text-sm text-gray-400">
            <!-- 底部左侧留空 -->
          </div>
          <div class="flex space-x-3">
            <button
              @click="resetTest"
              class="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition flex items-center gap-2">
              <span>🔄</span> {{ $t('typing_master.restart') }}
            </button>
          </div>
        </div>

        <!-- 【修复点】：结果结算页 Overlay -->
        <!-- 移到了最外层容器的底部，并增加了 rounded-2xl 以匹配卡片圆角 -->
        <div
          v-if="isFinished"
          class="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in rounded-2xl">
          <div class="bg-indigo-50 rounded-full p-4 mb-4">
            <span class="text-4xl">🏆</span>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">测试完成!</h2>

          <div class="flex items-end gap-2 mb-4">
            <span class="text-6xl font-black text-indigo-600 leading-none">{{ wpm }}</span>
            <span class="text-xl text-gray-500 font-medium mb-1">WPM</span>
          </div>

          <p class="text-gray-600 max-w-md mx-auto mb-8 text-lg">
            {{ $t('typing_master.finish_message', { wpm: wpm, accuracy: accuracy }) }}
          </p>

          <div class="flex gap-4">
            <button
              @click="resetTest"
              class="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
              <span>🔄</span> {{ $t('typing_master.restart') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .typing-input-handler {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    opacity: 0;
    cursor: default;
    caret-color: transparent;
    z-index: 10;
  }

  .current-char-marker {
    position: relative;
  }

  .current-char-marker::after {
    content: '';
    position: absolute;
    left: -1px;
    bottom: 0;
    top: 4px;
    width: 2px;
    background-color: #4f46e5;
    border-radius: 2px;
    animation: blink 1.2s ease-in-out infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
