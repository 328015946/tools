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

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">修复算法</label>
            <select
              v-model="selectedAlgorithm"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-200">
              <option value="texture">纹理填充 (效果好)</option>
              <option value="pixel">像素扩散 (速度快)</option>
              <option value="average">均值填充 (适合纯色)</option>
              <option value="horizontal">水平填充 (适合横纹)</option>
              <option value="vertical">垂直填充 (适合竖纹/衣物)</option>
            </select>
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
            v-if="hasImage"
            @click="resetImage"
            class="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            {{ t('watermark_remover.reset') || '重置图片' }}
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
  const selectedAlgorithm = ref('texture')
  const resultImage = ref<string | null>(null)
  const originalImageUrl = ref<string | null>(null)

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
      originalImageUrl.value = data // 保存原始图片用于重置
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

  const resetImage = () => {
    if (!originalImageUrl.value || !fabricCanvas.value) return

    fabric.FabricImage.fromURL(originalImageUrl.value).then(img => {
      const canvas = fabricCanvas.value!
      const bgColor = canvas.backgroundColor
      canvas.clear()
      canvas.backgroundColor = bgColor
      canvas.backgroundImage = img
      canvas.renderAll()

      // 恢复画笔状态
      const brush = new fabric.PencilBrush(canvas)
      brush.color = 'rgba(255, 0, 0, 0.5)'
      brush.width = brushSize.value
      canvas.freeDrawingBrush = brush
      canvas.isDrawingMode = true
      isDrawing.value = true
      resultImage.value = null
    })
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
      let resultImageData: ImageData
      if (selectedAlgorithm.value === 'texture') {
        resultImageData = inpaintTextureSynthesis(imgData, maskData)
      } else if (selectedAlgorithm.value === 'pixel') {
        resultImageData = inpaintPixelDiffusion(imgData, maskData)
      } else if (selectedAlgorithm.value === 'average') {
        resultImageData = inpaintAverage(imgData, maskData)
      } else if (selectedAlgorithm.value === 'horizontal') {
        resultImageData = inpaintHorizontal(imgData, maskData)
      } else {
        resultImageData = inpaintVertical(imgData, maskData)
      }

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

  // 算法1：纹理合成 (Patch-based Inpainting) - 效果较好，适合复杂背景
  function inpaintTextureSynthesis(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    // 标记遮罩区域: 0 = valid, 1 = mask
    const isMask = new Uint8Array(width * height)
    let totalMaskPixels = 0

    for (let i = 0; i < width * height; i++) {
      if (mask[i * 4] > 100) {
        isMask[i] = 1
        totalMaskPixels++
      }
    }

    if (totalMaskPixels === 0) return imgData

    // 搜索配置
    const searchRadius = 20 // 搜索半径，越大越慢但效果越好
    const patchSize = 3 // 补丁大小 (3x3)
    const halfPatch = 1
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

          // 只处理当前边界上的遮罩像素
          if (isMask[idx] === 1) {
            let validNeighbors = 0

            // 1. 检查是否有有效邻居
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue
                const nx = x + dx,
                  ny = y + dy
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && isMask[ny * width + nx] === 0) {
                  validNeighbors++
                }
              }
            }

            if (validNeighbors > 0) {
              // 这是一个边界像素，尝试修复

              // 策略：在周围随机采样寻找最佳匹配块 (Texture Synthesis)
              let bestR = 0,
                bestG = 0,
                bestB = 0
              let minError = Number.MAX_VALUE
              let foundMatch = false

              // 尝试采样次数 (性能与质量的权衡)
              const samples = 10

              for (let k = 0; k < samples; k++) {
                // 随机取样点
                const sx = x + Math.floor((Math.random() - 0.5) * 2 * searchRadius)
                const sy = y + Math.floor((Math.random() - 0.5) * 2 * searchRadius)

                if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue

                const sIdx = sy * width + sx
                if (isMask[sIdx] === 1) continue // 样本点必须是有效的

                // 计算 3x3 补丁差异
                let error = 0
                let count = 0

                for (let py = -halfPatch; py <= halfPatch; py++) {
                  for (let px = -halfPatch; px <= halfPatch; px++) {
                    const tx = x + px,
                      ty = y + py
                    const sourceX = sx + px,
                      sourceY = sy + py

                    if (
                      tx >= 0 &&
                      tx < width &&
                      ty >= 0 &&
                      ty < height &&
                      sourceX >= 0 &&
                      sourceX < width &&
                      sourceY >= 0 &&
                      sourceY < height
                    ) {
                      const tIdx = ty * width + tx
                      // 只比较目标区域中已知的像素
                      if (isMask[tIdx] === 0) {
                        const sOff = (sourceY * width + sourceX) * 4
                        const tOff = tIdx * 4

                        const dr = data[tOff] - data[sOff]
                        const dg = data[tOff + 1] - data[sOff + 1]
                        const db = data[tOff + 2] - data[sOff + 2]
                        error += dr * dr + dg * dg + db * db
                        count++
                      }
                    }
                  }
                }

                if (count > 0) {
                  error = error / count
                  if (error < minError) {
                    minError = error
                    const bestOff = sIdx * 4
                    bestR = data[bestOff]
                    bestG = data[bestOff + 1]
                    bestB = data[bestOff + 2]
                    foundMatch = true
                  }
                }
              }

              const off = idx * 4

              if (foundMatch) {
                // 使用找到的最佳匹配
                nextData[off] = bestR
                nextData[off + 1] = bestG
                nextData[off + 2] = bestB
                nextData[off + 3] = 255
              } else {
                // 没找到匹配（比如孤立点），回退到简单的均值模糊
                let rSum = 0,
                  gSum = 0,
                  bSum = 0,
                  count = 0
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx,
                      ny = y + dy
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && isMask[ny * width + nx] === 0) {
                      const nOff = (ny * width + nx) * 4
                      rSum += data[nOff]
                      gSum += data[nOff + 1]
                      bSum += data[nOff + 2]
                      count++
                    }
                  }
                }
                if (count > 0) {
                  nextData[off] = Math.floor(rSum / count)
                  nextData[off + 1] = Math.floor(gSum / count)
                  nextData[off + 2] = Math.floor(bSum / count)
                  nextData[off + 3] = 255
                }
              }

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

  // 算法2：像素扩散 (Pixel Diffusion) - 速度快，适合纯色或简单背景
  function inpaintPixelDiffusion(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    const isMask = new Uint8Array(width * height)
    let totalMaskPixels = 0

    for (let i = 0; i < width * height; i++) {
      if (mask[i * 4] > 100) {
        isMask[i] = 1
        totalMaskPixels++
      }
    }

    if (totalMaskPixels === 0) return imgData

    const maxIterations = 500
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

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue
                const nx = x + dx,
                  ny = y + dy
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && isMask[ny * width + nx] === 0) {
                  const off = (ny * width + nx) * 4
                  rSum += data[off]
                  gSum += data[off + 1]
                  bSum += data[off + 2]
                  count++
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

  // 算法3：均值填充 (Average Fill) - 极快，适合纯色背景的小污点
  function inpaintAverage(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0

    // 扫描边界像素计算平均值
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (mask[idx * 4] > 100) continue // 跳过遮罩区域

        // 检查是否是边界（即邻居中有遮罩）
        let isBoundary = false
        if (
          (x > 0 && mask[(idx - 1) * 4] > 100) ||
          (x < width - 1 && mask[(idx + 1) * 4] > 100) ||
          (y > 0 && mask[(idx - width) * 4] > 100) ||
          (y < height - 1 && mask[(idx + width) * 4] > 100)
        ) {
          isBoundary = true
        }

        if (isBoundary) {
          const off = idx * 4
          rSum += data[off]
          gSum += data[off + 1]
          bSum += data[off + 2]
          count++
        }
      }
    }

    if (count === 0) return imgData

    const avgR = Math.floor(rSum / count)
    const avgG = Math.floor(gSum / count)
    const avgB = Math.floor(bSum / count)

    // 填充所有遮罩区域
    for (let i = 0; i < width * height; i++) {
      if (mask[i * 4] > 100) {
        const off = i * 4
        data[off] = avgR
        data[off + 1] = avgG
        data[off + 2] = avgB
        data[off + 3] = 255
      }
    }
    return imgData
  }

  // 算法4：水平填充 (Horizontal Fill) - 适合横向纹理或文字
  function inpaintHorizontal(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (mask[idx * 4] > 100) {
          // 找到当前行的遮罩段
          let startX = x
          while (x < width && mask[(y * width + x) * 4] > 100) x++
          let endX = x

          // 获取左右两侧颜色
          let rL = 0,
            gL = 0,
            bL = 0,
            hasL = false
          if (startX > 0) {
            const off = (y * width + startX - 1) * 4
            rL = data[off]
            gL = data[off + 1]
            bL = data[off + 2]
            hasL = true
          }
          let rR = 0,
            gR = 0,
            bR = 0,
            hasR = false
          if (endX < width) {
            const off = (y * width + endX) * 4
            rR = data[off]
            gR = data[off + 1]
            bR = data[off + 2]
            hasR = true
          }

          // 线性插值填充
          for (let k = startX; k < endX; k++) {
            const off = (y * width + k) * 4
            let ratio = 0.5
            if (hasL && hasR) ratio = (k - startX + 1) / (endX - startX + 1)
            else if (hasL) ratio = 0
            else if (hasR) ratio = 1

            data[off] = rL * (1 - ratio) + rR * ratio
            data[off + 1] = gL * (1 - ratio) + gR * ratio
            data[off + 2] = bL * (1 - ratio) + bR * ratio
            data[off + 3] = 255
          }
        }
      }
    }
    return imgData
  }

  // 算法5：垂直填充 (Vertical Fill) - 适合竖向纹理或衣物褶皱
  function inpaintVertical(imgData: ImageData, maskData: ImageData): ImageData {
    const { width, height, data } = imgData
    const mask = maskData.data

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const idx = y * width + x
        if (mask[idx * 4] > 100) {
          // 找到当前列的遮罩段
          let startY = y
          while (y < height && mask[(y * width + x) * 4] > 100) y++
          let endY = y

          // 获取上下两侧颜色
          let rT = 0,
            gT = 0,
            bT = 0,
            hasT = false
          if (startY > 0) {
            const off = ((startY - 1) * width + x) * 4
            rT = data[off]
            gT = data[off + 1]
            bT = data[off + 2]
            hasT = true
          }
          let rB = 0,
            gB = 0,
            bB = 0,
            hasB = false
          if (endY < height) {
            const off = (endY * width + x) * 4
            rB = data[off]
            gB = data[off + 1]
            bB = data[off + 2]
            hasB = true
          }

          // 线性插值填充
          for (let k = startY; k < endY; k++) {
            const off = (k * width + x) * 4
            let ratio = 0.5
            if (hasT && hasB) ratio = (k - startY + 1) / (endY - startY + 1)
            else if (hasT) ratio = 0
            else if (hasB) ratio = 1

            data[off] = rT * (1 - ratio) + rB * ratio
            data[off + 1] = gT * (1 - ratio) + gB * ratio
            data[off + 2] = bT * (1 - ratio) + bB * ratio
            data[off + 3] = 255
          }
        }
      }
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
