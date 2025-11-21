<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <!-- 标题 -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('img.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('img.desc') }}</p>
    </div>

    <!-- 1. 上传区域 (如果没有文件时显示) -->
    <div
      v-if="!originalFile"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer bg-gray-50 hover:bg-gray-100"
      :class="isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'">
      <input type="file" accept="image/*" class="hidden" ref="fileInput" @change="handleFileSelect" />

      <div class="flex flex-col items-center justify-center" @click="triggerUpload">
        <div
          class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
          🖼️
        </div>
        <h3 class="text-lg font-medium text-gray-900">{{ $t('img.drop_zone') }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ $t('img.supports') }}</p>
      </div>
    </div>

    <!-- 2. 操作与预览区域 (有文件时显示) -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 文件信息卡片 -->
        <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <span class="font-bold text-gray-700 truncate max-w-[200px]">{{ originalFile.name }}</span>
            <button @click="reset" class="text-xs text-red-500 hover:underline">❌ Close</button>
          </div>
          <div class="text-sm text-gray-500">{{ formatSize(originalFile.size) }}</div>
        </div>

        <!-- 参数调节 -->
        <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <!-- 质量滑块 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">{{ $t('img.quality') }}</label>
              <span class="text-sm font-mono text-emerald-600"
                >{{ Math.round(options.maxSizeMB * 100) / 100 }} MB (Limit)</span
              >
            </div>
            <!--
              browser-image-compression 使用 maxSizeMB 来控制，或者 useWebWorker
              这里我们稍微变通一下，让用户控制“目标大小”或者直接使用 initialQuality (如果你用别的库)
              这个库主要通过 maxSizMB 控制。为了简单，我们这里把滑块映射为 0.1MB - 5MB
            -->
            <input
              type="range"
              v-model.number="options.maxSizeMB"
              min="0.1"
              max="5"
              step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              @change="compressImage" />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>Low (0.1MB)</span>
              <span>High (5MB)</span>
            </div>
          </div>

          <!-- 最大宽度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">{{ $t('img.max_width') }}</label>
              <span class="text-sm font-mono text-gray-600">{{ options.maxWidthOrHeight }}px</span>
            </div>
            <input
              type="range"
              v-model.number="options.maxWidthOrHeight"
              min="100"
              max="4096"
              step="100"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              @change="compressImage" />
          </div>

          <!-- 重新压缩按钮 (有时候拖动滑块太频繁，可以手动点) -->
          <button
            @click="compressImage"
            :disabled="isCompressing"
            class="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
            {{ isCompressing ? $t('img.compressing') : $t('img.re_compress') }}
          </button>
        </div>

        <!-- 下载区域 -->
        <div v-if="compressedUrl" class="bg-emerald-50 p-6 rounded-xl border border-emerald-100 text-center">
          <div class="text-emerald-800 font-medium mb-1">{{ $t('img.saved') }} {{ savedPercentage }}%</div>
          <div class="text-sm text-emerald-600 mb-4">
            {{ formatSize(originalFile.size) }} → <strong>{{ formatSize(compressedFile?.size || 0) }}</strong>
          </div>
          <a
            :href="compressedUrl"
            :download="`min_${originalFile.name}`"
            class="block w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold shadow-lg shadow-emerald-500/30">
            {{ $t('img.download') }}
          </a>
        </div>
      </div>

      <!-- 右侧：预览区域 -->
      <div
        class="lg:col-span-2 bg-gray-100 rounded-xl p-4 flex items-center justify-center min-h-[400px] border border-gray-200 relative overflow-hidden">
        <!-- 加载遮罩 -->
        <div
          v-if="isCompressing"
          class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
        </div>

        <div class="grid grid-cols-2 gap-4 w-full h-full">
          <!-- 原图 -->
          <div class="flex flex-col h-full">
            <div class="text-center text-xs text-gray-500 mb-2 uppercase tracking-wide">{{ $t('img.original') }}</div>
            <div
              class="flex-grow bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center p-2 relative checkerboard">
              <img v-if="originalUrl" :src="originalUrl" class="max-w-full max-h-[400px] object-contain" />
            </div>
          </div>
          <!-- 压缩图 -->
          <div class="flex flex-col h-full">
            <div class="text-center text-xs text-emerald-600 mb-2 uppercase tracking-wide font-bold">
              {{ $t('img.compressed') }}
            </div>
            <div
              class="flex-grow bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center p-2 relative checkerboard border-2 border-emerald-100">
              <img v-if="compressedUrl" :src="compressedUrl" class="max-w-full max-h-[400px] object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import imageCompression from 'browser-image-compression'

  const { t } = useI18n()

  // 状态
  const isDragging = ref(false)
  const isCompressing = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  const originalFile = ref<File | null>(null)
  const compressedFile = ref<File | null>(null)

  const originalUrl = ref('')
  const compressedUrl = ref('')

  // 压缩选项
  const options = reactive({
    maxSizeMB: 1, // 目标最大体积
    maxWidthOrHeight: 1920, // 限制分辨率
    useWebWorker: true
  })

  // 计算节省比例
  const savedPercentage = computed(() => {
    if (!originalFile.value || !compressedFile.value) return 0
    const saved = originalFile.value.size - compressedFile.value.size
    return Math.floor((saved / originalFile.value.size) * 100)
  })

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 触发文件选择
  const triggerUpload = () => {
    fileInput.value?.click()
  }

  const handleFileSelect = (event: Event) => {
    const files = (event.target as HTMLInputElement).files
    if (files && files[0]) processFile(files[0])
  }

  const handleDrop = (event: DragEvent) => {
    isDragging.value = false
    const files = event.dataTransfer?.files
    if (files && files[0]) processFile(files[0])
  }

  // 核心处理逻辑
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    reset() // 清理旧数据
    originalFile.value = file
    originalUrl.value = URL.createObjectURL(file)

    await compressImage()
  }

  const compressImage = async () => {
    if (!originalFile.value) return

    isCompressing.value = true
    try {
      // 调用库进行压缩
      const compressed = await imageCompression(originalFile.value, options)

      compressedFile.value = compressed

      // 释放旧的 URL
      if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
      compressedUrl.value = URL.createObjectURL(compressed)
    } catch (error) {
      console.error(error)
      alert('Compression failed')
    } finally {
      isCompressing.value = false
    }
  }

  const reset = () => {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
    if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)

    originalFile.value = null
    compressedFile.value = null
    originalUrl.value = ''
    compressedUrl.value = ''
  }

  // SEO
  useHead({
    title: t('img.title') + ' - NuxtTools',
    meta: [{ name: 'description', content: t('img.desc') }]
  })
</script>

<style scoped>
  /* 用于显示透明图片的棋盘格背景 */
  .checkerboard {
    background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
</style>
