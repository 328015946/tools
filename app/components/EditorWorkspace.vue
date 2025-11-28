<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:47:10
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-27 18:41:25
 * @FilePath: \xiao-nuxt4\app\components\EditorWorkspace.vue
 * @Description: 注释
-->
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'

  const props = defineProps<{
    zoomLevel: number
    showGrid?: boolean
    isLoaded?: boolean //
  }>()

  const emit = defineEmits(['canvas-ready', 'update-zoom', 'drop-element', 'workspace-resize'])

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const workspaceEl = ref<HTMLDivElement | null>(null)

  const translateX = ref(0)
  const translateY = ref(0)
  const isPanning = ref(false)
  const isDragging = ref(false)

  let lastX = 0
  let lastY = 0
  let resizeObserver: ResizeObserver | null = null

  // ... handleDrop 保持不变 ...
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const json = e.dataTransfer?.getData('design-item')
    if (json && workspaceEl.value) {
      const item = JSON.parse(json)
      emit('drop-element', { item, x: e.clientX, y: e.clientY })
    }
  }

  // --- 键盘处理 (增强健壮性) ---
  const handleKeydown = (e: KeyboardEvent) => {
    // 1. 如果正在输入文字，忽略
    const activeEl = document.activeElement?.tagName
    if (activeEl === 'INPUT' || activeEl === 'TEXTAREA' || (activeEl as any)?.isContentEditable) return

    // 2. 兼容性检查: e.code === 'Space' 或者 e.key === ' '
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault() // 防止网页滚动

      // 3. 防止长按重复触发
      if (!e.repeat) {
        isPanning.value = true
      }
    }
  }

  const handleKeyup = (e: KeyboardEvent) => {
    // 松开空格键
    if (e.code === 'Space' || e.key === ' ') {
      isPanning.value = false
      isDragging.value = false
    }
  }

  // --- 鼠标处理 (逻辑不变，但现在绑定在遮罩层上) ---
  const handleMouseDown = (e: MouseEvent) => {
    // 因为有遮罩层存在，肯定是 isPanning=true，直接开始拖拽
    isDragging.value = true
    lastX = e.clientX
    lastY = e.clientY
    // 阻止冒泡，不让 Fabric 收到事件
    e.stopPropagation()
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.value) {
      const deltaX = e.clientX - lastX
      const deltaY = e.clientY - lastY
      translateX.value += deltaX
      translateY.value += deltaY
      lastX = e.clientX
      lastY = e.clientY
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
  }

  // 全局重置 (防止 Alt+Tab 切出去后状态卡死)
  const resetInteractionState = () => {
    isPanning.value = false
    isDragging.value = false
  }

  onMounted(() => {
    if (canvasEl.value) emit('canvas-ready', canvasEl.value)
    if (workspaceEl.value) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          emit('workspace-resize', { width, height })
        }
      })
      resizeObserver.observe(workspaceEl.value)
    }

    // 监听键盘
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)

    // 安全性监听：鼠标移出窗口或失焦时重置
    window.addEventListener('mouseup', handleMouseUp) // 保持全局mouseup以防拖出div
    window.addEventListener('blur', resetInteractionState)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('blur', resetInteractionState)
  })

  // ... panToCenter, resetView, defineExpose 保持不变 ...
  const panToCenter = (targetX: number, targetY: number, canvasWidth: number, canvasHeight: number) => {
    // 1. 获取当前的缩放比例 (例如 0.5)
    const scale = props.zoomLevel / 100

    // 2. 计算画布内部的距离 (画布像素)
    const distanceX = canvasWidth / 2 - targetX
    const distanceY = canvasHeight / 2 - targetY

    // 3. 转换为屏幕像素 (Screen Pixels)
    // 必须乘以 scale，因为 translateX 是作用在视觉上的
    translateX.value = distanceX * scale
    translateY.value = distanceY * scale
  }
  const resetView = () => {
    translateX.value = 0
    translateY.value = 0
  }
  defineExpose({ panToCenter })
</script>

<template>
  <div
    class="bg-gray-100 flex-1 relative overflow-hidden flex items-start justify-center p-10 select-none"
    ref="workspaceEl"
    @dragover.prevent
    @drop="handleDrop"
    @wheel.ctrl.prevent="$emit('update-zoom', $event.deltaY > 0 ? -5 : 5)">
    <!--
      内容包裹层
      注意：这里移除了原本挂在最外层的 mousedown/mousemove，移到了遮罩层上
    -->
    <!-- 🟢 [新增] Loading 遮罩层 -->
    <!-- 当 !isLoaded 时显示，居中悬浮 -->
    <div v-if="!isLoaded" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-100">
      <!-- 转圈动画 -->
      <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p class="mt-4 text-sm text-gray-500 font-medium tracking-wide">初始化设计器...</p>
    </div>
    <div
      class="relative shadow-lg bg-white transition-transform ease-out will-change-transform"
      :class="isDragging ? 'duration-0' : 'duration-200'"
      :style="{
        transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`,
        transformOrigin: 'center top'
      }">
      <canvas ref="canvasEl"></canvas>
      <div v-if="showGrid" class="absolute inset-0 pointer-events-none z-10 grid-pattern"></div>

      <!--
         🟢 [核心修复] 平移遮罩层 (Interaction Overlay)
         1. v-show="isPanning": 只有按住空格时才出现
         2. z-index: 50: 保证盖在 Fabric 画布(z-index通常是0-1)上面
         3. cursor: grab: 强制显示抓手，Fabric 无法覆盖
         4. 事件: 专门接管平移拖拽
      -->
      <div
        v-show="isPanning"
        class="absolute inset-0 z-50"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @mousedown.stop="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"></div>
    </div>

    <!-- 复位按钮 -->
    <div v-if="translateX !== 0 || translateY !== 0" class="absolute bottom-4 right-4 z-20">
      <button
        @click="resetView"
        class="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg opacity-80 hover:opacity-100 transition">
        复位视图
      </button>
    </div>
  </div>
</template>

<style scoped>
  .grid-pattern {
    background-size: 20px 20px;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  }
</style>
