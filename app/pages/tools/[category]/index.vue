<template>
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <!-- 头部：显示当前分类名称 -->
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ categoryTitle }}</h1>
      <p class="text-gray-500">{{ $t('home.all_tools') }}: {{ filteredTools.length }}</p>
    </div>

    <!-- 工具列表 -->
    <div v-if="filteredTools.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-20">
      <div class="text-4xl mb-4">📂</div>
      <p class="text-gray-500">该分类下暂无工具</p>
      <NuxtLinkLocale to="/" class="text-emerald-600 hover:underline mt-4 inline-block"> 返回首页 </NuxtLinkLocale>
    </div>
  </div>
</template>

<script setup lang="ts">
  const route = useRoute()
  const { t } = useI18n()
  const { tools } = useTools()

  // 获取 URL 中的 category 参数 (例如 'dev', 'image', 'text')
  const categorySlug = computed(() => route.params.category as string)

  // 根据 URL 参数筛选工具
  const filteredTools = computed(() => {
    return tools.filter(tool => tool.categorySlug === categorySlug.value)
  })

  // 计算页面标题
  const categoryTitle = computed(() => {
    const slug = categorySlug.value
    if (slug === 'dev') return t('nav.dev_tools')
    if (slug === 'image') return t('nav.image_tools')
    if (slug === 'text') return t('nav.text_tools')
     if (slug === 'other') return t('nav.other_tools') // ✅ 新增
    return 'Unknown Category'
  })

  // 如果是无效的分类，可以做一个简单的判断
  if (!['dev', 'image', 'text', 'other'].includes(categorySlug.value)) {
    // 可以抛出 404 错误
    throw createError({ statusCode: 404, statusMessage: 'Category Not Found' })
  }

  // SEO
  useHead({
    title: `${categoryTitle.value} - NuxtTools`
  })
</script>
