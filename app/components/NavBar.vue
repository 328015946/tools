<template>
  <nav class="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- 左侧 Logo 和 导航菜单 -->
        <div class="flex">
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <NuxtLinkLocale to="/" class="flex items-center gap-2" @click="closeMobileMenu">
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#0F172A" />
                <path d="M13 11 L20 18 L13 25" stroke="#10B981" stroke-width="3.2" stroke-linecap="round" />
                <path d="M27 11 L20 18 L27 25" stroke="white" stroke-width="3.2" stroke-linecap="round" />
                <text x="28" y="16" font-size="9.5" font-family="monospace" fill="#10B981">xi</text>
                <text x="6" y="36" font-size="9.5" font-family="monospace" fill="white">xiao</text>
              </svg>
            </NuxtLinkLocale>
          </div>

          <!-- 💻 桌面端主导航 (Hidden on Mobile) -->
          <div class="hidden sm:ml-8 sm:flex sm:space-x-2">
            <!-- 分类菜单 (Mega Menu) -->
            <div v-for="menu in menus" :key="menu.slug" class="relative group h-full flex items-center">
              <NuxtLinkLocale
                :to="`/tools/${menu.slug}`"
                active-class="!border-emerald-400 !text-emerald-400"
                class="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 transition h-full gap-1 z-10 relative">
                {{ $t(menu.labelKey) }}
                <svg
                  class="w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </NuxtLinkLocale>

              <!-- 桌面端巨型下拉面板 -->
              <div
                class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-20">
                <div
                  class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5 w-[500px] lg:w-[600px]">
                  <div class="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">{{ $t(menu.labelKey) }}</span>
                    <span class="text-xs text-gray-400">{{ getToolsByCategory(menu.slug).length }} items</span>
                  </div>
                  <div class="p-2 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <NuxtLinkLocale
                      v-for="tool in getToolsByCategory(menu.slug)"
                      :key="tool.id"
                      :to="tool.path"
                      class="flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-50 transition group/item">
                      <div
                        class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl bg-white border border-gray-200 group-hover/item:border-emerald-200 group-hover/item:bg-white transition">
                        {{ tool.icon }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800 group-hover/item:text-emerald-700">{{
                          $t(tool.nameKey)
                        }}</span>
                        <span class="text-xs text-gray-500 line-clamp-1 mt-0.5 group-hover/item:text-emerald-600/70">{{
                          $t(tool.descKey)
                        }}</span>
                      </div>
                    </NuxtLinkLocale>
                  </div>
                  <div class="bg-gray-50 p-3 text-center border-t border-gray-100">
                    <NuxtLinkLocale
                      :to="`/tools/${menu.slug}`"
                      class="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                      查看全部 {{ $t(menu.labelKey) }} →
                    </NuxtLinkLocale>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧 功能区 -->
        <div class="flex items-center gap-3">
          <!-- 语言切换 (保持不变，但在移动端也可以看见) -->
          <div class="relative group py-4">
            <button
              class="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors focus:outline-none">
              <span>{{ currentLang.flag }}</span>
              <span class="hidden sm:inline">{{ currentLang.label }}</span>
              <!-- 移动端只显示国旗省空间 -->
              <svg
                class="w-3 h-3 text-gray-400 transition-transform duration-200 group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              class="absolute right-0 top-full mt-[-10px] w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50 pt-2">
              <div
                class="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5 py-1">
                <button
                  v-for="opt in langOptions"
                  :key="opt.code"
                  @click="changeLang(opt.code)"
                  class="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-emerald-50 transition"
                  :class="locale === opt.code ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-gray-600'">
                  <span class="text-base">{{ opt.flag }}</span>
                  <span>{{ opt.label }}</span>
                  <span v-if="locale === opt.code" class="ml-auto text-emerald-500">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 📱 移动端菜单按钮 (Hamburger) -->
          <button
            @click="toggleMobileMenu"
            class="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition duration-150 ease-in-out">
            <!-- 菜单图标 -->
            <svg v-if="!isMobileMenuOpen" class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- 关闭图标 -->
            <svg v-else class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 📱 移动端下拉菜单 (Overlay) -->
    <div
      v-show="isMobileMenuOpen"
      class="sm:hidden border-t border-gray-100 bg-white absolute left-0 right-0 shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
      <div class="pt-2 pb-4 space-y-1 px-4">
        <!-- 1. 首页链接 (可选) -->
        <!-- <NuxtLinkLocale
          to="/"
          class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
          @click="closeMobileMenu">
          {{ $t('nav.home') }}
        </NuxtLinkLocale> -->

        <!-- 2. 移动端分类手风琴 -->
        <div v-for="menu in menus" :key="menu.slug" class="border-b border-gray-50 last:border-0">
          <!-- 分类标题 (点击展开/收起) -->
          <button
            @click="toggleMobileCategory(menu.slug)"
            class="w-full flex justify-between items-center px-3 py-3 text-left text-base font-medium text-gray-700 hover:text-emerald-600 focus:outline-none">
            <span>{{ $t(menu.labelKey) }}</span>
            <!-- 箭头动画 -->
            <svg
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              :class="expandedMobileCategory === menu.slug ? 'rotate-180 text-emerald-500' : ''"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- 子工具列表 (展开时显示) -->
          <div
            v-show="expandedMobileCategory === menu.slug"
            class="bg-gray-50/50 rounded-lg mb-2 mx-2 space-y-1 overflow-hidden transition-all">
            <!-- "查看全部" 链接 -->
            <NuxtLinkLocale
              :to="`/tools/${menu.slug}`"
              class="block px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-md"
              @click="closeMobileMenu">
              查看全部 {{ $t(menu.labelKey) }}
            </NuxtLinkLocale>

            <!-- 工具项 -->
            <NuxtLinkLocale
              v-for="tool in getToolsByCategory(menu.slug)"
              :key="tool.id"
              :to="tool.path"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition rounded-md group"
              @click="closeMobileMenu">
              <div class="text-lg opacity-80 group-hover:scale-110 transition">{{ tool.icon }}</div>
              <div class="flex flex-col">
                <span class="text-sm text-gray-700 group-hover:text-emerald-700">{{ $t(tool.nameKey) }}</span>
              </div>
            </NuxtLinkLocale>

            <!-- 空状态 -->
            <div v-if="getToolsByCategory(menu.slug).length === 0" class="px-4 py-3 text-xs text-gray-400 italic">
              开发中...
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const { tools } = useTools()
  const route = useRoute() // 用于监听路由变化

  // --- 状态管理 ---
  const isMobileMenuOpen = ref(false)
  const expandedMobileCategory = ref<string | null>(null) // 当前展开的移动端分类 slug

  const menus = [
    { slug: 'dev', labelKey: 'nav.dev_tools' },
    { slug: 'image', labelKey: 'nav.image_tools' },
    { slug: 'text', labelKey: 'nav.text_tools' },
    { slug: 'docs', labelKey: 'nav.docs_tools' },
    { slug: 'other', labelKey: 'nav.other_tools' }
  ]

  const langOptions = [
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ]

  const currentLang = computed(() => {
    return langOptions.find(l => l.code === locale.value) || langOptions[0]
  })

  const getToolsByCategory = (slug: string) => {
    return tools.filter(t => t.categorySlug === slug)
  }

  const changeLang = (code: string) => {
    if (code !== locale.value) {
      navigateTo(switchLocalePath(code))
      // 切换语言后关闭菜单
      isMobileMenuOpen.value = false
    }
  }

  // --- 移动端交互逻辑 ---
  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    // 关闭菜单时，也重置展开的分类（可选）
    if (!isMobileMenuOpen.value) {
      expandedMobileCategory.value = null
    }
  }

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
    expandedMobileCategory.value = null
  }

  const toggleMobileCategory = (slug: string) => {
    // 如果点击的是当前展开的，则折叠；否则展开新的
    if (expandedMobileCategory.value === slug) {
      expandedMobileCategory.value = null
    } else {
      expandedMobileCategory.value = slug
    }
  }

  // 监听路由变化，跳转后自动关闭菜单
  watch(
    () => route.fullPath,
    () => {
      closeMobileMenu()
    }
  )
</script>

<style scoped>
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
</style>
