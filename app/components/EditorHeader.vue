<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:46:56
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-26 16:47:04
 * @FilePath: \xiao-nuxt4\app\components\EditorHeader.vue
 * @Description: 注释
-->
<script setup lang="ts">
  defineProps<{
    historyIndex: number
    historyLength: number
  }>()

  defineEmits(['undo', 'redo', 'save', 'download'])
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
    <div class="flex items-center gap-4">
      <span class="text-indigo-600 text-xl font-black tracking-tight">DesignPro</span>

      <!-- 撤销/重做 -->
      <div class="flex items-center gap-1 bg-gray-100 rounded-md p-1">
        <button
          @click="$emit('undo')"
          :disabled="historyIndex <= 0"
          class="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition"
          title="撤销 (Ctrl+Z)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        </button>
        <button
          @click="$emit('redo')"
          :disabled="historyIndex >= historyLength - 1"
          class="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition"
          title="重做 (Ctrl+Shift+Z)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button @click="$emit('save')" class="text-sm text-gray-600 hover:text-indigo-600 font-medium">保存项目</button>
      <button
        @click="$emit('download')"
        class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition shadow-sm">
        下载图片
      </button>
    </div>
  </header>
</template>
