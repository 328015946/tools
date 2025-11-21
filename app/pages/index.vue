<template>
  <div>
    <!-- 1. Hero Header 区域：深色背景 + 搜索框 -->
    <section class="bg-gray-900 text-white py-16 sm:py-24 relative overflow-hidden">
      <!-- 背景装饰圆 -->
      <div class="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-emerald-600 opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>

      <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h1
          class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          {{ $t('home.hero_title') }}
        </h1>
        <p class="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          {{ $t('home.hero_subtitle') }}
        </p>

        <!-- 搜索框 -->
        <div class="relative max-w-xl mx-auto">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('home.search_placeholder')"
            class="w-full py-4 pl-12 pr-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 shadow-xl text-lg placeholder-gray-400" />
          <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6">
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
    <section class="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 如果已登录，显示最近使用 (模拟数据) -->
      <div v-if="user && !searchQuery" class="mb-10">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🕒</span> {{ $t('home.recent_tools') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLinkLocale
            :to="'/'"
            class="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-4 rounded-xl transition flex items-center gap-3 group">
            <span class="text-2xl group-hover:scale-110 transition">💾</span>
            <div>
              <h3 class="font-semibold text-gray-800">{{ $t('tools.json_fmt') }}</h3>
              <p class="text-xs text-gray-500">Last used: 2m ago</p>
            </div>
          </NuxtLinkLocale>
        </div>
      </div>

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">{{ $t('home.all_tools') }}</h2>
        <span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{{ filteredTools.length }} items</span>
      </div>

      <div v-if="filteredTools.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- ✅ 使用组件 -->
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>

      <!-- 搜索无结果 -->
      <div v-else class="text-center py-20">
        <div class="text-6xl mb-4">🧐</div>
        <h3 class="text-lg font-medium text-gray-900">{{ $t('home.no_result') }}</h3>
        <p class="text-gray-500 text-sm mt-2">Try searching for 'JSON' or 'Image'</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  const { user } = useAuth()
  const { t } = useI18n()
  // ✅ 引入数据源
  const { tools } = useTools()

  const searchQuery = ref('')

  // 计算属性
  const filteredTools = computed(() => {
    if (!searchQuery.value) return tools

    const q = searchQuery.value.toLowerCase()
    return tools.filter(tool => {
      const name = t(tool.nameKey).toLowerCase()
      const desc = t(tool.descKey).toLowerCase()
      return name.includes(q) || desc.includes(q)
    })
  })
</script>
