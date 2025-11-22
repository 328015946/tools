<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('joiner.title') }}</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧配置 -->
      <div class="lg:col-span-1 space-y-4">
        <div class="bg-white p-4 rounded-xl border shadow-sm space-y-4">
          <button
            @click="triggerUpload"
            class="w-full py-3 border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition">
            + {{ $t('joiner.add_images') }}
          </button>
          <input type="file" ref="fileInput" multiple accept="image/*" class="hidden" @change="handleFiles" />

          <!-- 优化后的方向选择器 -->
          <div class="grid grid-cols-2 gap-3">
            <!-- 竖排按钮 -->
            <label
              class="cursor-pointer relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all duration-200 group"
              :class="
                direction === 'v'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-gray-50'
              ">
              <input type="radio" v-model="direction" value="v" class="hidden" />
              <!-- 图标: 两个竖着的方块 -->
              <div
                class="flex flex-col gap-1 mb-1 opacity-50 group-hover:opacity-100"
                :class="{ 'opacity-100': direction === 'v' }">
                <div class="w-4 h-3 bg-current rounded-sm"></div>
                <div class="w-4 h-3 bg-current rounded-sm"></div>
              </div>
              <span class="text-xs font-bold">{{ $t('joiner.vertical') }}</span>
              <!-- 选中标记 (可选) -->
              <div v-if="direction === 'v'" class="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
            </label>

            <!-- 横排按钮 -->
            <label
              class="cursor-pointer relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all duration-200 group"
              :class="
                direction === 'h'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-gray-50'
              ">
              <input type="radio" v-model="direction" value="h" class="hidden" />
              <!-- 图标: 两个横着的方块 -->
              <div
                class="flex gap-1 mb-1 opacity-50 group-hover:opacity-100"
                :class="{ 'opacity-100': direction === 'h' }">
                <div class="w-3 h-4 bg-current rounded-sm"></div>
                <div class="w-3 h-4 bg-current rounded-sm"></div>
              </div>
              <span class="text-xs font-bold">{{ $t('joiner.horizontal') }}</span>
              <div v-if="direction === 'h'" class="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
            </label>
          </div>

          <button
            @click="download"
            :disabled="images.length === 0"
            class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
            {{ $t('joiner.download') }}
          </button>

          <button @click="images = []" class="w-full py-2 text-red-500 text-sm hover:underline">
            {{ $t('joiner.clear') }}
          </button>
        </div>
      </div>

      <!-- 右侧预览 -->
      <div
        class="lg:col-span-2 bg-gray-100 border rounded-xl p-4 min-h-[400px] overflow-auto flex items-start justify-center">
        <canvas ref="canvasRef" class="max-w-full shadow-lg bg-white"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const fileInput = ref<HTMLInputElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const images = ref<HTMLImageElement[]>([])
  const direction = ref('v')

  const triggerUpload = () => fileInput.value?.click()

  const handleFiles = (e: Event) => {
    const files = (e.target as HTMLInputElement).files
    if (!files) return

    Array.from(files).forEach(file => {
      const img = new Image()
      img.onload = () => {
        images.value.push(img)
        draw()
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const draw = () => {
    if (!canvasRef.value || images.value.length === 0) return
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return

    let totalW = 0,
      totalH = 0

    if (direction.value === 'v') {
      // 竖排：宽度取最大，高度累加
      totalW = Math.max(...images.value.map(i => i.width))
      totalH = images.value.reduce((sum, i) => sum + i.height, 0)
    } else {
      // 横排：高度取最大，宽度累加
      totalH = Math.max(...images.value.map(i => i.height))
      totalW = images.value.reduce((sum, i) => sum + i.width, 0)
    }

    canvasRef.value.width = totalW
    canvasRef.value.height = totalH

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, totalW, totalH)

    let offset = 0
    images.value.forEach(img => {
      if (direction.value === 'v') {
        // 居中绘制
        const x = (totalW - img.width) / 2
        ctx.drawImage(img, x, offset)
        offset += img.height
      } else {
        const y = (totalH - img.height) / 2
        ctx.drawImage(img, offset, y)
        offset += img.width
      }
    })
  }

  watch(direction, draw)

  const download = () => {
    if (!canvasRef.value) return
    const link = document.createElement('a')
    link.download = 'joined.png'
    link.href = canvasRef.value.toDataURL('image/png')
    link.click()
  }

  useHead({ title: t('joiner.title') + ' - NuxtTools' })
</script>
