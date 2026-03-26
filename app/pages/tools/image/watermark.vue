<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('watermark.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('watermark.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 上传区 (未上传时显示大框，上传后变小或者隐藏) -->
        <div
          v-if="!imgSrc"
          @click="triggerUpload"
          class="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-emerald-400 transition">
          <span class="text-4xl mb-2">🖼️</span>
          <span class="text-sm text-gray-500">{{ $t('watermark.upload_text') }}</span>
          <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileSelect" />
        </div>

        <!-- 参数设置 (仅当有图片时显示) -->
        <div v-else class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5 animate-fade-in">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-gray-800">{{ $t('watermark.settings') }}</h3>
            <button @click="imgSrc = ''" class="text-xs text-red-500 hover:underline">Reset Image</button>
          </div>

          <!-- 文字内容 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('watermark.text') }}</label>
            <input
              type="text"
              v-model="config.text"
              :placeholder="$t('watermark.text_placeholder')"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <!-- 颜色 & 透明度 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('watermark.color') }}</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="config.color" class="w-8 h-8 p-0.5 border rounded cursor-pointer" />
                <span class="text-xs text-gray-500 uppercase">{{ config.color }}</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >{{ $t('watermark.opacity') }} ({{ config.alpha }})</label
              >
              <input
                type="range"
                v-model.number="config.alpha"
                min="0.1"
                max="1"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600" />
            </div>
          </div>

          <!-- 大小 & 旋转 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >{{ $t('watermark.size') }} ({{ config.fontSize }}px)</label
              >
              <input
                type="range"
                v-model.number="config.fontSize"
                min="12"
                max="100"
                step="2"
                class="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >{{ $t('watermark.rotate') }} ({{ config.angle }}°)</label
              >
              <input
                type="range"
                v-model.number="config.angle"
                min="-90"
                max="90"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600" />
            </div>
          </div>

          <!-- 间距 (密度) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('watermark.gap') }} ({{ config.gap }}px)</label
            >
            <input
              type="range"
              v-model.number="config.gap"
              min="50"
              max="500"
              step="10"
              class="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600" />
          </div>

          <!-- 下载按钮 -->
          <button
            @click="download"
            class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30">
            {{ $t('watermark.download') }}
          </button>
        </div>
      </div>

      <!-- 右侧：实时预览 Canvas -->
      <div
        class="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center min-h-[500px] overflow-hidden relative checkerboard">
        <div v-if="!imgSrc" class="text-gray-400 text-sm">Preview Area</div>

        <!-- Canvas 容器 -->
        <canvas ref="canvasRef" class="max-w-full max-h-[80vh] shadow-lg" v-show="imgSrc"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const fileInput = ref<HTMLInputElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const imgSrc = ref('')
  const originalImg = ref<HTMLImageElement | null>(null)

  // 水印配置
  const config = reactive({
    text: '小宾果 Watermark',
    color: '#ffffff',
    alpha: 0.5,
    fontSize: 24,
    angle: -30,
    gap: 200 // 间距
  })

  const triggerUpload = () => fileInput.value?.click()

  const handleFileSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = evt => {
      imgSrc.value = evt.target?.result as string
      const img = new Image()
      img.onload = () => {
        originalImg.value = img
        draw() // 图片加载完立即绘制
      }
      img.src = imgSrc.value
    }
    reader.readAsDataURL(file)
  }

  // 核心绘制逻辑 (Canvas)
  const draw = () => {
    if (!canvasRef.value || !originalImg.value) return
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return

    const img = originalImg.value
    const cvs = canvasRef.value

    // 1. 设置 Canvas 尺寸为图片真实尺寸
    cvs.width = img.width
    cvs.height = img.height

    // 2. 绘制原图
    ctx.drawImage(img, 0, 0)

    // 3. 绘制水印
    if (!config.text) return

    ctx.save() // 保存状态

    // 设置样式
    ctx.font = `bold ${config.fontSize}px sans-serif`
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.alpha
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 旋转角度 (Canvas 旋转比较麻烦，通常是移动坐标系 -> 旋转 -> 绘制 -> 移回)
    // 但对于平铺水印，更简单的做法是算出网格点，在每个点上单独旋转绘制

    // 计算平铺行列
    // 为了覆盖旋转后的空白，我们需要扩大绘制范围
    const diag = Math.sqrt(cvs.width * cvs.width + cvs.height * cvs.height)
    const step = config.gap + config.text.length * config.fontSize * 0.5 // 估算间距

    // 简单平铺算法
    for (let x = 0; x < cvs.width; x += step) {
      for (let y = 0; y < cvs.height; y += step / 2) {
        // 错位平铺
        // 奇偶行错位
        const offsetX = (y / (step / 2)) % 2 === 0 ? 0 : step / 2

        drawRotatedText(ctx, config.text, x + offsetX, y, config.angle)
      }
    }

    ctx.restore() // 恢复状态
  }

  // 辅助：在指定坐标绘制旋转文字
  const drawRotatedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, angleDeg: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angleDeg * Math.PI) / 180)
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }

  // 监听配置变化，实时重绘
  watch(config, draw, { deep: true })

  const download = () => {
    if (!canvasRef.value) return
    const link = document.createElement('a')
    link.download = 'watermarked-image.png'
    link.href = canvasRef.value.toDataURL('image/png')
    link.click()
  }

  useHead({ title: t('watermark.title') + ' - 小宾果' })
</script>

<style scoped>
  .checkerboard {
    background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
