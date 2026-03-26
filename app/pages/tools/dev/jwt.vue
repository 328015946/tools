<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('jwt.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('jwt.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：输入区 -->
      <div class="lg:col-span-1 space-y-4">
        <div>
          <div class="flex justify-between mb-2">
            <label class="text-sm font-bold text-gray-700">{{ $t('jwt.input_label') }}</label>
            <span v-if="token" :class="isValid ? 'text-emerald-600' : 'text-red-500'" class="text-xs font-bold">
              {{ isValid ? $t('jwt.valid') : $t('jwt.invalid') }}
            </span>
          </div>
          <textarea
            v-model="token"
            class="w-full h-96 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm break-all font-mono shadow-sm"
            :placeholder="$t('jwt.placeholder')"></textarea>
        </div>
      </div>

      <!-- 右侧：解码结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 状态卡片 (如果有 exp 字段才显示) -->
        <div v-if="isValid && expInfo" class="grid grid-cols-2 gap-4">
          <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div class="text-xs text-gray-500 uppercase font-bold mb-1">{{ $t('jwt.exp_time') }}</div>
            <div class="font-mono text-gray-800">{{ expInfo.dateStr }}</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div class="text-xs text-gray-500 uppercase font-bold mb-1">{{ $t('jwt.exp_status') }}</div>
            <div
              class="font-bold inline-block px-2 py-0.5 rounded text-sm"
              :class="expInfo.isExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'">
              {{ expInfo.isExpired ? $t('jwt.expired') : $t('jwt.active') }}
            </div>
          </div>
        </div>

        <!-- 头部 Header -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
            {{ $t('jwt.header') }}
          </div>
          <div class="p-0">
            <!-- 这里复用之前的 CodeEditor 样式，或者直接用 pre -->
            <pre class="p-4 text-sm text-purple-600 font-mono overflow-x-auto">{{ headerJson || '{}' }}</pre>
          </div>
        </div>

        <!-- 载荷 Payload -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
            {{ $t('jwt.payload') }}
          </div>
          <div class="p-0">
            <pre class="p-4 text-sm text-emerald-600 font-mono overflow-x-auto">{{ payloadJson || '{}' }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { jwtDecode } from 'jwt-decode'
  import dayjs from 'dayjs' // 复用之前的时间库

  const { t } = useI18n()

  const token = ref('')
  const isValid = ref(false)
  const headerJson = ref('')
  const payloadJson = ref('')

  // 过期信息计算
  const expInfo = computed(() => {
    if (!payloadJson.value) return null
    try {
      const payload = JSON.parse(payloadJson.value)
      if (payload.exp) {
        const exp = payload.exp * 1000 // 转毫秒
        return {
          dateStr: dayjs(exp).format('YYYY-MM-DD HH:mm:ss'),
          isExpired: Date.now() > exp
        }
      }
      return null
    } catch (e) {
      return null
    }
  })

  const decode = () => {
    if (!token.value.trim()) {
      isValid.value = false
      headerJson.value = ''
      payloadJson.value = ''
      return
    }

    try {
      // 1. 解码 Payload
      const decodedPayload = jwtDecode(token.value)
      payloadJson.value = JSON.stringify(decodedPayload, null, 2)

      // 2. 解码 Header (jwt-decode 支持传参 {header: true})
      const decodedHeader = jwtDecode(token.value, { header: true })
      headerJson.value = JSON.stringify(decodedHeader, null, 2)

      isValid.value = true
    } catch (error) {
      isValid.value = false
      // 出错时不清除显示，或者显示错误信息
      headerJson.value = 'Error decoding header'
      payloadJson.value = 'Error decoding payload'
    }
  }

  watch(token, decode)

  useHead({ title: t('jwt.title') + ' - 小宾果' })
</script>
