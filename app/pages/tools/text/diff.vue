<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('diff.title') }}</h1>
      </div>

      <!-- 模式切换 -->
      <div class="flex bg-gray-100 p-1 rounded-lg">
        <button
          v-for="m in ['chars', 'lines', 'json']"
          :key="m"
          @click="mode = m"
          class="px-4 py-1.5 text-sm font-medium rounded-md transition"
          :class="mode === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
          {{ $t('diff.diff_' + (m === 'chars' ? 'char' : m === 'lines' ? 'line' : 'json')) }}
        </button>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div class="flex flex-col">
        <label class="text-sm font-bold text-gray-700 mb-2">{{ $t('diff.left_label') }}</label>
        <textarea
          v-model="oldText"
          class="flex-grow h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          placeholder="Original text..."></textarea>
      </div>
      <div class="flex flex-col">
        <label class="text-sm font-bold text-gray-700 mb-2">{{ $t('diff.right_label') }}</label>
        <textarea
          v-model="newText"
          class="flex-grow h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          placeholder="Modified text..."></textarea>
      </div>
    </div>

    <!-- 结果区 -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
        Diff Result
      </div>

      <div v-if="!diffResult.length" class="p-8 text-center text-gray-400">No changes or empty input</div>

      <!-- 渲染 Diff 结果 -->
      <div v-else class="p-4 font-mono text-sm whitespace-pre-wrap break-all bg-white min-h-[200px]">
        <span
          v-for="(part, index) in diffResult"
          :key="index"
          :class="{
            'bg-red-100 text-red-800 line-through decoration-red-400': part.removed,
            'bg-emerald-100 text-emerald-800': part.added,
            'text-gray-600': !part.added && !part.removed
          }"
          >{{ part.value }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as Diff from 'diff'
  const { t } = useI18n()

  const mode = ref('chars') // chars, lines, json
  const oldText = ref('Hello World\nThis is a test.')
  const newText = ref('Hello Nuxt\nThis is a test.')

  const diffResult = computed(() => {
    if (!oldText.value && !newText.value) return []

    let result = []

    if (mode.value === 'chars') {
      result = Diff.diffChars(oldText.value, newText.value)
    } else if (mode.value === 'lines') {
      result = Diff.diffLines(oldText.value, newText.value)
    } else if (mode.value === 'json') {
      // 尝试格式化 JSON 后再对比
      try {
        const oldObj = JSON.stringify(JSON.parse(oldText.value), null, 2)
        const newObj = JSON.stringify(JSON.parse(newText.value), null, 2)
        // JSON 对比通常用 diffJson，或者用 diffLines 对比格式化后的字符串
        result = Diff.diffJson(JSON.parse(oldText.value), JSON.parse(newText.value))
      } catch (e) {
        // 如果解析失败，退回到行对比
        return [{ value: 'Invalid JSON Input', error: true }]
      }
    }

    return result
  })

  useHead({ title: t('diff.title') + ' - 小宾果' })
</script>

<style scoped>
  /* 优化 line-through 的显示，使其更明显 */
  .line-through {
    text-decoration-thickness: 2px;
  }
</style>
