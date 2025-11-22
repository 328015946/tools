<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- 标题区域 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('hash.title') }}</h1>
      </div>
      <!-- 可以在这里放个清空按钮 -->
      <button @click="input = ''" class="text-sm text-gray-500 hover:text-red-500 px-3 py-1">
        {{ $t('hash.clear') }}
      </button>
    </div>

    <!-- 核心布局：大屏双栏，小屏单栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- 左侧：输入 & 配置 -->
      <div class="flex flex-col gap-4 h-full">
        <!-- 配置栏 (放在输入框上面，方便操作) -->
        <div class="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex flex-wrap items-center gap-4">
          <!-- 大写开关 -->
          <label class="flex items-center cursor-pointer select-none hover:bg-gray-50 px-2 py-1 rounded transition">
            <input
              type="checkbox"
              v-model="isUppercase"
              class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300" />
            <span class="ml-2 text-sm text-gray-700 font-medium">{{ $t('hash.uppercase') }}</span>
          </label>

          <div class="h-4 w-px bg-gray-300"></div>

          <!-- HMAC 开关 -->
          <label class="flex items-center cursor-pointer select-none hover:bg-gray-50 px-2 py-1 rounded transition">
            <input
              type="checkbox"
              v-model="isHmac"
              class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300" />
            <span class="ml-2 text-sm text-gray-700 font-medium">{{ $t('hash.hmac_mode') }}</span>
          </label>

          <!-- Key 输入 (仅 HMAC 模式显示) -->
          <div v-if="isHmac" class="flex-grow flex items-center gap-2 animate-fade-in ml-2">
            <input
              v-model="hmacKey"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-yellow-50"
              :placeholder="$t('hash.key_label')" />
          </div>
        </div>

        <!-- 输入框 (高度拉满) -->
        <div class="flex-grow relative group">
          <textarea
            v-model="input"
            class="w-full h-[500px] lg:h-[600px] p-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-base shadow-sm transition"
            :placeholder="$t('hash.placeholder')"></textarea>
          <!-- 字符统计 -->
          <div class="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded backdrop-blur">
            {{ input.length }} chars
          </div>
        </div>
      </div>

      <!-- 右侧：结果列表 -->
      <div class="flex flex-col gap-4 h-[600px] lg:overflow-y-auto pr-1 custom-scrollbar">
        <!-- 循环渲染结果卡片 -->
        <div
          v-for="(res, type) in results"
          :key="type"
          class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <!-- 卡片头部 -->
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-800">{{ type }}</span>
              <!-- 这里的 Tag 颜色根据不同类型稍微区分一下 -->
              <span v-if="type.includes('MD5')" class="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded"
                >128 bit</span
              >
              <span
                v-else-if="type.includes('SHA-1')"
                class="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded"
                >160 bit</span
              >
              <span
                v-else-if="type.includes('256')"
                class="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded"
                >256 bit</span
              >
              <span v-else class="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">512 bit</span>
            </div>
            <button
              @click="handleCopy(formatResult(res), type)"
              class="text-xs flex items-center gap-1 border px-2 py-1 rounded transition-all duration-200"
              :class="
                copiedType === type
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                  : 'border-gray-200 text-gray-500 bg-white hover:text-emerald-600 hover:border-emerald-300'
              ">
              <!-- 状态切换动画 -->
              <template v-if="copiedType === type">
                <span>✅</span>
                <span class="font-medium">{{ $t('json.copied') }}</span>
              </template>
              <template v-else>
                <span>📋</span>
                <span>{{ $t('hash.copy') }}</span>
              </template>
            </button>
          </div>

          <!-- 卡片内容 -->
          <div class="p-4 bg-white rounded-b-xl group relative">
            <code class="block font-mono text-sm text-gray-700 break-all leading-relaxed">
              {{ formatResult(res) || 'Waiting for input...' }}
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import CryptoJS from 'crypto-js'

  const { t } = useI18n()
  const { copyToClipboard } = useCopy()
  const input = ref('')
  const isUppercase = ref(false)
  const isHmac = ref(false)
  const hmacKey = ref('')
  const copiedKey = ref<string | null>(null)

  // 实时计算
  const results = computed(() => {
    const text = input.value
    const key = hmacKey.value

    // 即使为空也显示卡片，只是内容为空
    if (isHmac.value) {
      return {
        'HMAC-MD5': text ? CryptoJS.HmacMD5(text, key).toString() : '',
        'HMAC-SHA1': text ? CryptoJS.HmacSHA1(text, key).toString() : '',
        'HMAC-SHA256': text ? CryptoJS.HmacSHA256(text, key).toString() : '',
        'HMAC-SHA512': text ? CryptoJS.HmacSHA512(text, key).toString() : ''
      }
    } else {
      return {
        MD5: text ? CryptoJS.MD5(text).toString() : '',
        'SHA-1': text ? CryptoJS.SHA1(text).toString() : '',
        'SHA-256': text ? CryptoJS.SHA256(text).toString() : '',
        'SHA-512': text ? CryptoJS.SHA512(text).toString() : ''
      }
    }
  })

  const formatResult = (str: string) => {
    return isUppercase.value ? str.toUpperCase() : str
  }

  const copiedType = ref<string | null>(null)

  // 修改复制函数，接收两个参数：文本内容 和 类型(MD5/SHA1...)
  const handleCopy = (text: string, type: string) => {
    if (!text) return

    copyToClipboard(text, false)

    // 设置当前复制的类型，触发 UI 变化
    copiedType.value = type

    // 1.5秒后恢复原状
    setTimeout(() => {
      copiedType.value = null
    }, 1500)
  }
  // 修正后的 copy 逻辑，配合模板里的 copy(text, type) -- 需要修改模板传参
  // 实际上上面的模板我写的是 copy(formatResult(res))，这有点难定位是哪个按钮。
  // 让我们优化一下模板里的按钮点击事件：

  useHead({ title: t('hash.title') + ' - NuxtTools' })
</script>

<style scoped>
  /* 自定义滚动条，让右侧看起来更精致 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #d1d5db;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-5px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
