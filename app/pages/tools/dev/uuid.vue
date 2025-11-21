<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('uuid.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('uuid.desc') }}</p>
    </div>

    <!-- 控制面板 -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div class="flex flex-wrap items-end gap-6">
        <!-- 数量 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('uuid.count') }}</label>
          <input
            type="number"
            v-model.number="options.count"
            min="1"
            max="100"
            class="w-24 border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border" />
        </div>

        <!-- 选项开关 -->
        <div class="flex items-center gap-4 mb-3">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="options.hyphen"
              class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300" />
            <span class="ml-2 text-sm text-gray-700">{{ $t('uuid.hyphen') }}</span>
          </label>
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="options.uppercase"
              class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300" />
            <span class="ml-2 text-sm text-gray-700">{{ $t('uuid.uppercase') }}</span>
          </label>
        </div>

        <div class="flex-grow"></div>

        <!-- 生成按钮 -->
        <button
          @click="generate"
          class="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2">
          🔄 {{ $t('uuid.generate') }}
        </button>
      </div>
    </div>

    <!-- 结果展示 -->
    <div class="relative">
      <textarea
        :value="result"
        readonly
        class="w-full h-96 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-gray-700"></textarea>
      <button
        @click="copy"
        class="absolute top-4 right-4 bg-white border border-gray-200 text-gray-700 hover:text-emerald-600 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition">
        {{ copied ? '✅ Copied' : '📋 ' + $t('uuid.copy_all') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const options = reactive({
    count: 5,
    hyphen: true,
    uppercase: false
  })

  const result = ref('')
  const copied = ref(false)

  const generate = () => {
    const list = []
    for (let i = 0; i < options.count; i++) {
      // 使用原生 crypto API
      let uuid = crypto.randomUUID()

      if (!options.hyphen) {
        uuid = uuid.replace(/-/g, '')
      }
      if (options.uppercase) {
        uuid = uuid.toUpperCase()
      }
      list.push(uuid)
    }
    result.value = list.join('\n')
  }

  const copy = () => {
    if (!result.value) return
    navigator.clipboard.writeText(result.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  // 初始化时生成一次
  onMounted(generate)

  useHead({ title: t('uuid.title') + ' - NuxtTools' })
</script>
