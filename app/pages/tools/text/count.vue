<template>
  <div class="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- 标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('word.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('word.desc') }}</p>
    </div>

    <!-- 1. 统计卡片区域 (Dashboard) -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <!-- 字符数 (最重要，高亮显示) -->
      <div
        class="bg-emerald-50 border border-emerald-100 p-4 rounded-xl col-span-2 lg:col-span-2 flex flex-col justify-center relative overflow-hidden group">
        <div class="absolute right-0 top-0 opacity-10 text-6xl -mr-4 -mt-2 group-hover:scale-110 transition">🔤</div>
        <div class="text-emerald-600 text-sm font-bold uppercase tracking-wide mb-1">{{ $t('word.characters') }}</div>
        <div class="text-4xl font-mono font-bold text-emerald-700">{{ stats.chars }}</div>
      </div>

      <!-- 其他指标 -->
      <StatCard :label="$t('word.words')" :value="stats.words" />
      <StatCard :label="$t('word.characters_no_space')" :value="stats.charsNoSpace" />
      <StatCard :label="$t('word.paragraphs')" :value="stats.paragraphs" />
      <StatCard :label="$t('word.lines')" :value="stats.lines" />
    </div>

    <!-- 2. 工具栏 -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button @click="toUpperCase" class="btn-secondary text-xs sm:text-sm">
        <span class="font-bold">AA</span> {{ $t('word.uppercase') }}
      </button>
      <button @click="toLowerCase" class="btn-secondary text-xs sm:text-sm">
        <span class="font-bold">aa</span> {{ $t('word.lowercase') }}
      </button>
      <div class="flex-grow"></div>
      <button @click="handleClear" class="text-gray-500 hover:text-red-500 px-3 py-2 text-sm transition">
        {{ $t('word.clear') }}
      </button>
      <button @click="copyText" :disabled="!text" class="btn-primary text-xs sm:text-sm disabled:opacity-50">
        {{ copied ? $t('word.copied') : $t('word.copy') }}
      </button>
    </div>

    <!-- 3. 输入区域 -->
    <div class="relative">
      <textarea
        v-model="text"
        :placeholder="$t('word.placeholder')"
        class="w-full h-[500px] p-6 text-lg text-gray-800 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition resize-y shadow-sm"
        spellcheck="false"></textarea>
      <!-- 底部字节统计 -->
      <div
        class="absolute bottom-4 right-6 text-xs text-gray-400 font-mono bg-white/80 px-2 py-1 rounded backdrop-blur">
        {{ stats.bytes }} Bytes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const text = ref('')
  const copied = ref(false)

  // 统计数据 (计算属性，实时更新)
  const stats = computed(() => {
    const val = text.value

    // 1. 字符数
    const chars = val.length

    // 2. 无空格字符数 (移除所有空白符)
    const charsNoSpace = val.replace(/\s/g, '').length

    // 3. 单词数 (这是一个难点，需要兼顾中英文)
    // 策略：将中文/日文/韩文(CJK)字符替换为空格，然后按空格分割计算英文单词，再把 CJK 字符的数量加回去
    // 或者使用更通用的正则匹配非空内容
    let words = 0
    if (val.trim()) {
      // 简单策略：
      // 匹配 CJK 字符
      const cjk = val.match(/[\u4e00-\u9fa5]/g)
      const cjkCount = cjk ? cjk.length : 0

      // 匹配非 CJK 的单词 (英文、数字等)，按空白分隔
      // 先把 CJK 替换掉，避免干扰英文分词
      const nonCjkStr = val.replace(/[\u4e00-\u9fa5]/g, ' ')
      const nonCjkWords = nonCjkStr
        .trim()
        .split(/\s+/)
        .filter(s => s.length > 0)

      words = cjkCount + nonCjkWords.length
    }

    // 4. 段落 (按双换行符或单换行符算，这里按实际换行符算段落，如果有空行也算分隔)
    // 过滤掉空行
    const paragraphs = val.split(/\n+/).filter(line => line.trim().length > 0).length

    // 5. 行数 (物理行数)
    const lines = val ? val.split(/\n/).length : 0

    // 6. 字节数 (UTF-8)
    const bytes = new Blob([val]).size

    return {
      chars,
      charsNoSpace,
      words,
      paragraphs,
      lines,
      bytes
    }
  })

  // 功能函数
  const toUpperCase = () => {
    text.value = text.value.toUpperCase()
  }
  const toLowerCase = () => {
    text.value = text.value.toLowerCase()
  }
  const handleClear = () => {
    text.value = ''
  }

  const copyText = () => {
    if (!text.value) return
    navigator.clipboard.writeText(text.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  // SEO
  useHead({
    title: t('word.title') + ' - 小宾果',
    meta: [{ name: 'description', content: t('word.desc') }]
  })
</script>

<!-- 定义一个简单的局部组件用于显示卡片 -->
<script lang="ts">
  import { defineComponent, h } from 'vue'

  // 一个极简的函数式组件，只在这里用，不需要新建文件
  const StatCard = defineComponent({
    props: ['label', 'value'],
    render(props) {
      return h(
        'div',
        { class: 'bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col justify-center' },
        [
          h('div', { class: 'text-gray-500 text-xs font-medium uppercase tracking-wide mb-1 truncate' }, props.label),
          h('div', { class: 'text-2xl font-mono font-bold text-gray-800' }, props.value)
        ]
      )
    }
  })
  export default {
    components: { StatCard }
  }
</script>

<style scoped>
  .btn-primary {
    @apply bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-medium shadow-sm;
  }
  .btn-secondary {
    @apply bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-2;
  }
</style>
