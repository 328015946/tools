<template>
  <nav class="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- 左侧 Logo 和 导航菜单 -->
        <div class="flex">
          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center">
            <NuxtLinkLocale to="/" class="flex items-center gap-2">
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#0F172A" />
                <path d="M13 11 L20 18 L13 25" stroke="#10B981" stroke-width="3.2" stroke-linecap="round" />
                <path d="M27 11 L20 18 L27 25" stroke="white" stroke-width="3.2" stroke-linecap="round" />
                <text x="28" y="16" font-size="9.5" font-family="monospace" fill="#10B981">xi</text>
                <text x="6" y="36" font-size="9.5" font-family="monospace" fill="white">xiao</text>
              </svg>
            </NuxtLinkLocale>
          </div>

          <!-- 桌面端主导航 -->
          <div class="hidden sm:ml-8 sm:flex sm:space-x-2">
            <!-- 1. 首页 -->
            <NuxtLinkLocale
              to="/"
              active-class="!border-emerald-400 !text-emerald-400"
              class="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 transition h-full">
              {{ $t('nav.home') }}
            </NuxtLinkLocale>

            <!-- 2. 分类菜单 (Mega Menu) -->
            <div v-for="menu in menus" :key="menu.slug" class="relative group h-full flex items-center">
              <!-- 主链接 -->
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

              <!-- ✅ 巨型下拉面板 -->
              <!-- w-[600px] 固定宽度，或者根据工具数量动态调整 -->
              <!-- max-h-[80vh] 限制高度，防止超出屏幕 -->
              <!-- overflow-y-auto 超出滚动 -->
              <div
                class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-20">
                <div
                  class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5 w-[500px] lg:w-[600px]">
                  <!-- 顶部浅色标题栏 (可选) -->
                  <div class="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">{{ $t(menu.labelKey) }}</span>
                    <span class="text-xs text-gray-400">{{ getToolsByCategory(menu.slug).length }} items</span>
                  </div>

                  <!-- 工具网格：两列布局 -->
                  <div class="p-2 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <NuxtLinkLocale
                      v-for="tool in getToolsByCategory(menu.slug)"
                      :key="tool.id"
                      :to="tool.path"
                      class="flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-50 transition group/item">
                      <!-- 图标背景 -->
                      <div
                        :class="`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl bg-white border border-gray-200 group-hover/item:border-emerald-200 group-hover/item:bg-white transition`">
                        {{ tool.icon }}
                      </div>

                      <!-- 文本信息 -->
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-gray-800 group-hover/item:text-emerald-700">{{
                          $t(tool.nameKey)
                        }}</span>
                        <span class="text-xs text-gray-500 line-clamp-1 mt-0.5 group-hover/item:text-emerald-600/70">{{
                          $t(tool.descKey)
                        }}</span>
                      </div>
                    </NuxtLinkLocale>

                    <!-- 空状态 -->
                    <div
                      v-if="getToolsByCategory(menu.slug).length === 0"
                      class="col-span-2 py-8 text-center text-gray-400 italic">
                      🚧 开发中，敬请期待...
                    </div>
                  </div>

                  <!-- 底部 "查看全部" 链接 -->
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

        <!-- 右侧 功能区保持不变 -->
        <!-- 右侧 功能区 -->
        <div class="flex items-center space-x-3">
          <!-- ✅ 自定义语言切换菜单 -->
          <div class="relative group py-4">
            <!-- 加 py-4 是为了增加 hover 热区，防止鼠标移动时菜单消失 -->

            <!-- 1. 触发按钮 -->
            <button
              class="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-colors focus:outline-none">
              <span>{{ currentLang.flag }}</span>
              <span>{{ currentLang.label }}</span>
              <!-- 小箭头 -->
              <svg
                class="w-3 h-3 text-gray-400 transition-transform duration-200 group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- 2. 下拉面板 -->
            <!-- absolute right-0 保证靠右对齐 -->
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
                  <!-- 选中的打钩 -->
                  <span v-if="locale === opt.code" class="ml-auto text-emerald-500">✓</span>
                </button>
              </div>
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

  const menus = [
    { slug: 'dev', labelKey: 'nav.dev_tools' },
    { slug: 'image', labelKey: 'nav.image_tools' },
    { slug: 'text', labelKey: 'nav.text_tools' },
    { slug: 'other', labelKey: 'nav.other_tools' }
  ]
  // 语言选项配置
  const langOptions = [
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' }
  ]
  // 当前显示的语言对象
  const currentLang = computed(() => {
    return langOptions.find(l => l.code === locale.value) || langOptions[0]
  })

  const getToolsByCategory = (slug: string) => {
    return tools.filter(t => t.categorySlug === slug)
  }

  const changeLang = (code: string) => {
    if (code !== locale.value) {
      navigateTo(switchLocalePath(code))
    }
  }
</script>

<style scoped>
  /* 美化滚动条 */
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
