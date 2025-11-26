<script setup lang="ts">
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { toast } from 'vue-sonner'
  const { t } = useI18n()

  // ... (SEO and other refs remain the same)

  // TTS API 状态
  const isSupported = ref(false)
  const isSpeaking = ref(false)
  const textInput = ref('欢迎使用我的文本转语音工具，您可以调整语速和音高。')
  const currentUtterance = ref<SpeechSynthesisUtterance | null>(null)
  const voices = ref<SpeechSynthesisVoice[]>([])
  const selectedVoice = ref<string>('')
  const rate = ref(1.0)
  const pitch = ref(1.0)

  // --- 声音加载和初始化 ---
  const loadVoices = () => {
    voices.value = window.speechSynthesis.getVoices()
    if (voices.value.length && !selectedVoice.value) {
      // 尝试默认选择中文或英文
      const defaultVoice = voices.value.find(v => v.lang.startsWith('zh') || v.lang.startsWith('en'))
      selectedVoice.value = defaultVoice ? defaultVoice.name : voices.value[0].name
    }
  }

  onMounted(() => {
    if ('speechSynthesis' in window) {
      isSupported.value = true

      // 尝试立即加载，并监听异步变化
      loadVoices()
      if (voices.value.length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    } else {
      isSupported.value = false
    }
  })

  onBeforeUnmount(() => {
    stopSpeaking()
  })

  const stopSpeaking = () => {
    if (isSpeaking.value) {
      window.speechSynthesis.cancel()
      isSpeaking.value = false
      currentUtterance.value = null
    }
  }

  // --- 核心功能 ---
  const speak = () => {
    if (!isSupported.value || !textInput.value) return

    // 1. 停止任何正在进行的朗读
    stopSpeaking()

    // 2. 关键检查：确保至少有一个声音
    if (voices.value.length === 0) {
      console.warn('TTS: Voices not yet loaded or available.')
      // 可以给用户一个提示
      toast.warning(t('speech.no_voices_available') || '声音未加载完成，请稍候再试。')
      return
    }

    const utterance = new SpeechSynthesisUtterance(textInput.value)

    const voice = voices.value.find(v => v.name === selectedVoice.value)
    if (voice) {
      utterance.voice = voice
    } else {
      // 如果所选声音未找到（可能因为异步加载问题），使用默认声音
      console.warn('Selected voice not found, using default.')
    }

    utterance.rate = rate.value
    utterance.pitch = pitch.value

    utterance.onstart = () => {
      isSpeaking.value = true
    }
    utterance.onend = () => {
      isSpeaking.value = false
      currentUtterance.value = null
    }
    // 增强错误处理
    utterance.onerror = event => {
      console.error('Speech Synthesis Error:', event.error)
      isSpeaking.value = false
      toast.error(
        t('speech.error_message', { error: event.error }) || `TTS 发生错误: ${event.error}. 请尝试更换声音或检查文本。`
      )
    }

    try {
      window.speechSynthesis.speak(utterance)
      currentUtterance.value = utterance
    } catch (e) {
      console.error('Failed to call speechSynthesis.speak():', e)
      isSpeaking.value = false
      toast.error(t('speech.error_generic') || '朗读调用失败，请检查浏览器设置。')
    }
  }

  // ... (Template remains the same, except for the new alert key)
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- 头部信息 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('speech.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('speech.desc') }}</p>
    </div>

    <div v-if="!isSupported" class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {{ $t('speech.browser_unsupport') }}
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 1. 控制区 (左侧) -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-6">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ $t('settings') }}
          </h2>

          <!-- 声音选择 -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700">{{ $t('speech.voice_select') }}</label>
            <select
              v-model="selectedVoice"
              class="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
              <option v-for="voice in voices" :key="voice.name" :value="voice.name">
                {{ voice.name }} ({{ voice.lang }})
              </option>
            </select>
          </div>

          <!-- 语速 (Rate) -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700"
              >{{ $t('speech.rate') }} ({{ rate.toFixed(1) }})</label
            >
            <input
              type="range"
              v-model.number="rate"
              :min="0.1"
              :max="10"
              :step="0.1"
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider-custom" />
          </div>

          <!-- 音高 (Pitch) -->
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700"
              >{{ $t('speech.pitch') }} ({{ pitch.toFixed(1) }})</label
            >
            <input
              type="range"
              v-model.number="pitch"
              :min="0"
              :max="2"
              :step="0.1"
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider-custom" />
          </div>
        </div>
      </div>

      <!-- 2. 文本输入和操作区 (右侧) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-4">
          <h2 class="text-xl font-semibold text-gray-800">
            {{ $t('speech.input_text') }}
          </h2>

          <textarea
            v-model="textInput"
            rows="8"
            class="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="输入您想要朗读的文本..."></textarea>

          <div class="flex space-x-3">
            <button
              @click="speak"
              :disabled="!textInput || isSpeaking"
              class="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <span class="text-base leading-none">🔊</span>
              {{ isSpeaking ? '朗读中...' : $t('speech.speak') }}
            </button>
            <button
              @click="stopSpeaking"
              :disabled="!isSpeaking"
              class="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <span class="text-base leading-none">⏹️</span>
              {{ $t('speech.stop') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* 确保滑块样式与 BMI 页面或您的主题一致 */
  .range-slider-custom {
    -webkit-appearance: none;
    height: 6px;
    background: #e0e0e0;
  }
  .range-slider-custom::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5; /* indigo-600 */
    cursor: pointer;
  }
  .range-slider-custom::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5; /* indigo-600 */
    cursor: pointer;
    border: none;
  }
</style>
