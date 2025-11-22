<template>
  <div class="h-[calc(100vh-64px)] flex flex-col bg-white">
    <!-- 1. 工具栏 -->
    <div class="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-bold text-gray-800 hidden sm:block">{{ $t('md.title') }}</h1>

        <!-- 移动端切换 Tab -->
        <div class="flex sm:hidden bg-gray-200 rounded-lg p-1 text-xs font-medium">
          <button
            @click="activeTab = 'edit'"
            class="px-3 py-1 rounded-md transition"
            :class="activeTab === 'edit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'">
            Edit
          </button>
          <button
            @click="activeTab = 'preview'"
            class="px-3 py-1 rounded-md transition"
            :class="activeTab === 'preview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'">
            View
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="copyHtml" class="btn-secondary text-xs sm:text-sm">
          {{ $t('md.copy_html') }}
        </button>
        <button @click="clear" class="text-gray-400 hover:text-red-500 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 2. 主体区域 -->
    <div class="flex-grow flex overflow-hidden relative">
      <!-- 左侧：编辑区 -->
      <div
        class="w-full sm:w-1/2 h-full border-r border-gray-200 flex flex-col"
        :class="{ 'hidden sm:flex': activeTab === 'preview' }">
        <!-- 顶部标签 -->
        <div
          class="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100 flex justify-between">
          {{ $t('md.write') }}
          <span class="font-mono font-normal">{{ text.length }} chars</span>
        </div>

        <textarea
          v-model="text"
          class="w-full h-full p-4 sm:p-6 resize-none focus:outline-none font-mono text-sm sm:text-base text-gray-800 leading-relaxed"
          spellcheck="false"></textarea>
      </div>

      <!-- 右侧：预览区 -->
      <div class="w-full sm:w-1/2 h-full bg-white flex flex-col" :class="{ 'hidden sm:flex': activeTab === 'edit' }">
        <div
          class="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
          {{ $t('md.preview') }}
        </div>

        <div
          class="flex-grow overflow-y-auto p-4 sm:p-8 prose prose-emerald prose-sm sm:prose-base max-w-none"
          v-html="htmlContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  const { copyToClipboard } = useCopy()
  const { t } = useI18n()

  // 状态
  const text = ref(t('md.sample'))
  const activeTab = ref<'edit' | 'preview'>('edit')

  // 实时计算 HTML
  const htmlContent = computed(() => {
    if (!text.value) return ''
    // 1. 解析 Markdown
    const rawHtml = marked.parse(text.value) as string
    // 2. 净化 HTML (安全第一)
    return DOMPurify.sanitize(rawHtml)
  })

  // 功能
  const clear = () => {
    if (confirm('Are you sure to clear all?')) {
      text.value = ''
    }
  }

  const copyHtml = () => {
    copyToClipboard(htmlContent.value)
  }

  // SEO
  useHead({
    title: t('md.title') + ' - NuxtTools',
    meta: [{ name: 'description', content: t('md.desc') }]
  })
</script>

<style scoped>
  .btn-secondary {
    @apply px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition shadow-sm;
  }

  /*
  使用了 Tailwind CSS Typography 插件 (prose 类)
  如果没有安装该插件，你需要手写一些样式来美化预览区域，
  比如 h1, p, ul 的 margin 和 font-size。
  强烈建议安装: npm install -D @tailwindcss/typography
  然后在 tailwind.config.js 的 plugins 里添加 require('@tailwindcss/typography')
*/
</style>
