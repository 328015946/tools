<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{{ t('watermark_remover.title') }}</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">{{ t('watermark_remover.desc') }}</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="triggerUpload"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition flex items-center gap-2">
            <span class="i-lucide-upload"></span> {{ t('watermark_remover.upload') }}
          </button>
          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Controls -->
        <div class="lg:col-span-1 flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm h-fit">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ t('watermark_remover.brush_size') }}: {{ brushSize }}px</label
            >
            <input
              type="range"
              v-model.number="brushSize"
              min="5"
              max="100"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          </div>

          <div class="flex gap-2">
            <button
              @click="toggleDrawingMode"
              :class="[
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition border',
                isDrawing
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
              ]">
              {{ isDrawing ? t('watermark_remover.drawing') : t('watermark_remover.start_draw') }}
            </button>
            <button
              @click="clearMask"
              class="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition"
              :title="t('watermark_remover.clear')">
              {{ t('watermark_remover.clear') }}
            </button>
          </div>

          <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

          <button
            @click="processInpainting"
            :disabled="!hasImage || isProcessing"
            class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <span
              v-if="isProcessing"
              class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            {{ isProcessing ? t('watermark_remover.processing') : t('watermark_remover.remove_btn') }}
          </button>

          <button
            v-if="resultImage"
            @click="downloadResult"
            class="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            {{ t('watermark_remover.download') }}
          </button>
        </div>

        <!-- Canvas Area -->
        <div
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="[
            'lg:col-span-3 bg-gray-100 dark:bg-gray-900 rounded-xl shadow-inner overflow-hidden flex items-center justify-center min-h-[500px] relative border transition-colors',
            isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
          ]">
          <div v-if="!hasImage" class="text-center text-gray-400 pointer-events-none">
            <div class="text-6xl mb-4">🖼️</div>
            <p>{{ t('watermark_remover.placeholder') }}</p>
          </div>

          <!-- Canvas Container -->
          <div v-show="hasImage" class="relative shadow-lg">
            <canvas ref="canvasEl"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, shallowRef } from 'vue'
  import * as fabric from 'fabric'
  import { toast } from 'vue-sonner'
  // 如果需要使用 AI 模型，可以取消下面的注释并配置模型
  // import { pipeline, env } from '@xenova/transformers'

  const { t } = useI18n()

  const fileInput = ref<HTMLInputElement | null>(null)
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const fabricCanvas = shallowRef<fabric.Canvas | null>(null)

  const hasImage = ref(false)
  const isDrawing = ref(true)
  const isDragging = ref(false)
  const isProcessing = ref(false)
  const brushSize = ref(20)
  const resultImage = ref<string | null>(null)

  // 初始化 Canvas
  onMounted(() => {
    if (canvasEl.value) {
      const canvas = new fabric.Canvas(canvasEl.value, {
        isDrawingMode: true,
        backgroundColor: '#f3f4f6'
      })

      // 配置画笔
      const brush = new fabric.PencilBrush(canvas)
      brush.color = 'rgba(255, 0, 0, 0.5)' // 半透明红色用于显示遮罩
      brush.width = brushSize.value
      canvas.freeDrawingBrush = brush

      fabricCanvas.value = canvas
    }
  })

  // 监听笔刷大小变化
  watch(brushSize, newSize => {
    if (fabricCanvas.value && fabricCanvas.value.freeDrawingBrush) {
      fabricCanvas.value.freeDrawingBrush.width = newSize
    }
  })

  // 监听绘图模式
  watch(isDrawing, val => {
    if (fabricCanvas.value) {
      fabricCanvas.value.isDrawingMode = val
    }
  })

  const triggerUpload = () => {
    fileInput.value?.click()
  }

  const handleDragOver = () => {
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    // 防止拖拽到子元素时触发 leave
    if (e.currentTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      return
    }
    isDragging.value = false
  }

  const handleDrop = (e: DragEvent) => {
    isDragging.value = false
    const file = e.dataTransfer?.files[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) loadImage(file)
  }

  const loadImage = (file: File) => {
    if (!fabricCanvas.value) return
    const reader = new FileReader()
    reader.onload = f => {
      const data = f.target?.result as string
      fabric.FabricImage.fromURL(data).then(img => {
        const canvas = fabricCanvas.value!

        // 重置 Canvas
        canvas.clear()
        canvas.setDimensions({ width: img.width!, height: img.height! })

        // 设置背景图
        canvas.backgroundImage = img
        canvas.renderAll()

        // 调整 Canvas 大小以适应屏幕 (简单的缩放逻辑，实际项目中可优化)
        const maxWidth = 800
        if (img.width! > maxWidth) {
          const scale = maxWidth / img.width!
          canvas.setZoom(scale)
          canvas.setDimensions({ width: img.width! * scale, height: img.height! * scale })
        }

        hasImage.value = true
        resultImage.value = null

        // 重新设置画笔
        const brush = new fabric.PencilBrush(canvas)
        brush.color = 'rgba(255, 0, 0, 0.5)'
        brush.width = brushSize.value
        canvas.freeDrawingBrush = brush
        canvas.isDrawingMode = true
        isDrawing.value = true
      })
    }
    reader.readAsDataURL(file)
  }

  const toggleDrawingMode = () => {
    isDrawing.value = !isDrawing.value
  }

  const clearMask = () => {
    if (!fabricCanvas.value) return
    fabricCanvas.value.getObjects().forEach(obj => {
      // 清除所有绘制的路径
      if (obj.type === 'path') {
        fabricCanvas.value?.remove(obj)
      }
    })
  }

  const processInpainting = async () => {
    if (!fabricCanvas.value) return
    isProcessing.value = true

    try {
      const canvas = fabricCanvas.value
      const scale = canvas.getZoom()
      const width = canvas.width! / scale
      const height = canvas.height! / scale

      // 1. 获取原始图片数据
      const originalCanvas = document.createElement('canvas')
      originalCanvas.width = width
      originalCanvas.height = height
      const ctxOriginal = originalCanvas.getContext('2d')!

      // 绘制背景图（原图）
      if (canvas.backgroundImage instanceof fabric.FabricImage) {
        ctxOriginal.drawImage(canvas.backgroundImage.getElement(), 0, 0, width, height)
      }
      const imgData = ctxOriginal.getImageData(0, 0, width, height)

      // 2. 生成遮罩数据 (从 Fabric 路径)
      const bgImage = canvas.backgroundImage
      const originalBgColor = canvas.backgroundColor
      const paths = canvas.getObjects().filter(o => o.type === 'path')

      // 保存路径原始状态
      const pathStates = paths.map(p => ({ stroke: p.stroke, strokeWidth: p.strokeWidth }))

      // 设置导出状态：背景黑，路径白
      canvas.backgroundImage = undefined
      canvas.backgroundColor = 'black'
      paths.forEach(p => {
        p.stroke = 'white'
        // 稍微增加宽度以确保覆盖
        // @ts-ignore
        p.strokeWidth = p.strokeWidth || 1
      })
      canvas.renderAll()

      // 导出遮罩图片
      const maskUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 1 / scale
      })

      // 恢复原始状态
      canvas.backgroundImage = bgImage
      canvas.backgroundColor = originalBgColor
      paths.forEach((p, i) => {
        p.stroke = pathStates[i].stroke
        p.strokeWidth = pathStates[i].strokeWidth
      })
      canvas.renderAll()

      // 加载遮罩数据
      const maskImg = new Image()
      maskImg.src = maskUrl
      await new Promise(resolve => (maskImg.onload = resolve))

      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = width
      maskCanvas.height = height
      const ctxMask = maskCanvas.getContext('2d')!
      ctxMask.drawImage(maskImg, 0, 0, width, height)
      const maskData = ctxMask.getImageData(0, 0, width, height)

      // 3. 执行修复算法
      const resultImageData = performInpainting(imgData, maskData)

      // 将结果写回 Canvas
      const resultCanvas = document.createElement('canvas')
      resultCanvas.width = width
      resultCanvas.height = height
      resultCanvas.getContext('2d')!.putImageData(resultImageData, 0, 0)

      const resultUrl = resultCanvas.toDataURL()

      // 更新背景图
      fabric.FabricImage.fromURL(resultUrl).then(img => {
        const bgColor = canvas.backgroundColor
        canvas.clear() // 先清除遮罩和旧内容
        canvas.backgroundColor = bgColor // 恢复背景色(防止clear清除掉背景色)
        canvas.backgroundImage = img // 最后设置新背景
        canvas.renderAll()
        resultImage.value = resultUrl
        toast.success(t('watermark_remover.success'))
      })
    } catch (error) {
      console.error(error)
      toast.error(t('watermark_remover.error'))
    } finally {
      isProcessing.value = false
    }
  }

  // 简单的像素扩散修复算法 (Iterative Boundary Filling)
  function performInpainting(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    // 标记遮罩区域: 0 = valid, 1 = mask
    const isMask = new Uint8Array(width * height)
    let totalMaskPixels = 0

    for (let i = 0; i < width * height; i++) {
      if (mask[i * 4] > 100) {
        // 白色区域为遮罩
        isMask[i] = 1
        totalMaskPixels++
      }
    }

    if (totalMaskPixels === 0) return imgData

    const maxIterations = 500 // 防止死循环
    let iteration = 0

    while (totalMaskPixels > 0 && iteration < maxIterations) {
      iteration++
      let filledInPass = 0
      const nextData = new Uint8ClampedArray(data)
      const nextIsMask = new Uint8Array(isMask)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          if (isMask[idx] === 1) {
            let rSum = 0,
              gSum = 0,
              bSum = 0,
              count = 0

            // 检查 8 邻域
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue

                const nx = x + dx
                const ny = y + dy

                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = ny * width + nx
                  if (isMask[nIdx] === 0) {
                    const off = nIdx * 4
                    rSum += data[off]
                    gSum += data[off + 1]
                    bSum += data[off + 2]
                    count++
                  }
                }
              }
            }

            if (count > 0) {
              const off = idx * 4
              nextData[off] = Math.floor(rSum / count)
              nextData[off + 1] = Math.floor(gSum / count)
              nextData[off + 2] = Math.floor(bSum / count)
              nextData[off + 3] = 255
              nextIsMask[idx] = 0
              filledInPass++
              totalMaskPixels--
            }
          }
        }
      }

      data.set(nextData)
      isMask.set(nextIsMask)

      if (filledInPass === 0) break
    }

    return imgData
  }

  // 重新实现 processInpainting 中的核心逻辑，使用更可靠的 Mask 提取
  // 注意：为了代码简洁，这里展示了 UI 骨架。
  // 要使算法生效，建议在 index.html 或 nuxt.config 中引入 opencv.js
  // 或者使用 transformers.js (需要下载模型)

  const downloadResult = () => {
    if (!resultImage.value) return
    const link = document.createElement('a')
    link.download = 'removed-watermark.png'
    link.href = resultImage.value
    link.click()
  }
</script>

<style scoped>
  canvas {
    border: 1px solid #e5e7eb;
  }
</style>
