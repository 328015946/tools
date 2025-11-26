<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:47:10
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-26 16:47:19
 * @FilePath: \xiao-nuxt4\app\components\EditorWorkspace.vue
 * @Description: 注释
-->
<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  defineProps<{
    zoomLevel: number
  }>()

  // [新增] 接收 drop 事件
  const emit = defineEmits(['canvas-ready', 'update-zoom', 'drop-element']) // 增加 drop-element
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const itemString = e.dataTransfer?.getData('design-item')
    if (itemString) {
      // 直接传递原始的屏幕坐标
      emit('drop-element', {
        item: JSON.parse(itemString),
        x: e.clientX,
        y: e.clientY
      })
    }
  }
  onMounted(() => {
    if (canvasEl.value) {
      // 告诉父组件：Canvas 元素准备好了，你可以初始化了
      emit('canvas-ready', canvasEl.value)
    }
  })
</script>

<template>
  <main class="flex-1 bg-gray-100 flex flex-col relative overflow-hidden">
    <!-- 画布容器 -->
    <div
      class="flex-1 overflow-auto flex items-center justify-center p-8 custom-scrollbar"
      @drop="handleDrop"
      @dragover.prevent>
      <div class="shadow-xl bg-white relative">
        <canvas ref="canvasEl"></canvas>
      </div>
    </div>

    <!-- 底部缩放控制 -->
    <div
      class="absolute bottom-4 left-4 bg-white rounded-md shadow-md border border-gray-200 flex items-center px-2 py-1 gap-2">
      <button
        @click="$emit('update-zoom', -10)"
        class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">
        -
      </button>
      <span class="text-xs w-10 text-center">{{ zoomLevel }}%</span>
      <button
        @click="$emit('update-zoom', 10)"
        class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded">
        +
      </button>
    </div>
  </main>
</template>
