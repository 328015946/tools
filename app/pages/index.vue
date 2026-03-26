<template>
  <div>
    <!-- 1. Hero Header 区域：高度已调小 (py-10 sm:py-14) -->
    <section class="bg-gray-900 text-white py-10 sm:py-14 relative overflow-hidden">
      <!-- 背景装饰圆 (稍微调小了一点尺寸，防止在矮高度下太抢眼) -->
      <div class="absolute top-0 left-0 -ml-20 -mt-20 w-48 h-48 rounded-full bg-emerald-600 opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 -mr-20 -mb-20 w-64 h-64 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>

      <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
        <!-- 标题字体也稍微调小了一号 -->
        <h1
          class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          {{ $t('home.hero_title') }}
        </h1>
        <p class="text-gray-400 text-base sm:text-lg mb-6 max-w-2xl mx-auto">
          {{ $t('home.hero_subtitle') }}
        </p>

        <!-- 搜索框 -->
        <div class="relative max-w-lg mx-auto">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('home.search_placeholder')"
            class="w-full py-3 pl-11 pr-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 shadow-xl text-base placeholder-gray-400" />
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. 工具列表区域 -->
    <section class="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 分类筛选栏 (新增) -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <button
          v-for="cat in categories"
          :key="cat.value"
          @click="activeCategory = cat.value"
          class="px-4 py-2 rounded-full text-sm font-medium transition duration-200 border"
          :class="
            activeCategory === cat.value
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          ">
          {{ cat.label }}
        </button>
      </div>

      <!-- 列表标题与计数 -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">
          {{ activeCategory === 'all' ? $t('home.all_tools') : getCategoryLabel(activeCategory) }}
        </h2>
        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          {{ filteredTools.length }}
        </span>
      </div>

      <!-- 工具网格 -->
      <div v-if="filteredTools.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>

      <!-- 搜索/筛选无结果 -->
      <div v-else class="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div class="text-5xl mb-3">🔍</div>
        <h3 class="text-base font-medium text-gray-900">{{ $t('home.no_result') }}</h3>
        <p class="text-gray-500 text-sm mt-1">{{ $t('home.no_result_desc') }}</p>
        <!-- 如果不是在全部类目下，提供重置按钮 -->
        <button
          v-if="activeCategory !== 'all'"
          @click="activeCategory = 'all'"
          class="mt-4 text-sm text-emerald-600 hover:underline">
          {{ $t('home.view_all') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { tools } = useTools()

  useSeoMeta({
    title: t('home.hero_title'),
    ogTitle: t('home.hero_title'),
    description: t('home.hero_subtitle'),
    ogDescription: t('home.hero_subtitle'),
    keywords: 'JSON格式化,图片压缩,Base64,时间戳,打字练习,在线工具箱,开发者工具'
  })

  const searchQuery = ref('')
  const activeCategory = ref('all') // 当前选中的分类

  // 定义分类选项
  const categories = computed(() => [
    { value: 'all', label: t('home.all_tools') }, // "所有工具"
    { value: 'dev', label: t('nav.dev_tools') },
    { value: 'image', label: t('nav.image_tools') },
    { value: 'text', label: t('nav.text_tools') },
    { value: 'other', label: t('nav.other_tools') }
  ])

  // 辅助函数：获取当前分类的名称（用于标题显示）
  const getCategoryLabel = (val: string) => {
    return categories.value.find(c => c.value === val)?.label || ''
  }

  // 计算属性：双重过滤 (分类 + 搜索)
  const filteredTools = computed(() => {
    let result = tools

    // 1. 先按分类过滤
    if (activeCategory.value !== 'all') {
      result = result.filter(t => t.categorySlug === activeCategory.value)
    }

    // 2. 再按搜索词过滤
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(tool => {
        const name = t(tool.nameKey).toLowerCase()
        const desc = t(tool.descKey).toLowerCase()
        return name.includes(q) || desc.includes(q)
      })
    }

    return result
  })
</script>
