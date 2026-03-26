<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('barcode.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('barcode.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：配置区 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
          <!-- 输入 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('barcode.input_label') }}</label>
            <input
              v-model="text"
              type="text"
              :placeholder="$t('barcode.placeholder')"
              class="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono" />
          </div>

          <!-- 格式选择 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('barcode.format') }}</label>
            <select
              v-model="format"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
              <option value="CODE128">CODE128 (通用, 默认)</option>
              <option value="EAN13">EAN-13 (商品码)</option>
              <option value="UPC">UPC (北美商品)</option>
              <option value="CODE39">CODE39</option>
              <option value="ITF14">ITF-14</option>
              <option value="MSI">MSI</option>
              <option value="pharmacode">Pharmacode</option>
            </select>
          </div>

          <!-- 外观参数 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('barcode.width') }}</label>
              <input
                type="number"
                v-model.number="width"
                min="1"
                max="4"
                step="1"
                class="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('barcode.height') }}</label>
              <input
                type="number"
                v-model.number="height"
                min="10"
                max="150"
                step="10"
                class="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
          </div>

          <!-- 显示文字开关 -->
          <label class="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="displayValue"
              class="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-gray-300" />
            <span class="ml-2 text-sm text-gray-700">{{ $t('barcode.display_value') }}</span>
          </label>
        </div>
      </div>

      <!-- 右侧：预览区 -->
      <div class="lg:col-span-2">
        <div
          class="bg-gray-50 border border-gray-200 rounded-xl p-8 min-h-[400px] flex flex-col items-center justify-center relative">
          <!-- 画布容器 -->
          <div class="bg-white p-6 rounded-lg shadow-md mb-8 transition-all duration-300">
            <!-- 使用 svg 标签，因为 jsbarcode 渲染 svg 效果最好 -->
            <svg ref="barcodeRef"></svg>

            <!-- 错误提示 -->
            <div v-if="error" class="text-red-500 text-sm mt-2 text-center max-w-xs">⚠️ {{ $t('barcode.error') }}</div>
          </div>

          <!-- 下载按钮 -->
          <button
            @click="download"
            :disabled="!!error || !text"
            class="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span>⬇️</span> {{ $t('barcode.download') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import JsBarcode from 'jsbarcode'

  const { t } = useI18n()

  const text = ref('小宾果')
  const format = ref('CODE128')
  const width = ref(2)
  const height = ref(100)
  const displayValue = ref(true)
  const error = ref(false)

  const barcodeRef = ref<SVGSVGElement | null>(null)

  // 核心生成逻辑
  const generate = () => {
    if (!barcodeRef.value) return

    error.value = false
    try {
      JsBarcode(barcodeRef.value, text.value, {
        format: format.value,
        lineColor: '#000000',
        width: width.value,
        height: height.value,
        displayValue: displayValue.value,
        margin: 10,
        background: '#ffffff' // 必须设置背景色，否则下载时可能透明
      })
    } catch (e) {
      // JsBarcode 如果遇到格式不对（比如 EAN13 必须是数字且长度对），会抛错
      error.value = true
    }
  }

  // 下载逻辑 (SVG 转 Image 下载比较麻烦，这里我们通过 Canvas 中转)
  const download = () => {
    if (!barcodeRef.value) return

    // 1. 获取 SVG 字符串
    const svgData = new XMLSerializer().serializeToString(barcodeRef.value)
    // 2. 创建 Image 对象
    const img = new Image()
    // 3. 构造 Blob URL
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // 4. 绘制到 Canvas
      const canvas = document.createElement('canvas')
      canvas.width = barcodeRef.value!.clientWidth || 200
      canvas.height = barcodeRef.value!.clientHeight || 100
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // 填充白色背景 (防止透明)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        // 5. 导出 PNG 并下载
        const link = document.createElement('a')
        link.download = `barcode-${text.value}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // 监听所有参数变化
  watch([text, format, width, height, displayValue], generate, { flush: 'post' })

  onMounted(generate)

  useHead({ title: t('barcode.title') + ' - 小宾果' })
</script>
