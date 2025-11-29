<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:47:10
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-29 11:39:03
 * @FilePath: \xiao-nuxt4\app\components\EditorWorkspace.vue
 * @Description: 注释
-->
<script setup lang="ts">
  import { onMounted, onUnmounted, ref } from 'vue'
  import Ruler from './Ruler.vue' // [新增] 引入

  const props = defineProps<{
    zoomLevel: number
    showGrid?: boolean
    isLoaded?: boolean //
  }>()

  const emit = defineEmits(['canvas-ready', 'update-zoom', 'drop-element', 'workspace-resize', 'add-guide-at'])

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const workspaceEl = ref<HTMLDivElement | null>(null)

  const translateX = ref(0)
  const translateY = ref(0)
  const isPanning = ref(false)
  const isDragging = ref(false)

  let lastX = 0
  let lastY = 0
  let resizeObserver: ResizeObserver | null = null
  // [新增] 记录容器大小，传给标尺
  const containerSize = ref({ width: 0, height: 0 })

  // ... handleDrop, handleKeydown 等保持不变 ...
  // [新增] 引入 ref
  const canvasWrapperEl = ref<HTMLDivElement | null>(null)

  // [重写] 核心修复函数
  const handleCreateGuide = ({ axis, val }: { axis: 'h' | 'v'; val: number }) => {
    // 必须确保拿到了内部的白色包裹层
    if (!canvasWrapperEl.value) return

    // 1. 获取白色画布 DOM 在浏览器屏幕上的绝对位置 (Bounding Rect)
    // 这个 rect.left/top 已经包含了：平移、缩放、居中偏移、padding 等所有 CSS 因素的结果
    const rect = canvasWrapperEl.value.getBoundingClientRect()

    // 2. 获取当前的缩放比例
    const scale = props.zoomLevel / 100

    // 3. 计算相对坐标
    // 鼠标屏幕坐标 (val) - 画布屏幕坐标 (rect) = 鼠标相对于画布左上角的“屏幕像素距离”
    const screenDelta = val - (axis === 'h' ? rect.top : rect.left)

    // 4. 转换为 Canvas 内部逻辑坐标
    // 屏幕像素距离 / 缩放比例 = Canvas 内部坐标
    const canvasPos = screenDelta / scale

    emit('add-guide-at', { axis, position: canvasPos })
  }
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
          containerSize.value = { width, height } // [新增]
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
  defineExpose({ panToCenter, resetView })
</script>

<template>
  <!--
    [修改] 布局结构变化
    最外层变成 grid 布局：
    [左上角空白] [水平标尺]
    [垂直标尺]   [内容视口]
  -->
  <div class="flex-1 grid grid-cols-[30px_1fr] grid-rows-[30px_1fr] bg-gray-200 overflow-hidden relative">
    <!-- 左上角方块 -->
    <div class="bg-gray-50 border-r border-b border-gray-300 z-20"></div>

    <!-- 水平标尺 -->
    <Ruler
      direction="horizontal"
      :width="containerSize.width"
      :height="0"
      :zoom="zoomLevel"
      :offset="translateX"
      :start-param="16"
      @create-guide="handleCreateGuide"
      class="z-10 border-b border-gray-300" />

    <!-- 垂直标尺 -->
    <Ruler
      direction="vertical"
      :width="0"
      :height="containerSize.height"
      :zoom="zoomLevel"
      :offset="translateY"
      :start-param="16"
      @create-guide="handleCreateGuide"
      class="z-10 border-r border-gray-300" />

    <!-- 真正的内容工作区 (原 workspaceEl) -->
    <!-- 注意：这里的 ref="workspaceEl" 必须加上，用于计算尺寸 -->
    <!-- 这里的 @dragover 等事件保持不变 -->
    <div
      class="bg-gray-100 relative overflow-hidden flex items-start justify-center p-4 select-none z-0"
      ref="workspaceEl"
      @dragover.prevent
      @drop="handleDrop"
      @wheel.ctrl.prevent="$emit('update-zoom', $event.deltaY > 0 ? -5 : 5)">
      <!-- 原有的 Loading, Canvas Wrapper, Controls 逻辑完全照搬过来 -->
      <div v-if="!isLoaded" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-100">
        <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>

      <div
        ref="canvasWrapperEl"
        class="relative shadow-lg bg-white transition-transform ease-out will-change-transform"
        :class="isDragging ? 'duration-0' : 'duration-200'"
        :style="{
          transform: `translate(${translateX}px, ${translateY}px) scale(${zoomLevel / 100})`,
          transformOrigin: 'center top'
        }">
        <canvas ref="canvasEl"></canvas>
        <div v-if="showGrid" class="absolute inset-0 pointer-events-none z-10 grid-pattern"></div>

        <!-- 平移遮罩 -->
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
        <button @click="resetView" class="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
          复位
        </button>
      </div>
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
