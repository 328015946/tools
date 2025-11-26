<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- 头部信息 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('css_filter.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('css_filter.desc') }}</p>
    </div>

    <!-- 布局：控制面板 (2/3) + 预览/结果 (1/3) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 1. 滤镜控制区 (左侧/两列) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 替换 UCard for Controls -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <!-- Card Header -->
          <!-- Card Header (优化后的按钮样式) -->
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-800">
              {{ $t('tool.controls') }}
            </h2>

            <!-- 关键修改点 -->
            <div class="flex flex-col space-y-2 items-end">
              <!-- 1. 重置按钮 -->
              <button
                class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center gap-1"
                @click="resetFilters">
                <span class="text-base leading-none">🔄</span>
                {{ $t('tool.reset') }}
              </button>

              <!-- 2. 上传图片按钮 -->
              <button
                class="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md flex items-center gap-1"
                @click="fileInput.click()">
                <span class="text-base leading-none">🖼️</span>
                {{ $t('tool.upload_img') }}
              </button>
            </div>
          </div>

          <!-- 隐藏的文件输入框 -->
          <input ref="fileInput" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />

          <!-- Card Body / 滤镜滑块列表 -->
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <!-- 替换 UFormGroup & URange -->
              <div v-for="filter in filters" :key="filter.key" class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">
                  {{ filter.label }}
                  <span class="text-gray-500 font-normal ml-2 text-xs"> ({{ filter.value }}{{ filter.unit }}) </span>
                </label>

                <!-- 替换 URange 为原生 input type="range" -->
                <input
                  type="range"
                  v-model.number="filter.value"
                  :min="filter.min"
                  :max="filter.max"
                  :step="filter.step"
                  class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider-custom" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 实时预览与结果区 (右侧/一列) -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 预览区 (替换 UCard) -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800">{{ $t('tool.live_preview') || '实时预览' }}</h2>
          </div>
          <div class="p-4">
            <div
              class="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 aspect-[4/3] flex items-center justify-center">
              <img
                :src="imageUrl"
                :style="previewStyle"
                alt="Live Filter Preview"
                class="w-full h-full transition-filter duration-100 object-cover" />
            </div>
          </div>
        </div>

        <!-- 结果代码区 (替换 UCard) -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800">{{ $t('tool.generated_code') || '生成的 CSS' }}</h2>
          </div>
          <div class="p-4">
            <!-- 结果区域，模仿 base64.vue 的 textarea+button 组合 -->
            <!-- 结果区域 -->
            <div class="relative">
              <textarea
                readonly
                :value="fullCssCode"
                rows="5"
                class="w-full p-3 text-sm bg-gray-900 dark:bg-gray-800 text-emerald-400 border border-gray-700 rounded-md resize-none font-mono focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="filter: property(value) property(value);..."></textarea>
              <!-- 复制按钮 -->
              <button
                class="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1"
                @click="handleCopy">
                {{ iconMap.copy }} {{ $t('tool.copy') || '复制' }}
              </button>
            </div>

            <div class="mt-4 text-sm text-gray-500">此代码可以直接应用于您的图片元素。</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed } from 'vue'

  const { t } = useI18n()
  const { copyToClipboard } = useCopy()

  // --- 元数据和 SEO ---
  useHead({
    title: t('css_filter.title'),
    meta: [{ name: 'description', content: t('css_filter.desc') }]
  })

  // --- 默认配置和状态 ---

  const placeholderImage = 'https://picsum.photos/seed/cssfilter/800/600'
  const imageUrl = ref(placeholderImage)
  const fileInput = ref<HTMLInputElement | null>(null) // 新增：用于文件输入引用

  // 定义所有 CSS 滤镜及其默认值、单位、最小值和最大值
  const filters = ref([
    // 核心属性
    { key: 'brightness', label: '亮度 (Brightness)', unit: '%', min: 0, max: 300, step: 1, value: 100 },
    { key: 'contrast', label: '对比度 (Contrast)', unit: '%', min: 0, max: 300, step: 1, value: 100 },
    { key: 'saturate', label: '饱和度 (Saturate)', unit: '%', min: 0, max: 300, step: 1, value: 100 },
    { key: 'opacity', label: '透明度 (Opacity)', unit: '%', min: 0, max: 100, step: 1, value: 100 },

    // 效果属性
    { key: 'grayscale', label: '灰度 (Grayscale)', unit: '%', min: 0, max: 100, step: 1, value: 0 },
    { key: 'sepia', label: '褐色 (Sepia)', unit: '%', min: 0, max: 100, step: 1, value: 0 },
    { key: 'invert', label: '反转 (Invert)', unit: '%', min: 0, max: 100, step: 1, value: 0 },
    { key: 'blur', label: '模糊 (Blur)', unit: 'px', min: 0, max: 20, step: 0.1, value: 0 },
    { key: 'hue-rotate', label: '色相旋转 (Hue Rotate)', unit: 'deg', min: 0, max: 360, step: 1, value: 0 }
  ])

  // ... (保持 filters.ref 初始化不变)

  const cssFilterString = computed(() => {
    // 确保过滤掉 value 不是数字或为 undefined 的情况
    return filters.value
      .map(f => {
        // 关键：检查 f.value 是否为有效数字
        if (typeof f.value === 'number' && !isNaN(f.value)) {
          return `${f.key}(${f.value}${f.unit})`
        }
        return '' // 返回空字符串
      })
      .filter(str => str.length > 0) // 过滤掉空字符串
      .join(' ')
  })
  // ... (之前的 cssFilterString 保持不变)

  const fullCssCode = computed(() => {
    const filterStr = cssFilterString.value.trim()

    // 如果 filterStr 为空 (所有滤镜都为默认值且被过滤)，则返回一个有效的空 CSS
    if (!filterStr) {
      return 'filter: none;'
    }

    return `filter: ${filterStr};`
  })

  // ...

  // ... (其他逻辑不变)

  const previewStyle = computed(() => ({
    filter: cssFilterString.value
  }))

  const resetFilters = () => {
    filters.value.forEach(f => {
      if (['brightness', 'contrast', 'saturate', 'opacity'].includes(f.key)) {
        f.value = 100
      } else {
        f.value = 0
      }
    })
  }

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const reader = new FileReader()
      reader.onload = e => {
        imageUrl.value = e.target?.result as string
      }
      reader.readAsDataURL(input.files[0])
    }
  }

  const handleCopy = () => {
    copyToClipboard(`filter: ${cssFilterString.value};`)
  }

  // 模拟图标，因为 i-heroicons 不再可用
  const iconMap = {
    reset: '🔄',
    upload: '⬆️',
    copy: '📋'
  }
</script>

<style scoped>
  .transition-filter {
    transition: filter 0.2s ease-out;
  }
  /* 简单的滑块样式，确保在不同浏览器上可见 */
  .range-slider-custom {
    /* Chrome/Safari */
    -webkit-appearance: none;
    height: 6px;
    background: #e0e0e0;
  }
  .range-slider-custom::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5; /* indigo-600 */
    cursor: pointer;
  }
  /* Firefox */
  .range-slider-custom::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4f46e5; /* indigo-600 */
    cursor: pointer;
    border: none;
  }
</style>
