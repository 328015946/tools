<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <!-- 标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('shadow.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('shadow.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：参数设置 -->
      <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6 lg:col-span-1">
        <h2 class="font-bold text-gray-800 border-b pb-2 mb-4">{{ $t('shadow.settings') }}</h2>

        <!-- X 位移 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-sm font-medium text-gray-600">{{ $t('shadow.shift_right') }}</label>
            <span class="text-xs font-mono bg-gray-100 px-2 rounded">{{ params.x }}px</span>
          </div>
          <input
            type="range"
            v-model.number="params.x"
            min="-50"
            max="50"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- Y 位移 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-sm font-medium text-gray-600">{{ $t('shadow.shift_down') }}</label>
            <span class="text-xs font-mono bg-gray-100 px-2 rounded">{{ params.y }}px</span>
          </div>
          <input
            type="range"
            v-model.number="params.y"
            min="-50"
            max="50"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- 模糊 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-sm font-medium text-gray-600">{{ $t('shadow.blur') }}</label>
            <span class="text-xs font-mono bg-gray-100 px-2 rounded">{{ params.blur }}px</span>
          </div>
          <input
            type="range"
            v-model.number="params.blur"
            min="0"
            max="100"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- 扩散 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-sm font-medium text-gray-600">{{ $t('shadow.spread') }}</label>
            <span class="text-xs font-mono bg-gray-100 px-2 rounded">{{ params.spread }}px</span>
          </div>
          <input
            type="range"
            v-model.number="params.spread"
            min="-50"
            max="50"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- 不透明度 -->
        <div>
          <div class="flex justify-between mb-1">
            <label class="text-sm font-medium text-gray-600">{{ $t('shadow.opacity') }}</label>
            <span class="text-xs font-mono bg-gray-100 px-2 rounded">{{ params.opacity }}</span>
          </div>
          <input
            type="range"
            v-model.number="params.opacity"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
        </div>

        <!-- 颜色与开关 -->
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('shadow.color') }}</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                v-model="params.color"
                class="w-8 h-8 p-0.5 rounded border border-gray-300 cursor-pointer" />
              <span class="text-xs text-gray-400 font-mono">{{ params.color }}</span>
            </div>
          </div>

          <label
            class="flex items-center cursor-pointer select-none p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <input
              type="checkbox"
              v-model="params.inset"
              class="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
            <span class="ml-2 text-sm font-medium text-gray-700">{{ $t('shadow.inset') }}</span>
          </label>
        </div>
      </div>

      <!-- 右侧：预览与代码 -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- 预览画布 -->
        <div
          class="bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center h-[400px] relative overflow-hidden">
          <!-- 网格背景 (方便看透明度) -->
          <div class="absolute inset-0 checkerboard opacity-50"></div>

          <!-- 核心方块 -->
          <div
            class="w-48 h-48 bg-emerald-500 rounded-2xl transition-all duration-75 flex items-center justify-center text-white font-bold text-lg relative z-10"
            :style="{ boxShadow: cssValue }">
            Box
          </div>
        </div>

        <!-- 代码展示 -->
        <div class="bg-gray-900 rounded-xl p-6 relative group">
          <div class="text-gray-400 text-xs font-bold uppercase mb-2">CSS Code</div>
          <code class="block font-mono text-emerald-400 text-sm break-all"> box-shadow: {{ cssValue }}; </code>

          <button
            @click="copy"
            class="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1">
            <span v-if="copied">✅ Copied</span>
            <span v-else>📋 Copy</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  // 参数状态
  const params = reactive({
    x: 10,
    y: 10,
    blur: 20,
    spread: 0,
    opacity: 0.5,
    color: '#000000',
    inset: false
  })

  const copied = ref(false)

  // 辅助函数：HEX 转 RGBA
  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0,
      g = 0,
      b = 0
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16)
      g = parseInt(hex.slice(3, 5), 16)
      b = parseInt(hex.slice(5, 7), 16)
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // 计算 CSS 值
  const cssValue = computed(() => {
    const colorRgba = hexToRgba(params.color, params.opacity)
    const insetStr = params.inset ? 'inset ' : ''
    return `${insetStr}${params.x}px ${params.y}px ${params.blur}px ${params.spread}px ${colorRgba}`
  })

  const copy = () => {
    navigator.clipboard.writeText(`box-shadow: ${cssValue.value};`)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  useHead({ title: t('shadow.title') + ' - 小宾果' })
</script>

<style scoped>
  /* 棋盘格背景 */
  .checkerboard {
    background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
</style>
