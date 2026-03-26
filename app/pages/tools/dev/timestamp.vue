<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <!-- 头部导航 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('time.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('time.desc') }}</p>
    </div>

    <!-- 1. 当前时间卡片 (实时跳动) -->
    <div class="bg-gray-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
      <!-- 装饰 -->
      <div class="absolute right-0 top-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>

      <div class="relative z-10 text-center sm:text-left">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div class="text-gray-400 text-sm font-medium mb-1">{{ $t('time.current') }}</div>
            <div class="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-emerald-400">
              {{ nowTs }}
            </div>
          </div>

          <div class="text-center sm:text-right">
            <div class="text-gray-400 text-sm font-medium mb-1">Local Time</div>
            <div class="text-xl sm:text-2xl font-mono text-gray-200">
              {{ nowFormatted }}
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="mt-6 flex justify-center sm:justify-start">
          <button
            @click="toggleTimer"
            class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition"
            :class="
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            ">
            {{ isRunning ? 'STOP ⏸' : 'START ▶' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 2. 核心转换区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- 左侧：时间戳 -> 日期 -->
      <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-xl">📅</span>
          {{ $t('time.ts_to_date') }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('time.timestamp_input') }}</label>
            <div class="flex gap-2">
              <input
                v-model="tsInput"
                type="text"
                placeholder="167888..."
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2" />
              <button
                @click="convertTsToDate"
                class="bg-emerald-600 text-white px-4 rounded-md hover:bg-emerald-700 transition">
                {{ $t('time.convert') }}
              </button>
            </div>
            <div class="flex gap-2 mt-2">
              <!-- 快捷填入当前时间 -->
              <button @click="fillCurrentTs" class="text-xs text-blue-500 hover:underline">Current (s)</button>
              <button @click="fillCurrentTsMs" class="text-xs text-blue-500 hover:underline">Current (ms)</button>
            </div>
          </div>

          <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div class="text-xs text-gray-500 mb-1">{{ $t('time.date_result') }}</div>
            <div class="font-mono text-gray-800 font-medium break-all select-all">
              {{ dateResult || '-' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：日期 -> 时间戳 -->
      <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-xl">⏱️</span>
          {{ $t('time.date_to_ts') }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('time.date_input') }}</label>
            <!-- 使用 type="datetime-local" 提供原生选择器 -->
            <div class="flex gap-2">
              <input
                v-model="dateInput"
                type="datetime-local"
                step="1"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2" />
              <button
                @click="convertDateToTs"
                class="bg-purple-600 text-white px-4 rounded-md hover:bg-purple-700 transition">
                {{ $t('time.convert') }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div class="text-xs text-gray-500 mb-1">{{ $t('time.unit_s') }}</div>
              <div
                class="font-mono text-gray-800 font-medium select-all cursor-pointer hover:text-emerald-600"
                @click="copy(tsResultS)">
                {{ tsResultS || '-' }}
              </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div class="text-xs text-gray-500 mb-1">{{ $t('time.unit_ms') }}</div>
              <div
                class="font-mono text-gray-800 font-medium select-all cursor-pointer hover:text-emerald-600"
                @click="copy(tsResultMs)">
                {{ tsResultMs || '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  const { copyToClipboard } = useCopy()
  const { t } = useI18n()

  // -----------------------------------
  // 1. 顶部时钟逻辑
  // -----------------------------------
  const now = ref(dayjs())
  const isRunning = ref(true)
  let timer: NodeJS.Timer | null = null

  const updateTime = () => {
    now.value = dayjs()
  }

  // 开启定时器
  onMounted(() => {
    updateTime()
    timer = setInterval(updateTime, 1000)
    // 初始化右侧日期输入框为当前时间
    dateInput.value = dayjs().format('YYYY-MM-DDTHH:mm:ss')
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const toggleTimer = () => {
    if (isRunning.value) {
      if (timer) clearInterval(timer)
      isRunning.value = false
    } else {
      updateTime()
      timer = setInterval(updateTime, 1000)
      isRunning.value = true
    }
  }

  const nowTs = computed(() => Math.floor(now.value.valueOf() / 1000))
  const nowFormatted = computed(() => now.value.format('YYYY-MM-DD HH:mm:ss'))

  // -----------------------------------
  // 2. 时间戳 -> 日期
  // -----------------------------------
  const tsInput = ref('')
  const dateResult = ref('')

  const fillCurrentTs = () => {
    tsInput.value = Math.floor(Date.now() / 1000).toString()
  }
  const fillCurrentTsMs = () => {
    tsInput.value = Date.now().toString()
  }

  const convertTsToDate = () => {
    if (!tsInput.value) return
    let ts = parseInt(tsInput.value)

    // 简单判断：如果是 10 位数，说明是秒，需要乘 1000
    // 如果是 13 位数，说明是毫秒
    if (tsInput.value.length === 10) {
      ts = ts * 1000
    }

    const d = dayjs(ts)
    if (d.isValid()) {
      dateResult.value = d.format('YYYY-MM-DD HH:mm:ss')
    } else {
      dateResult.value = 'Invalid Date'
    }
  }

  // -----------------------------------
  // 3. 日期 -> 时间戳
  // -----------------------------------
  const dateInput = ref('')
  const tsResultS = ref('')
  const tsResultMs = ref('')

  const convertDateToTs = () => {
    if (!dateInput.value) return
    const d = dayjs(dateInput.value)

    if (d.isValid()) {
      tsResultMs.value = d.valueOf().toString()
      tsResultS.value = Math.floor(d.valueOf() / 1000).toString()
    }
  }

  // -----------------------------------
  // 通用
  // -----------------------------------
  const copy = (text: string) => {
    if (text && text !== '-') {
      // 可以加个 Toast 提示，这里简单处理
      copyToClipboard(text)
    }
  }

  // SEO
  useHead({
    title: t('time.title') + ' - 小宾果',
    meta: [{ name: 'description', content: t('time.desc') }]
  })
</script>
