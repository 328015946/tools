<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 15:47:24
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 15:47:34
 * @FilePath: \xiao-nuxt4\app\components\ToolCard.vue
 * @Description: 注释
-->
<template>
  <NuxtLinkLocale
    :to="tool.path"
    class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition-all hover:-translate-y-1 cursor-pointer group block">
    <div class="flex items-start justify-between mb-4">
      <div :class="`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${tool.color}`">
        {{ tool.icon }}
      </div>
      <span
        class="text-xs font-medium px-2 py-1 bg-gray-50 text-gray-500 rounded-md group-hover:bg-gray-100 transition">
        {{ $t(tool.category) }}
      </span>
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition">
      {{ $t(tool.nameKey) }}
    </h3>
    <p class="text-sm text-gray-500 line-clamp-2">{{ $t(tool.descKey) }}</p>
  </NuxtLinkLocale>
</template>

<script setup lang="ts">
  defineProps<{
    tool: any // 你可以定义更具体的接口类型
  }>()
</script>
