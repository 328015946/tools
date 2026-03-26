<template>
  <div class="max-w-3xl mx-auto py-12 px-4">
    <!-- 标题 -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('pwd.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('pwd.desc') }}</p>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <!-- 1. 结果展示区 (深色背景) -->
      <div class="bg-gray-900 p-8 text-center relative group">
        <div class="text-4xl sm:text-5xl font-mono font-bold text-emerald-400 break-all tracking-wider min-h-[3.5rem]">
          {{ password }}
        </div>

        <!-- 强度条 -->
        <div class="mt-6 flex items-center justify-center gap-2">
          <div
            class="h-2 w-16 rounded-full transition-colors duration-500"
            :class="strengthIdx >= 0 ? strengthColor : 'bg-gray-700'"></div>
          <div
            class="h-2 w-16 rounded-full transition-colors duration-500"
            :class="strengthIdx >= 1 ? strengthColor : 'bg-gray-700'"></div>
          <div
            class="h-2 w-16 rounded-full transition-colors duration-500"
            :class="strengthIdx >= 2 ? strengthColor : 'bg-gray-700'"></div>
          <span class="text-xs text-gray-400 ml-2 uppercase font-bold">{{ strengthText }}</span>
        </div>

        <!-- 复制按钮 (悬浮或点击) -->
        <button
          @click="copy"
          class="absolute top-4 right-4 text-gray-500 hover:text-white transition p-2 rounded-lg hover:bg-gray-800"
          :title="$t('pwd.copy')">
          <span v-if="copied">✅</span>
          <span v-else>📋</span>
        </button>
      </div>

      <!-- 2. 控制面板 -->
      <div class="p-8">
        <!-- 长度滑块 -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-2">
            <label class="font-bold text-gray-700">{{ $t('pwd.length') }}</label>
            <span class="text-xl font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{{
              length
            }}</span>
          </div>
          <input
            type="range"
            v-model.number="length"
            min="6"
            max="64"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- 选项开关网格 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <label
            class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition select-none">
            <input
              type="checkbox"
              v-model="opt.uppercase"
              class="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-3 font-medium text-gray-700">{{ $t('pwd.opt_uppercase') }} (ABC)</span>
          </label>

          <label
            class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition select-none">
            <input
              type="checkbox"
              v-model="opt.lowercase"
              class="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-3 font-medium text-gray-700">{{ $t('pwd.opt_lowercase') }} (abc)</span>
          </label>

          <label
            class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition select-none">
            <input
              type="checkbox"
              v-model="opt.numbers"
              class="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-3 font-medium text-gray-700">{{ $t('pwd.opt_numbers') }} (123)</span>
          </label>

          <label
            class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition select-none">
            <input
              type="checkbox"
              v-model="opt.symbols"
              class="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-3 font-medium text-gray-700">{{ $t('pwd.opt_symbols') }} (!@#)</span>
          </label>

          <label
            class="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition select-none sm:col-span-2">
            <input
              type="checkbox"
              v-model="opt.exclude"
              class="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-3 font-medium text-gray-700">{{ $t('pwd.opt_exclude') }}</span>
          </label>
        </div>

        <!-- 生成按钮 -->
        <button
          @click="generate"
          class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition transform active:scale-[0.99]">
          🔄 {{ $t('pwd.generate') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const length = ref(16)
  const password = ref('')
  const copied = ref(false)

  const opt = reactive({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    exclude: false
  })

  // 字符集
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    symbol: '!@#$%^&*()_+~`|}{[]:;?><,./-='
  }

  // 核心生成逻辑
  const generate = () => {
    let pool = ''
    if (opt.uppercase) pool += chars.upper
    if (opt.lowercase) pool += chars.lower
    if (opt.numbers) pool += chars.number
    if (opt.symbols) pool += chars.symbol

    // 排除混淆
    if (opt.exclude) {
      pool = pool.replace(/[1lI0O]/g, '')
    }

    // 至少选一个
    if (!pool) {
      password.value = '???'
      return
    }

    let res = ''
    // 确保每种选中的类型至少出现一次（增强安全性）
    // 这里为了简单，采用全随机，对于前端工具足够了
    for (let i = 0; i < length.value; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length)
      res += pool[randomIndex]
    }
    password.value = res
  }

  // 简单的强度评估
  const strengthIdx = computed(() => {
    let score = 0
    if (length.value > 8) score++
    if (length.value > 12) score++
    if (opt.numbers && opt.symbols) score++
    return Math.min(score, 2) // 0, 1, 2
  })

  const strengthText = computed(() => {
    const arr = ['str_weak', 'str_medium', 'str_strong']
    return t('pwd.' + arr[strengthIdx.value])
  })

  const strengthColor = computed(() => {
    if (strengthIdx.value === 0) return 'bg-red-500'
    if (strengthIdx.value === 1) return 'bg-yellow-500'
    return 'bg-emerald-500'
  })

  const copy = () => {
    navigator.clipboard.writeText(password.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  // 监听变化自动生成
  watch([length, opt], generate, { deep: true })

  onMounted(generate)

  useHead({ title: t('pwd.title') + ' - 小宾果' })
</script>
