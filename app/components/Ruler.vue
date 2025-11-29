<script setup lang="ts">
  import { onMounted, ref, watch, computed } from 'vue'

  const props = defineProps<{
    direction: 'horizontal' | 'vertical' // 方向
    zoom: number // 缩放比例 (100 = 1x)
    offset: number // 平移偏移量 (px)
    width: number // 容器宽
    height: number // 容器高
    startParam: number // 标尺起始的屏幕坐标偏移 (通常是 padding)
  }>()

  const emit = defineEmits(['create-guide'])

  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const isDragging = ref(false)
  const dragPos = ref(0) // 拖拽时的临时位置

  // 1. 绘制标尺核心逻辑
  const drawRuler = () => {
    if (!canvasEl.value || !ctx.value) return
    const c = canvasEl.value
    const context = ctx.value
    const isH = props.direction === 'horizontal'
    const scale = props.zoom / 100

    const dpr = window.devicePixelRatio || 1

    // 🟢 [修改] 将 20 改为 30 (标尺厚度)
    const rulerThick = 30
    const rectW = isH ? props.width : rulerThick
    const rectH = isH ? rulerThick : props.height

    c.width = rectW * dpr
    c.height = rectH * dpr
    c.style.width = `${rectW}px`
    c.style.height = `${rectH}px`
    context.scale(dpr, dpr)

    // 背景
    context.fillStyle = '#f9fafb'
    context.fillRect(0, 0, rectW, rectH)

    // 🟢 [修改] 颜色加深一点，让字更清晰
    context.strokeStyle = '#9ca3af'
    context.fillStyle = '#4b5563' // 字体颜色加深
    context.font = '10px sans-serif'
    context.lineWidth = 1

    // 边框线
    context.beginPath()
    if (isH) {
      context.moveTo(0, rulerThick)
      context.lineTo(rectW, rulerThick)
    } else {
      context.moveTo(rulerThick, 0)
      context.lineTo(rulerThick, rectH)
    }
    context.stroke()

    // 刻度逻辑
    let step = 50
    if (scale >= 2) step = 25
    if (scale <= 0.5) step = 100
    if (scale <= 0.25) step = 200

    const length = isH ? props.width : props.height
    const startPixel = -props.offset
    const startVal = Math.floor((startPixel - props.startParam) / scale / step) * step
    const endVal = startVal + length / scale + step * 2

    context.beginPath()

    // 🟢 [修改] 增加刻度线长度，使其配合 30px 的宽度更好看
    const tickSizeMajor = 18 // 长刻度
    const tickSizeMinor = 6 // 短刻度

    for (let val = startVal; val <= endVal; val += step / 10) {
      const v = Math.round(val)
      const pos = v * scale + props.offset + props.startParam

      if (pos < 0 || pos > length) continue

      const isMajor = v % step === 0

      // 🟢 [修改] 绘制逻辑适配 30px
      if (isH) {
        // 水平标尺
        context.moveTo(pos, rulerThick)
        context.lineTo(pos, rulerThick - (isMajor ? tickSizeMajor : tickSizeMinor))
        if (isMajor) {
          // 文字往上提一点，往右移一点
          context.fillText(v.toString(), pos + 4, 12)
        }
      } else {
        // 垂直标尺
        context.moveTo(rulerThick, pos)
        context.lineTo(rulerThick - (isMajor ? tickSizeMajor : tickSizeMinor), pos)
        if (isMajor) {
          // 垂直文字：旋转90度显示，或者简单点只显示数字
          context.save()
          context.translate(rulerThick - 20, pos + 3) // 调整文字位置
          // 如果想旋转文字：
          context.rotate(-Math.PI / 2)
          context.fillText(v.toString(), 0, 0)

          // 如果不旋转（数字正着显示，建议用这个，看起来不累）：
          // context.fillText(v.toString(), 2, pos + 3)

          context.restore()
        }
      }
    }
    context.stroke()
  }

  // 监听变化重绘
  watch(() => [props.zoom, props.offset, props.width, props.height], drawRuler)

  onMounted(() => {
    ctx.value = canvasEl.value?.getContext('2d') || null
    drawRuler()
  })

  // --- 拖拽交互 ---
  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true
    // 记录初始位置 (相对于视口)
    updateDragPos(e)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const updateDragPos = (e: MouseEvent) => {
    // 获取组件在屏幕的位置
    const rect = canvasEl.value?.getBoundingClientRect()
    if (!rect) return
    if (props.direction === 'horizontal') {
      dragPos.value = e.clientY
    } else {
      dragPos.value = e.clientX
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    updateDragPos(e)
  }

  const handleMouseUp = (e: MouseEvent) => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // 计算放置位置是否在有效区域
    // 简单判断：如果拖出了一定距离，就认为是添加
    const rect = canvasEl.value?.getBoundingClientRect()
    if (!rect) return

    let dropPos = 0
    let isValid = false

    if (props.direction === 'horizontal') {
      // 垂直位置 > 标尺高度，说明拖到了画布区域
      if (e.clientY > rect.bottom) {
        isValid = true
        // 这里的 dropPos 是屏幕坐标，我们需要发给父组件，由父组件转为 Canvas 坐标
        // 但为了解耦，我们传出的就是“相对于 Workspace 的像素位置”
        // 注意：这里的 e.clientY 是全局坐标
        // 我们需要减去 Workspace 的 top，这比较麻烦。
        // 最简单的：直接传全局 clientX/Y，让 index.vue 去处理坐标转换 (use logic from drop-element)
        emit('create-guide', { axis: 'h', val: e.clientY })
      }
    } else {
      if (e.clientX > rect.right) {
        isValid = true
        emit('create-guide', { axis: 'v', val: e.clientX })
      }
    }
  }
</script>

<template>
  <div
    class="relative select-none bg-gray-50 overflow-hidden"
    :class="direction === 'horizontal' ? 'w-full h-[20px] cursor-ns-resize' : 'h-full w-[20px] cursor-ew-resize'"
    @mousedown.prevent="handleMouseDown">
    <canvas ref="canvasEl" class="block"></canvas>

    <!-- 拖拽时的虚线指示器 (Portal 到 Body 或者 fixed 定位) -->
    <Teleport to="body">
      <div
        v-if="isDragging"
        class="fixed z-[9999] border-dashed border-cyan-500 pointer-events-none"
        :style="{
          left: direction === 'horizontal' ? '0' : dragPos + 'px',
          top: direction === 'horizontal' ? dragPos + 'px' : '0',
          width: direction === 'horizontal' ? '100vw' : '1px',
          height: direction === 'horizontal' ? '1px' : '100vh',
          borderTopWidth: direction === 'horizontal' ? '1px' : '0',
          borderLeftWidth: direction === 'horizontal' ? '0' : '1px'
        }">
        <div class="absolute bg-cyan-500 text-white text-[10px] px-1 rounded transform translate-x-2 translate-y-2">
          <!-- 这里暂时只显示参考，不显示具体数值，因为还没转换坐标 -->
          Guide
        </div>
      </div>
    </Teleport>
  </div>
</template>
