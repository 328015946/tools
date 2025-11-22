<template>
  <div class="max-w-4xl mx-auto py-10 px-4">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('currency.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('currency.desc') }}</p>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
      <!-- 输入与选择 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
        <!-- 金额 -->
        <div class="md:col-span-1">
          <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('currency.amount') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              v-model.number="amount"
              class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              @input="debouncedFetch" />
          </div>
        </div>

        <!-- From -->
        <div class="md:col-span-1">
          <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('currency.from') }}</label>
          <select
            v-model="fromCurrency"
            @change="fetchRate"
            class="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-emerald-500 font-medium">
            <option v-for="c in currencies" :key="c" :value="c">
              {{ c }} - {{ $t('currency.' + c.toLowerCase()) }}
            </option>
          </select>
        </div>

        <!-- To -->
        <div class="md:col-span-1 relative">
          <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('currency.to') }}</label>
          <select
            v-model="toCurrency"
            @change="fetchRate"
            class="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-emerald-500 font-medium">
            <option v-for="c in currencies" :key="c" :value="c">
              {{ c }} - {{ $t('currency.' + c.toLowerCase()) }}
            </option>
          </select>

          <!-- 交换按钮 (绝对定位在两个框中间) -->
          <button
            @click="swap"
            class="absolute -left-5 top-9 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition z-10 hidden md:block"
            :title="$t('currency.swap')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 结果显示 -->
      <div class="bg-gray-50 rounded-xl p-6 text-center relative overflow-hidden">
        <div v-if="loading" class="absolute inset-0 bg-gray-50/80 flex items-center justify-center z-10">
          <div class="animate-spin h-8 w-8 border-4 border-gray-300 border-t-emerald-500 rounded-full"></div>
        </div>

        <div class="text-sm text-gray-500 font-medium mb-1">{{ amount }} {{ fromCurrency }} =</div>
        <div class="text-4xl sm:text-5xl font-bold text-emerald-600 tracking-tight">
          {{ result ? result.toFixed(2) : '...' }}
          <span class="text-xl text-emerald-400 ml-1">{{ toCurrency }}</span>
        </div>

        <div class="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <span>1 {{ fromCurrency }} ≈ {{ rate ? rate.toFixed(4) : '...' }} {{ toCurrency }}</span>
          <span v-if="updateDate">{{ $t('currency.update_time') }}: {{ updateDate }}</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMsg" class="mt-4 text-center text-red-500 text-sm">⚠️ {{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const amount = ref(100)
  const fromCurrency = ref('USD')
  const toCurrency = ref('CNY')
  const result = ref(0)
  const rate = ref(0)
  const updateDate = ref('')
  const loading = ref(false)
  const errorMsg = ref('')

  // 常用货币列表 (API 支持更多，这里列出最常用的)
  const currencies = ['CNY', 'USD', 'EUR', 'JPY', 'HKD', 'GBP', 'AUD', 'CAD', 'KRW', 'THB']

  let timer: NodeJS.Timeout

  const fetchRate = async () => {
    if (fromCurrency.value === toCurrency.value) {
      result.value = amount.value
      rate.value = 1
      return
    }

    loading.value = true
    errorMsg.value = ''

    try {
      // 调用免费 API
      // Frankfurter API (https://www.frankfurter.app/docs/)
      const res = await fetch(
        `https://api.frankfurter.app/latest?amount=${amount.value}&from=${fromCurrency.value}&to=${toCurrency.value}`
      )

      if (!res.ok) throw new Error('API Error')

      const data = await res.json()

      // data.rates 是一个对象 { CNY: 724.5 }
      if (data.rates && data.rates[toCurrency.value]) {
        result.value = data.rates[toCurrency.value]
        rate.value = result.value / amount.value
        updateDate.value = data.date
      } else {
        throw new Error('Rate not found')
      }
    } catch (e) {
      console.error(e)
      errorMsg.value = t('currency.error')
    } finally {
      loading.value = false
    }
  }

  // 防抖：输入金额时，不必频繁请求，API 有时候会限制频率
  const debouncedFetch = () => {
    // 其实 Frankfurter 支持 amount 参数直接计算
    // 但为了流畅，我们可以本地计算 (amount * rate)，只有切换币种时才请求 rate
    // 这里为了简单，每次都请求（或者你可以优化为只请求 rate=1 的汇率，然后在前端乘）

    // 优化策略：先本地算，如果 rate 还没拿到，再请求
    if (rate.value > 0 && fromCurrency.value !== toCurrency.value) {
      result.value = amount.value * rate.value
    } else {
      clearTimeout(timer)
      timer = setTimeout(fetchRate, 500)
    }
  }

  const swap = () => {
    const temp = fromCurrency.value
    fromCurrency.value = toCurrency.value
    toCurrency.value = temp
    fetchRate()
  }

  onMounted(fetchRate)

  useHead({ title: t('currency.title') + ' - NuxtTools' })
</script>
