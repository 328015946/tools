<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('regex.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('regex.desc') }}</p>
    </div>

    <div class="space-y-6">
      <!-- 正则输入 -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div class="flex gap-2 items-center mb-2">
          <span class="text-xl font-mono text-gray-400">/</span>
          <input
            v-model="regexStr"
            type="text"
            class="flex-grow p-2 font-mono text-lg border-b-2 border-gray-200 focus:border-emerald-500 outline-none bg-transparent transition"
            placeholder="[a-z]+" />
          <span class="text-xl font-mono text-gray-400">/</span>
          <input
            v-model="flags"
            type="text"
            class="w-16 p-2 font-mono text-lg border-b-2 border-gray-200 focus:border-emerald-500 outline-none bg-transparent transition"
            placeholder="gm" />
        </div>
        <div class="flex gap-2 text-xs text-gray-500 mt-2">
          <span class="bg-gray-100 px-2 py-1 rounded">g: Global</span>
          <span class="bg-gray-100 px-2 py-1 rounded">i: Case Insensitive</span>
          <span class="bg-gray-100 px-2 py-1 rounded">m: Multiline</span>
        </div>
        <div v-if="errorMsg" class="text-red-500 text-sm mt-2 font-medium">⚠️ {{ errorMsg }}</div>
      </div>

      <!-- 结果展示 (分栏) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 测试文本 -->
        <div class="flex flex-col">
          <label class="text-sm font-bold text-gray-700 mb-2">{{ $t('regex.text_label') }}</label>
          <textarea
            v-model="testText"
            class="h-64 p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
            placeholder="Paste your text here..."></textarea>
        </div>

        <!-- 匹配结果 (高亮) -->
        <div class="flex flex-col">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-bold text-gray-700">{{ $t('regex.match_result') }}</label>
            <span v-if="matchCount >= 0" class="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
              {{ $t('regex.count', { n: matchCount }) }}
            </span>
          </div>

          <!-- 高亮容器 -->
          <div
            class="h-64 p-4 bg-white border border-gray-200 rounded-xl font-mono text-sm overflow-auto whitespace-pre-wrap break-all custom-highlight"
            v-html="highlightedHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const regexStr = ref('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}') // 默认邮箱正则
  const flags = ref('gm')
  const testText = ref('Hello user@example.com, please contact support@test.org for help.')
  const errorMsg = ref('')

  // 核心高亮逻辑
  const highlightedHtml = computed(() => {
    if (!regexStr.value || !testText.value) return escapeHtml(testText.value)

    try {
      errorMsg.value = ''
      const re = new RegExp(regexStr.value, flags.value)

      // 使用 replace 回调进行高亮处理
      // 注意：为了安全，需要先转义 HTML，然后再加 <mark>
      // 但 replace 操作在转义后的文本上很难做，简单起见：
      // 我们假设用户输入的是普通文本。更严谨的做法是把字符串切片。

      // 简易实现：直接替换 (可能会有 XSS 风险如果正则包含 Group，但在工具站场景可控)
      // 为了安全，我们先对原始文本做转义
      let safeText = escapeHtml(testText.value)

      // 如果没有全局标志 g，只替换第一个
      // 这里为了演示效果，我们重新构建正则，尝试匹配

      // 更好的高亮算法：matchAll 获取所有位置 -> 切片 -> 拼接
      const matches = [...testText.value.matchAll(re)]
      if (matches.length === 0) return safeText

      let result = ''
      let lastIndex = 0

      matches.forEach(match => {
        const start = match.index!
        const end = start + match[0].length

        // 添加未匹配部分
        result += escapeHtml(testText.value.slice(lastIndex, start))
        // 添加匹配部分 (加高亮)
        result += `<mark class="bg-emerald-200 text-emerald-900 rounded px-0.5 border-b-2 border-emerald-500">${escapeHtml(
          match[0]
        )}</mark>`

        lastIndex = end
      })

      // 添加剩余部分
      result += escapeHtml(testText.value.slice(lastIndex))
      return result
    } catch (e: any) {
      errorMsg.value = e.message
      return escapeHtml(testText.value)
    }
  })

  const matchCount = computed(() => {
    try {
      const re = new RegExp(regexStr.value, flags.value)
      const matches = testText.value.match(re)
      return matches ? matches.length : 0
    } catch (e) {
      return 0
    }
  })

  // 简单的 HTML 转义
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  useHead({ title: t('regex.title') + ' - 小宾果' })
</script>

<style scoped>
  /* mark 样式已经在 class 里写了 Tailwind 类，这里保留默认 */
</style>
