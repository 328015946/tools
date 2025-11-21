<template>
  <!-- 使用 NuxtLayout 包裹，这样导航栏还在 -->
  <NuxtLayout>
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <!-- 动态插图/表情 -->
      <div class="text-9xl mb-8 animate-bounce">🛸</div>

      <h1 class="text-6xl font-extrabold text-gray-900 mb-4">404</h1>

      <p class="text-xl text-gray-600 mb-8 max-w-md mx-auto">
        哎呀！页面好像迷失在代码宇宙中了...
        <br />
        <span class="text-sm text-gray-400 mt-2 block">({{ error?.message || 'Page not found' }})</span>
      </p>

      <div class="flex gap-4">
        <!-- 返回首页按钮 -->
        <button
          @click="handleError"
          class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2">
          <span>🏠</span> 返回首页
        </button>

        <!-- 随便逛逛按钮 -->
        <button
          @click="goBack"
          class="px-6 py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full font-medium transition">
          🔙 返回上一页
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import type { NuxtError } from '#app'

  // 接收 error 属性
  const props = defineProps<{
    error: NuxtError
  }>()

  const localePath = useLocalePath()

  // 1. 清除错误并跳转回首页
  const handleError = () => {
    clearError({ redirect: localePath('/') })
  }

  // 2. 返回上一页
  const goBack = () => {
    // 如果有历史记录则返回，否则去首页
    if (history.state.back) {
      history.back()
    } else {
      handleError()
    }
  }
</script>
