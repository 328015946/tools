<template>
  <nav class="bg-white shadow-md border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- 左侧 Logo 和 导航 -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <!-- ✅ 优化前: :to="localePath('/')" -->
            <!-- ✅ 优化后: to="/" -->
            <NuxtLinkLocale to="/" class="flex items-center gap-2">
              <!-- Xiao Xi Logo: Emerald Code X -->

              <!-- Xiao Xi Full Logo: Horizontal -->
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <!-- 背景 -->
                <rect width="40" height="40" rx="10" fill="#0F172A" />

                <!-- X 编织图标（保持居中略上） -->
                <path d="M13 11 L20 18 L13 25" stroke="#10B981" stroke-width="3.2" stroke-linecap="round" />
                <path d="M27 11 L20 18 L27 25" stroke="white" stroke-width="3.2" stroke-linecap="round" />

                <!-- xi 放上面 -->
                <text x="28" y="16" font-size="9.5" font-family="monospace" fill="#10B981">xi</text>

                <!-- xiao 放下面 -->
                <text x="6" y="36" font-size="9.5" font-family="monospace" fill="white">xiao</text>
              </svg>
            </NuxtLinkLocale>
          </div>

          <div class="hidden sm:ml-8 sm:flex sm:space-x-6">
            <NuxtLinkLocale
              to="/"
              exact-active-class="!border-emerald-400 !text-emerald-400"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-emerald-400 hover:border-emerald-400 transition">
              {{ $t('nav.home') }}
            </NuxtLinkLocale>

            <NuxtLinkLocale
              to="/tools/dev"
              exact-active-class="!border-emerald-400 !text-emerald-400"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-emerald-400 hover:border-emerald-400 transition">
              {{ $t('nav.dev_tools') }}
            </NuxtLinkLocale>

            <NuxtLinkLocale
              to="/tools/image"
              exact-active-class="!border-emerald-400 !text-emerald-400"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-emerald-400 hover:border-emerald-400 transition">
              {{ $t('nav.image_tools') }}
            </NuxtLinkLocale>

            <NuxtLinkLocale
              to="/tools/text"
              exact-active-class="!border-emerald-400 !text-emerald-400"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-emerald-400 hover:border-emerald-400 transition">
              {{ $t('nav.text_tools') }}
            </NuxtLinkLocale>
          </div>
        </div>

        <!-- 右侧 功能区 -->
        <div class="flex items-center space-x-3">
          <!-- 语言切换 (逻辑保持不变，因为这涉及到 switchLocalePath) -->
          <select
            :value="locale"
            @change="onLocaleChanged"
            class="bg-gray-50 text-xs sm:text-sm border-gray-300 rounded-md focus:border-emerald-500 focus:ring-emerald-500 py-1">
            <option value="zh">🇨🇳 中文</option>
            <option value="en">🇺🇸 EN</option>
          </select>

          <!-- 用户信息 -->
          <!-- <template v-if="user">
            <div class="flex items-center gap-2">
              <div
                class="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                {{ user.username.charAt(0).toUpperCase() }}
              </div>
              <button @click="logout" class="text-sm text-gray-500 hover:text-red-500 transition">
                <span class="hidden sm:inline">{{ $t('nav.logout') }}</span>
                <span class="sm:hidden">🚪</span>
              </button>
            </div>
          </template>

          <template v-else>

            <NuxtLinkLocale to="/login" class="text-sm text-gray-600 hover:text-emerald-600 font-medium">
              {{ $t('nav.login') }}
            </NuxtLinkLocale>
            <NuxtLinkLocale
              to="/register"
              class="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full transition shadow-sm">
              {{ $t('nav.register') }}
            </NuxtLinkLocale>
          </template> -->
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
  const { user, logout } = useAuth()
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  // 这里不需要 useLocalePath 了，因为模板里全换成了 NuxtLinkLocale

  const onLocaleChanged = (event: Event) => {
    const target = event.target as HTMLSelectElement
    navigateTo(switchLocalePath(target.value))
  }
</script>
