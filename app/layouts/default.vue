<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 14:01:13
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:01:25
 * @FilePath: \xiao-nuxt4\app\layouts\default.vue
 * @Description: 注释
-->
<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <NavBar />
    <main class="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t border-gray-200 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center justify-center space-y-4">
          <div class="text-gray-500 text-sm">
            {{ $t('footer.copy', { year: new Date().getFullYear() }) }}
          </div>
          <div class="flex items-center space-x-4">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-emerald-600 text-sm transition-colors duration-200">
              {{ $t('footer.icp') }}
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
