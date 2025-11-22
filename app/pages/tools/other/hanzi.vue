<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('hanzi.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('hanzi.desc') }} (Powered by Hanzi Writer)</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- 左侧：控制面板 -->
      <div class="md:col-span-4 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <!-- 输入框 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">{{ $t('hanzi.input_label') }}</label>
            <input
              v-model="text"
              type="text"
              maxlength="8"
              :placeholder="$t('hanzi.placeholder')"
              class="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              @input="debouncedRender" />
          </div>

          <!-- 开关选项 -->
          <div class="space-y-3">
            <label class="flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="config.showOutline"
                class="rounded text-red-600 focus:ring-red-500 h-5 w-5 border-gray-300"
                @change="renderWriters" />
              <span class="ml-3 text-gray-700">{{ $t('hanzi.show_outline') }}</span>
            </label>
          </div>

          <!-- 颜色 & 速度 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('hanzi.color') }}</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  v-model="config.strokeColor"
                  class="w-8 h-8 p-0.5 border rounded cursor-pointer"
                  @change="renderWriters" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('hanzi.speed') }}</label>
              <!-- HanziWriter 速度: 1 是正常，0.5 是慢，2 是快 -->
              <input
                type="range"
                v-model.number="config.speed"
                min="0.5"
                max="3"
                step="0.5"
                class="w-full h-2 bg-gray-200 rounded-lg accent-red-600"
                @change="updateSpeed" />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="space-y-3 pt-2">
            <button
              @click="animateAll"
              class="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2">
              ▶️ {{ $t('hanzi.animate') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：展示区 -->
      <div
        class="md:col-span-8 bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col items-center min-h-[400px]">
        <!-- 容器：使用 ref 引用 -->
        <div ref="gridContainer" class="flex flex-wrap gap-4 justify-center"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import HanziWriter from 'hanzi-writer'
  import { toPng } from 'html-to-image'

  const { t } = useI18n()

  const text = ref('你好世界')
  const gridContainer = ref<HTMLElement | null>(null)
  const downloading = ref(false)

  // 保存 writer 实例以便后续控制
  const writers = ref<any[]>([])

  const config = reactive({
    showOutline: true,
    strokeColor: '#059669',
    speed: 1 // 默认速度
  })

  // 1. 渲染核心逻辑
  const renderWriters = () => {
    if (!gridContainer.value) return
    gridContainer.value.innerHTML = '' // 清空容器
    writers.value = [] // 清空实例

    const chars = text.value.split('')

    chars.forEach(char => {
      // 创建田字格容器
      const charDiv = document.createElement('div')
      charDiv.className = 'tian-ge-bg' // 使用 CSS 画田字格
      charDiv.style.width = '100px'
      charDiv.style.height = '100px'
      gridContainer.value?.appendChild(charDiv)

      // 初始化 Writer
      const writer = HanziWriter.create(charDiv, char, {
        width: 100,
        height: 100,
        padding: 5,
        strokeColor: config.strokeColor,
        outlineColor: '#ddd',
        showOutline: config.showOutline,
        strokeAnimationSpeed: config.speed,
        delayBetweenStrokes: 200
      })

      writers.value.push(writer)
    })
  }

  // 2. 播放动画 (一个接一个)
  const animateAll = async () => {
    for (const writer of writers.value) {
      await writer.animateCharacter()
    }
  }

  // 更新速度配置 (不需要重新渲染 DOM)
  const updateSpeed = () => {
    // HanziWriter 实例没有直接的 setSpeed，但在 animate 时会读取
    // 如果需要热更新，最好重建，或者保持简单直接重绘
    renderWriters()
  }

  let timer: NodeJS.Timeout
  const debouncedRender = () => {
    clearTimeout(timer)
    timer = setTimeout(renderWriters, 500)
  }

  onMounted(() => {
    renderWriters()
  })

  useHead({ title: t('hanzi.title') + ' - NuxtTools' })
</script>

<style>
  /* 纯 CSS 绘制田字格背景 (完美避开跨域问题) */
  .tian-ge-bg {
    background-color: #fff;
    position: relative;
    border: 2px solid #059669; /* 外框颜色 */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  /* 横线 */
  .tian-ge-bg::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1px;
    background: repeating-linear-gradient(to right, #d55 0, #d55 4px, transparent 4px, transparent 8px);
    opacity: 0.5;
  }

  /* 竖线 */
  .tian-ge-bg::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    height: 100%;
    width: 1px;
    background: repeating-linear-gradient(to bottom, #d55 0, #d55 4px, transparent 4px, transparent 8px);
    opacity: 0.5;
  }
</style>
