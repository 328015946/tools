<!-- pages/tools/dev/index.vue -->
<template>
  <div class="py-12 text-center">
    <h1 class="text-3xl font-bold mb-4">{{ $t('nav.dev_tools') }}</h1>
    <p class="text-gray-500 mb-8">这里是开发相关的工具集合。</p>

    <!-- 这里可以列出该分类下的工具，方便用户点击 -->
    <div class="flex justify-center gap-4">
      <NuxtLinkLocale to="/tools/dev/json" class="text-emerald-600 hover:underline font-bold">
        JSON 格式化工具
      </NuxtLinkLocale>
      <!-- 未来添加更多... -->
    </div>

    <div class="mt-12">
      <NuxtLinkLocale to="/" class="text-gray-400 hover:text-gray-600">← 返回首页</NuxtLinkLocale>
    </div>
  </div>
</template>
