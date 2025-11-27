<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:47:10
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-27 12:05:18
 * @FilePath: \xiao-nuxt4\app\components\EditorWorkspace.vue
 * @Description: 注释
-->
<script setup lang="ts">
  import { onMounted, ref } from 'vue'

  defineProps<{
    zoomLevel: number
    showGrid?: boolean // 新增
  }>()

  // [新增] 接收 drop 事件
  const emit = defineEmits(['canvas-ready', 'update-zoom', 'drop-element']) // 增加 drop-element
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const workspaceEl = ref<HTMLDivElement | null>(null)
  // --- [新增] 平移相关的状态 ---
  const translateX = ref(0)
  const translateY = ref(0)
  const isPanning = ref(false) // 是否按下空格
  const isDragging = ref(false) // 是否正在拖拽
  // 1. 新增记录上一次鼠标位置的变量
  let lastX = 0
  let lastY = 0
  // [新增] 监听容器大小变化 (使用 ResizeObserver)
  let resizeObserver: ResizeObserver | null = null

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const json = e.dataTransfer?.getData('design-item')
    if (json && workspaceEl.value) {
      const item = JSON.parse(json)
      // 注意：这里可能需要根据缩放比例修正坐标，但 Fabric 通常能处理
      emit('drop-element', { item, x: e.clientX, y: e.clientY })
    }
  }
  onMounted(() => {
    if (canvasEl.value) {
      emit('canvas-ready', canvasEl.value)
    }

    // 监听 workspace 容器大小，用于自动计算缩放
    if (workspaceEl.value) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          emit('workspace-resize', { width, height })
        }
      })
      resizeObserver.observe(workspaceEl.value)
    }
    // [新增] 全局键盘监听 (空格键)
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
  })
  // --- [新增] 键盘处理 ---
  const handleKeydown = (e: KeyboardEvent) => {
    // 只有没在输入框里打字时，按空格才算平移
    const activeEl = document.activeElement?.tagName
    if (e.code === 'Space' && activeEl !== 'INPUT' && activeEl !== 'TEXTAREA') {
      e.preventDefault() // 防止页面向下滚动
      isPanning.value = true
    }
  }

  const handleKeyup = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isPanning.value = false
      isDragging.value = false // 松开空格强制结束拖拽
    }
  }

  // 2. 修改 handleMouseDown
  const handleMouseDown = (e: MouseEvent) => {
    // 只有按住空格键，或者按下了鼠标中键(滚轮键)，才允许拖拽
    if (isPanning.value || e.button === 1) {
      isDragging.value = true
      // 记录初始点击位置
      lastX = e.clientX
      lastY = e.clientY
      e.preventDefault()
    }
  }

  // 3. 修改 handleMouseMove
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.value) {
      // 计算差值
      const deltaX = e.clientX - lastX
      const deltaY = e.clientY - lastY

      // 更新偏移量
      translateX.value += deltaX
      translateY.value += deltaY

      // 更新上一次的位置，为下一帧做准备
      lastX = e.clientX
      lastY = e.clientY
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
  }
  // [新增] 复位视图方法
  const resetView = () => {
    translateX.value = 0
    translateY.value = 0
  }
  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
  })
</script>

<template>
  <div
    class="bg-gray-100 flex-1 relative overflow-hidden flex items-center justify-center p-10 select-none"
    ref="workspaceEl"
    :class="isDragging ? 'cursor-grabbing' : isPanning ? 'cursor-grab' : 'cursor-default'"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @dragover.prevent
    @drop="handleDrop"
    @wheel.ctrl.prevent="$emit('update-zoom', $event.deltaY > 0 ? -5 : 5)">
    <!--
      [修改] 增加 transform 样式
      transform-origin: center center 让它永远居中缩放
      transition: 让缩放有丝滑的动画
    -->
    <div
      class="relative shadow-lg bg-white transition-transform ease-out will-change-transform"
      :class="isDragging ? 'duration-0' : 'duration-200'"
      :style="{
        transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`,
        transformOrigin: 'center center'
      }">
      <canvas ref="canvasEl"></canvas>

      <div v-if="showGrid" class="absolute inset-0 pointer-events-none z-10 grid-pattern"></div>
      <!-- [可选] 添加一个复位按钮，防止拖没了找不回来 -->
      <div v-if="translateX !== 0 || translateY !== 0" class="absolute bottom-4 right-4 z-20">
        <button
          @click="resetView"
          class="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg opacity-80 hover:opacity-100 transition">
          复位视图
        </button>
      </div>
    </div>
  </div>
</template>

<!-- 样式保持不变 -->
<style scoped>
  .grid-pattern {
    background-size: 20px 20px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  }
</style>
