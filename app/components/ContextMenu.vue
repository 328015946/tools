<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:56:37
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-26 16:56:47
 * @FilePath: \xiao-nuxt4\app\components\ContextMenu.vue
 * @Description: 注释
-->
<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'

  defineProps<{
    visible: boolean
    x: number
    y: number
    hasSelection: boolean
    isGroup: boolean
  }>()

  const emit = defineEmits([
    'close',
    'action' // action: copy, paste, delete, layer-up...
  ])

  // 点击外部关闭
  const close = () => emit('close')
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50" @click.stop="close" @contextmenu.prevent="close">
    <!-- 菜单本体 -->
    <div
      class="absolute bg-white border border-gray-200 shadow-lg rounded-md py-1 w-40 text-sm font-medium text-gray-700 select-none"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop>
      <template v-if="hasSelection">
        <button class="menu-item" @click="emit('action', 'copy')">
          <span>复制</span> <span class="text-gray-400 text-xs">Ctrl+C</span>
        </button>
        <button class="menu-item" @click="emit('action', 'delete')">
          <span class="text-red-600">删除</span> <span class="text-gray-400 text-xs">Del</span>
        </button>
        <div class="border-t my-1"></div>

        <!-- 组合/解组 -->
        <button v-if="!isGroup" class="menu-item" @click="emit('action', 'group')">组合</button>
        <button v-else class="menu-item" @click="emit('action', 'ungroup')">取消组合</button>

        <div class="border-t my-1"></div>
        <button class="menu-item" @click="emit('action', 'layer-top')">置于顶层</button>
        <button class="menu-item" @click="emit('action', 'layer-bottom')">置于底层</button>
      </template>

      <template v-else>
        <button class="menu-item" @click="emit('action', 'paste')">
          <span>粘贴</span> <span class="text-gray-400 text-xs">Ctrl+V</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .menu-item {
    @apply w-full text-left px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 flex justify-between items-center transition-colors;
  }
</style>
