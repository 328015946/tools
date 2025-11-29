<script setup lang="ts">
  import { computed, ref, watch, nextTick } from 'vue'

  // --- 1. Props & Emits ---
  const props = defineProps<{ activeObject: any; isRemovingBg?: boolean }>()

  const emit = defineEmits([
    'update-prop',
    'change-layer',
    'delete',
    'group',
    'ungroup',
    'toggle-style',
    'update-image-radius',
    'align',
    'update-filter',
    'set-as-bg',
    'update-text-curve',
    'update-shadow',
    'update-shadow-prop',
    'update-clip',
    'distribute', // [新增]
    'remove-bg' // [新增]
  ])

  // --- 2. 响应式同步机制 ---
  const uiTick = ref(0)

  watch(
    () => props.activeObject,
    () => {
      uiTick.value++
    },
    { deep: false, immediate: true }
  )

  const refreshUI = () => {
    nextTick(() => uiTick.value++)
  }

  const update = (key: string, value: any) => {
    emit('update-prop', { key, value })
    refreshUI()
  }

  const handleToggleStyle = (style: string) => {
    emit('toggle-style', style)
    refreshUI()
  }

  // --- 3. 状态判断 ---
  const objectType = computed(() => {
    uiTick.value
    return props.activeObject?.type?.toLowerCase() || ''
  })
  const isText = computed(() => ['i-text', 'text', 'textbox'].includes(objectType.value))
  const isImage = computed(() => objectType.value === 'image')
  const isGroup = computed(() => objectType.value === 'group')
  const isSelection = computed(() => objectType.value === 'activeselection')
  const isShape = computed(
    () => props.activeObject && !isText.value && !isImage.value && !isGroup.value && !isSelection.value
  )

  // === A. 文字样式 ===
  const isBold = computed(() => {
    uiTick.value
    const fw = props.activeObject?.fontWeight
    return fw === 'bold' || parseInt(fw as string) >= 700
  })

  const isItalic = computed(() => {
    uiTick.value
    const fs = props.activeObject?.fontStyle
    return fs === 'italic' || fs === 'oblique'
  })

  const hasUnderline = computed(() => {
    uiTick.value
    return !!props.activeObject?.underline
  })

  const hasLinethrough = computed(() => {
    uiTick.value
    return !!props.activeObject?.linethrough
  })

  // === B. 边框样式 ===
  const isDashed = computed(() => {
    uiTick.value
    const arr = props.activeObject?.strokeDashArray
    return Array.isArray(arr) && arr.length > 0 && arr.some(n => n > 0)
  })

  // === C. 阴影模式 ===
  const shadowMode = computed(() => {
    uiTick.value
    const s = props.activeObject?.shadow
    if (!s) return 'none'
    const blur = s.blur || 0
    const offsetX = Math.abs(s.offsetX || 0)
    const offsetY = Math.abs(s.offsetY || 0)
    if (blur >= 10 && offsetX < 3 && offsetY < 3) return 'glow'
    if (offsetX >= 1 || offsetY >= 1 || blur > 0) return 'projection'
    return 'none'
  })

  // === D. 滤镜判断 ===
  const activeFilterType = computed(() => {
    uiTick.value
    const filters = props.activeObject?.filters || []
    if (!filters || filters.length === 0) return 'none'
    const has = (t: string) => filters.some((f: any) => f.type.toLowerCase() === t.toLowerCase())
    if (has('Grayscale')) return 'grayscale'
    if (has('Sepia')) return 'sepia'
    if (has('Invert')) return 'invert'
    return 'none'
  })

  // --- 4. 辅助 Helper ---
  const normalizeColor = (color: string | undefined | null) => {
    uiTick.value
    if (!color || color === 'transparent') return '#ffffff'
    if (color.startsWith('#')) return color.slice(0, 7)
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g)
      if (rgb && rgb.length >= 3) {
        const hex = (n: string) => parseInt(n).toString(16).padStart(2, '0')
        return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`
      }
    }
    return '#000000'
  }

  const getFilterValue = (filterName: string) => {
    uiTick.value
    if (!props.activeObject?.filters) return 0
    const filter = props.activeObject.filters.find((f: any) => f.type === filterName)
    if (!filter) return 0
    const map: Record<string, string> = {
      Brightness: 'brightness',
      Contrast: 'contrast',
      Saturation: 'saturation',
      Blur: 'blur'
    }
    return filter[map[filterName]] || 0
  }

  const handleFilterChange = (filterName: string, value: number) => {
    emit('update-filter', { type: 'parameter', name: filterName, value: value })
    refreshUI()
  }

  const handleFilterPreset = (type: string) => {
    emit('update-filter', { type })
    refreshUI()
  }

  const handleUpdateShadow = (payload: any) => {
    emit('update-shadow', payload)
    refreshUI()
  }
  const handleUpdateShadowProp = (payload: any) => {
    emit('update-shadow-prop', payload)
    refreshUI()
  }
  // === E. 蒙版类型判断 ===
  const currentClip = computed(() => {
    uiTick.value // 依赖强制刷新
    const clip = props.activeObject?.clipPath
    if (!clip) return 'none'
    // 读取我们刚才打的标签
    return clip.data?.clipName || 'custom'
  })

  // 顺便把处理函数提取出来，确保点击后立即刷新 UI
  const handleClip = (type: string) => {
    emit('update-clip', type)
    refreshUI()
  }
  // 快捷对齐配置 (保持 key 不变，icon 改为 SVG path)
  const alignOptions = [
    { key: 'left', icon: 'M4 6h16M4 12h10M4 18h14 M4 4v16', label: '左对齐' },
    { key: 'centerH', icon: 'M12 4v16 M8 8h8M6 16h12', label: '水平居中' },
    { key: 'right', icon: 'M20 6H4M20 12h-8M20 18H8 M20 4v16', label: '右对齐' },
    { key: 'top', icon: 'M6 4v16M12 4v10M18 4v14 M4 4h16', label: '顶对齐' },
    { key: 'centerV', icon: 'M4 12h16 M8 8v8M16 6v12', label: '垂直居中' },
    { key: 'bottom', icon: 'M6 20V4M12 20v-8M18 20V6 M4 20h16', label: '底对齐' }
  ]
</script>

<template>
  <aside
    class="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10 h-full font-sans text-gray-700 select-none">
    <!-- 顶部标题 -->
    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 h-12">
      <h2 class="font-bold text-xs uppercase flex items-center gap-2 tracking-wide text-gray-500">
        <span v-if="isText">📝 文字属性</span>
        <span v-else-if="isImage">🖼️ 图片属性</span>
        <span v-else-if="isGroup">⛓️ 组合属性</span>
        <span v-else-if="isSelection">✨ 多选操作</span>
        <span v-else-if="isShape">🎨 形状属性</span>
        <span v-else>属性面板</span>
      </h2>
    </div>

    <!-- 主内容区 -->
    <div v-if="activeObject" class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
      <!-- 🟢 模块 0: 快捷对齐 (优化：3列布局，带文字) -->
      <section>
        <label class="section-title mb-2">快捷对齐</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opt in alignOptions"
            :key="opt.key"
            @click="$emit('align', opt.key)"
            class="flex flex-col items-center justify-center p-2 border border-gray-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition group active:scale-95"
            :title="opt.label">
            <svg
              class="w-5 h-5 mb-1 text-gray-400 group-hover:text-indigo-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5">
              <path :d="opt.icon" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-[10px] transform scale-90">{{ opt.label }}</span>
          </button>
        </div>
        <!-- 🟢 [新增] 第二行：均分 (只有多选时可用，或常驻) -->
        <!-- 简单起见，我们加两个宽按钮 -->
        <div class="grid grid-cols-2 gap-2 py-3.5">
          <button
            @click="$emit('distribute', 'horizontal')"
            class="flex items-center justify-center gap-2 py-1.5 border border-gray-100 rounded hover:bg-indigo-50 hover:text-indigo-600 transition text-xs text-gray-600 active:scale-95"
            :class="{ 'opacity-50 cursor-not-allowed': !isSelection }"
            title="需要选中3个以上元素">
            <!-- 水平均分图标 -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 22V2 M20 22V2 M9 12h6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>水平分布</span>
          </button>

          <button
            @click="$emit('distribute', 'vertical')"
            class="flex items-center justify-center gap-2 py-1.5 border border-gray-100 rounded hover:bg-indigo-50 hover:text-indigo-600 transition text-xs text-gray-600 active:scale-95"
            :class="{ 'opacity-50 cursor-not-allowed': !isSelection }"
            title="需要选中3个以上元素">
            <!-- 垂直均分图标 -->
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 4H2 M22 20H2 M12 9v6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>垂直分布</span>
          </button>
        </div>
      </section>

      <!-- 🟢 模块 A: 文字设置 -->
      <section v-if="isText" class="space-y-5 animate-fade-in">
        <label class="section-title">文字排版</label>

        <!-- A1. 样式按钮组 (优化：清爽风格) -->
        <div class="grid grid-cols-4 gap-2">
          <button @click="handleToggleStyle('bold')" class="font-style-btn font-bold" :class="isBold ? 'active' : ''">
            B
          </button>
          <button
            @click="handleToggleStyle('italic')"
            class="font-style-btn font-serif italic"
            :class="isItalic ? 'active' : ''">
            I
          </button>
          <button
            @click="update('underline', !activeObject.underline)"
            class="font-style-btn underline underline-offset-2"
            :class="hasUnderline ? 'active' : ''">
            U
          </button>
          <button
            @click="update('linethrough', !activeObject.linethrough)"
            class="font-style-btn line-through decoration-gray-400"
            :class="hasLinethrough ? 'active' : ''">
            S
          </button>
        </div>

        <!-- A2. 字体参数 -->
        <div class="space-y-3 pt-2">
          <div class="control-group">
            <div class="label-row">
              <span>字号</span><span class="val">{{ activeObject.fontSize }}</span>
            </div>
            <input
              type="range"
              min="8"
              max="200"
              :value="activeObject.fontSize"
              @input="(e:any)=>update('fontSize', parseInt(e.target.value))"
              class="range-input" />
          </div>
          <div class="control-group">
            <div class="label-row">
              <span>字间距</span><span class="val">{{ activeObject.charSpacing || 0 }}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="800"
              step="10"
              :value="activeObject.charSpacing || 0"
              @input="(e:any)=>update('charSpacing', parseInt(e.target.value))"
              class="range-input" />
          </div>
          <div class="control-group">
            <div class="label-row">
              <span>行高</span><span class="val">{{ (activeObject.lineHeight || 1).toFixed(1) }}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              :value="activeObject.lineHeight || 1.16"
              @input="(e:any)=>update('lineHeight', parseFloat(e.target.value))"
              class="range-input" />
          </div>
        </div>

        <!-- A3. 颜色与描边 -->
        <div class="space-y-3 pt-4 border-t border-gray-100">
          <div class="flex-row-center">
            <span class="text-xs font-medium text-gray-600">文字颜色</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-gray-400 uppercase">{{ normalizeColor(activeObject.fill) }}</span>
              <input
                type="color"
                :value="normalizeColor(activeObject.fill)"
                @input="(e:any)=>update('fill', e.target.value)"
                class="color-picker" />
            </div>
          </div>

          <div class="flex-row-center">
            <span class="text-xs font-medium text-gray-600">文字描边</span>
            <input
              type="color"
              :value="activeObject.stroke || '#000000'"
              @input="(e:any)=>update('stroke', e.target.value)"
              class="color-picker" />
          </div>

          <div v-if="activeObject.stroke" class="control-group pl-3 border-l-2 border-indigo-100 transition-all">
            <div class="label-row">
              <span>描边粗细</span><span class="val">{{ activeObject.strokeWidth }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              :value="activeObject.strokeWidth || 0"
              @input="(e:any)=>update('strokeWidth', parseFloat(e.target.value))"
              class="range-input" />
          </div>
        </div>

        <!-- A4. 弯曲文字 -->
        <div class="space-y-3 pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between">
            <label class="section-title text-indigo-500">🌈 弯曲特效</label>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="!!activeObject.path"
                @change="(e:any) => { $emit('update-text-curve', e.target.checked ? 10 : 0); refreshUI(); }" />
              <div
                class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <div
            v-if="activeObject.path"
            class="bg-indigo-50/50 p-3 rounded border border-indigo-100 control-group transition-all">
            <div class="label-row">
              <span>弯曲程度</span><span class="val">{{ activeObject.data?.curveVal || 0 }}</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              :value="activeObject.data?.curveVal || 0"
              @input="(e:any)=>$emit('update-text-curve', parseInt(e.target.value))"
              class="range-input" />
            <div class="flex justify-between text-[8px] text-gray-400 mt-1">
              <span>向上弯曲</span><span>向下弯曲</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 🟢 模块 B: 图片设置 -->
      <section v-if="isImage" class="space-y-5 animate-fade-in">
        <label class="section-title">图片样式</label>
        <div class="control-group">
          <div class="label-row">
            <span>圆角半径</span><span class="val">{{ activeObject.corners || 0 }}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="activeObject.corners || 0"
            @input="(e:any) => { emit('update-image-radius', parseInt(e.target.value)); refreshUI(); }"
            class="range-input" />
        </div>
        <div class="pb-4 mb-4 border-b border-gray-100 space-y-2">
          <label class="section-title">AI 智能工具</label>

          <!-- 🪄 AI 抠图按钮 -->
          <button
            @click="$emit('remove-bg')"
            :disabled="isRemovingBg"
            class="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group">
            <!-- Loading 状态 -->
            <svg
              v-if="isRemovingBg"
              class="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>

            <!-- 正常状态 -->
            <template v-else>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>一键智能抠图</span>
            </template>
          </button>

          <p class="text-[10px] text-gray-400 text-center px-2">✨ 自动识别主体，移除背景 (首次运行需下载模型)</p>
        </div>
        <!-- EditorSettings.vue -> isImage 区块内 -->

        <!-- EditorSettings.vue -> isImage -> 形状裁剪区块 -->
        <div class="space-y-3 pt-4 border-t border-gray-100">
          <label class="section-title">形状裁剪 (蒙版)</label>
          <div class="grid grid-cols-5 gap-2">
            <!-- 🚫 取消 -->
            <button
              @click="handleClip('none')"
              class="aspect-square border rounded flex items-center justify-center hover:bg-red-50 text-red-500 transition active:scale-95"
              :class="currentClip === 'none' ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'border-gray-200'"
              title="还原">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- 🔵 圆形 -->
            <button
              @click="handleClip('circle')"
              class="aspect-square border rounded flex items-center justify-center transition active:scale-95"
              :class="
                currentClip === 'circle'
                  ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                  : 'hover:bg-gray-50 border-gray-200'
              "
              title="圆形">
              <div
                class="w-4 h-4 bg-gray-400 rounded-full"
                :class="currentClip === 'circle' ? 'bg-indigo-500' : ''"></div>
            </button>

            <!-- 🟦 圆角矩形 -->
            <button
              @click="handleClip('rounded')"
              class="aspect-square border rounded flex items-center justify-center transition active:scale-95"
              :class="
                currentClip === 'rounded'
                  ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                  : 'hover:bg-gray-50 border-gray-200'
              "
              title="圆角矩形">
              <div
                class="w-4 h-4 bg-gray-400 rounded-md"
                :class="currentClip === 'rounded' ? 'bg-indigo-500' : ''"></div>
            </button>

            <!-- 🤍 爱心 -->
            <button
              @click="handleClip('heart')"
              class="aspect-square border rounded flex items-center justify-center transition active:scale-95"
              :class="
                currentClip === 'heart'
                  ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                  : 'hover:bg-gray-50 border-gray-200'
              "
              title="爱心">
              <svg
                class="w-4 h-4 fill-current"
                :class="currentClip === 'heart' ? 'text-indigo-500' : 'text-gray-400'"
                viewBox="0 0 24 24">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            <!-- ⭐ 五角星 -->
            <button
              @click="handleClip('star')"
              class="aspect-square border rounded flex items-center justify-center transition active:scale-95"
              :class="
                currentClip === 'star'
                  ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                  : 'hover:bg-gray-50 border-gray-200'
              "
              title="五角星">
              <svg
                class="w-4 h-4 fill-current"
                :class="currentClip === 'star' ? 'text-indigo-500' : 'text-gray-400'"
                viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          </div>
        </div>
        <!-- 边框 -->
        <div class="space-y-3 pt-4 border-t border-gray-100">
          <div class="flex-row-center">
            <span class="text-xs font-medium text-gray-600">边框颜色</span>
            <input
              type="color"
              :value="activeObject.stroke || '#000000'"
              @input="(e:any)=>update('stroke', e.target.value)"
              class="color-picker" />
          </div>
          <div v-if="activeObject.stroke" class="control-group">
            <div class="label-row">
              <span>边框粗细</span><span class="val">{{ activeObject.strokeWidth }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              :value="activeObject.strokeWidth || 0"
              @input="(e:any)=>update('strokeWidth', parseInt(e.target.value))"
              class="range-input" />
          </div>
        </div>

        <!-- 高级调节 -->
        <div class="space-y-4 pt-4 border-t border-gray-100">
          <label class="section-title">色彩调节</label>
          <div v-for="f in ['Brightness', 'Contrast', 'Saturation', 'Blur']" :key="f" class="control-group">
            <div class="label-row">
              <span>{{
                f === 'Brightness' ? '亮度' : f === 'Contrast' ? '对比度' : f === 'Saturation' ? '饱和度' : '模糊'
              }}</span>
              <span class="val">{{ getFilterValue(f).toFixed(2) }}</span>
            </div>
            <input
              type="range"
              :min="f === 'Blur' ? 0 : -1"
              :max="1"
              :step="f === 'Blur' ? 0.01 : 0.05"
              :value="getFilterValue(f)"
              @input="(e:any) => handleFilterChange(f, parseFloat(e.target.value))"
              class="range-input" />
          </div>
        </div>

        <!-- 滤镜预设 -->
        <div class="space-y-2 pt-4 border-t border-gray-100">
          <label class="section-title">滤镜风格</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              @click="handleFilterPreset('none')"
              class="filter-btn"
              :class="activeFilterType === 'none' ? 'btn-active-sub' : ''">
              🚫 原图
            </button>
            <button
              @click="handleFilterPreset('grayscale')"
              class="filter-btn grayscale"
              :class="activeFilterType === 'grayscale' ? 'btn-active-sub' : ''">
              🌑 黑白
            </button>
            <button
              @click="handleFilterPreset('sepia')"
              class="filter-btn sepia"
              :class="activeFilterType === 'sepia' ? 'btn-active-sub' : ''">
              🍂 复古
            </button>
            <button
              @click="handleFilterPreset('invert')"
              class="filter-btn invert"
              :class="activeFilterType === 'invert' ? 'btn-active-sub' : ''">
              🌗 反色
            </button>
          </div>
        </div>

        <button
          @click="$emit('set-as-bg')"
          class="w-full mt-2 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 border border-indigo-200 transition active:scale-95">
          🖼️ 设为画布背景
        </button>
      </section>

      <!-- 🟢 模块 C: 形状设置 -->
      <section v-if="isShape" class="space-y-5 animate-fade-in">
        <label class="section-title">形状外观</label>

        <!-- 填充 -->
        <div class="flex-row-center">
          <span class="text-xs font-medium text-gray-600">填充颜色</span>
          <div class="flex gap-2 items-center">
            <button
              @click="update('fill', 'transparent')"
              class="w-6 h-6 border rounded flex items-center justify-center text-[10px] hover:bg-red-50 text-red-500 transition"
              :class="activeObject.fill === 'transparent' ? 'ring-2 ring-red-500' : ''"
              title="无填充">
              ✕
            </button>
            <input
              type="color"
              :value="normalizeColor(activeObject.fill)"
              @input="(e:any)=>update('fill', e.target.value)"
              class="color-picker" />
          </div>
        </div>

        <div v-if="activeObject.type === 'rect'" class="control-group">
          <div class="label-row">
            <span>圆角半径</span><span class="val">{{ activeObject.rx || 0 }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="activeObject.rx || 0"
            @input="(e:any)=>{ update('rx', parseInt(e.target.value)); update('ry', parseInt(e.target.value)); }"
            class="range-input" />
        </div>

        <!-- 描边 -->
        <div class="space-y-3 pt-4 border-t border-gray-100">
          <div class="flex-row-center">
            <span class="text-xs font-medium text-gray-600">描边颜色</span>
            <input
              type="color"
              :value="normalizeColor(activeObject.stroke)"
              @input="(e:any)=>update('stroke', e.target.value)"
              class="color-picker" />
          </div>

          <div class="bg-gray-100 p-1 rounded-lg flex gap-1">
            <button
              @click="update('strokeDashArray', null)"
              class="flex-1 py-1.5 rounded text-xs transition"
              :class="!isDashed ? 'btn-active shadow-sm' : 'text-gray-500 hover:text-gray-700'">
              实线
            </button>
            <button
              @click="update('strokeDashArray', [10, 10])"
              class="flex-1 py-1.5 rounded text-xs transition"
              :class="isDashed ? 'btn-active shadow-sm' : 'text-gray-500 hover:text-gray-700'">
              虚线
            </button>
          </div>

          <div class="control-group">
            <div class="label-row">
              <span>描边粗细</span><span class="val">{{ activeObject.strokeWidth || 0 }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              :value="activeObject.strokeWidth || 0"
              @input="(e:any)=>update('strokeWidth', parseInt(e.target.value))"
              class="range-input" />
          </div>
        </div>
      </section>

      <!-- 🟢 模块 D: 组合操作 -->
      <section v-if="isGroup || isSelection" class="animate-fade-in">
        <div v-if="isSelection" class="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
          <p class="text-xs text-indigo-600 mb-3 font-medium">✨ 已选中多个元素</p>
          <button
            @click="emit('group')"
            class="action-btn text-white bg-indigo-600 border-transparent hover:bg-indigo-700 shadow-md">
            🔗 组合 (Ctrl+G)
          </button>
        </div>
        <div v-else class="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
          <p class="text-xs text-gray-500 mb-3">⛓️ 当前为组合状态</p>
          <button @click="emit('ungroup')" class="action-btn text-gray-700 bg-white hover:bg-gray-50">
            🔓 取消组合 (Ctrl+Shift+G)
          </button>
        </div>
      </section>

      <!-- 🟢 模块 E: 通用效果 (底部常驻) -->
      <section v-if="!isSelection" class="space-y-5 pt-4 border-t-2 border-gray-100">
        <!-- 阴影系统 -->
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <label class="section-title">阴影 / 发光</label>
            <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                @click="handleUpdateShadow(null)"
                class="w-6 h-6 rounded flex items-center justify-center text-[10px] transition"
                :class="
                  shadowMode === 'none' ? 'bg-white shadow text-red-500 font-bold' : 'text-gray-400 hover:text-gray-600'
                "
                title="无">
                ✕
              </button>

              <button
                @click="handleUpdateShadow({ color: '#000000', blur: 5, offsetX: 5, offsetY: 5 })"
                class="w-6 h-6 rounded flex items-center justify-center text-[10px] transition"
                :class="
                  shadowMode === 'projection' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                "
                title="投影">
                <div class="w-2 h-2 bg-current rounded-sm shadow-sm opacity-60"></div>
              </button>

              <button
                @click="handleUpdateShadow({ color: '#ef4444', blur: 20, offsetX: 0, offsetY: 0 })"
                class="w-6 h-6 rounded flex items-center justify-center text-[10px] transition"
                :class="shadowMode === 'glow' ? 'bg-white shadow text-red-500' : 'text-gray-400 hover:text-gray-600'"
                title="发光">
                <div class="w-2 h-2 bg-current rounded-full blur-[1px]"></div>
              </button>
            </div>
          </div>

          <div
            v-if="activeObject.shadow"
            class="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 text-xs animate-fade-in">
            <div class="flex-row-center">
              <span>颜色</span>
              <input
                type="color"
                :value="activeObject.shadow.color || '#000000'"
                @input="(e:any)=>handleUpdateShadowProp({key:'color', value:e.target.value})"
                class="color-picker" />
            </div>
            <div class="control-group">
              <div class="label-row">
                <span>模糊度</span><span class="val">{{ activeObject.shadow.blur }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                :value="activeObject.shadow.blur || 0"
                @input="(e:any)=>handleUpdateShadowProp({key:'blur', value:parseInt(e.target.value)})"
                class="range-input" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="control-group">
                <span class="text-gray-400 block mb-1 scale-90 origin-left">X 偏移</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  :value="activeObject.shadow.offsetX || 0"
                  @input="(e:any)=>handleUpdateShadowProp({key:'offsetX', value:parseInt(e.target.value)})"
                  class="range-input" />
              </div>
              <div class="control-group">
                <span class="text-gray-400 block mb-1 scale-90 origin-left">Y 偏移</span>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  :value="activeObject.shadow.offsetY || 0"
                  @input="(e:any)=>handleUpdateShadowProp({key:'offsetY', value:parseInt(e.target.value)})"
                  class="range-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="control-group">
          <div class="label-row">
            <span>不透明度</span><span class="val">{{ Math.round((activeObject.opacity || 1) * 100) }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="activeObject.opacity || 1"
            @input="(e:any)=>update('opacity', parseFloat(e.target.value))"
            class="range-input" />
        </div>
        <!-- EditorSettings.vue -> 模块 E: 通用效果 -->

        <!-- 混合模式 -->
        <div class="control-group">
          <div class="label-row"><span>混合模式 (Blend Mode)</span></div>
          <select
            :value="activeObject.globalCompositeOperation || 'source-over'"
            @change="(e: any) => update('globalCompositeOperation', e.target.value)"
            class="w-full text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
            <option value="source-over">正常 (Normal)</option>
            <option value="multiply">正片叠底 (Multiply)</option>
            <option value="screen">滤色 (Screen)</option>
            <option value="overlay">叠加 (Overlay)</option>
            <option value="darken">变暗 (Darken)</option>
            <option value="lighten">变亮 (Lighten)</option>
            <option value="color-dodge">颜色减淡 (Color Dodge)</option>
            <option value="color-burn">颜色加深 (Color Burn)</option>
            <option value="hard-light">强光 (Hard Light)</option>
            <option value="soft-light">柔光 (Soft Light)</option>
            <option value="difference">差值 (Difference)</option>
            <option value="exclusion">排除 (Exclusion)</option>
            <option value="hue">色相 (Hue)</option>
            <option value="saturation">饱和度 (Saturation)</option>
            <option value="color">颜色 (Color)</option>
            <option value="luminosity">明度 (Luminosity)</option>
          </select>
        </div>

        <!-- 🟢 模块: 图层顺序 (优化：4列布局，带文字) -->
        <div>
          <label class="section-title mb-2">图层顺序</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              @click="emit('change-layer', 'top')"
              class="flex flex-col items-center justify-center p-2 border border-gray-100 rounded hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition group active:scale-95"
              title="置顶">
              <svg
                class="w-4 h-4 mb-1 text-gray-400 group-hover:text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18M5 3h14" />
              </svg>
              <span class="text-[10px] transform scale-90">置顶</span>
            </button>
            <button
              @click="emit('change-layer', 'up')"
              class="flex flex-col items-center justify-center p-2 border border-gray-100 rounded hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition group active:scale-95"
              title="上移">
              <svg
                class="w-4 h-4 mb-1 text-gray-400 group-hover:text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              <span class="text-[10px] transform scale-90">上移</span>
            </button>
            <button
              @click="emit('change-layer', 'down')"
              class="flex flex-col items-center justify-center p-2 border border-gray-100 rounded hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition group active:scale-95"
              title="下移">
              <svg
                class="w-4 h-4 mb-1 text-gray-400 group-hover:text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span class="text-[10px] transform scale-90">下移</span>
            </button>
            <button
              @click="emit('change-layer', 'bottom')"
              class="flex flex-col items-center justify-center p-2 border border-gray-100 rounded hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition group active:scale-95"
              title="置底">
              <svg
                class="w-4 h-4 mb-1 text-gray-400 group-hover:text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3M5 21h14" />
              </svg>
              <span class="text-[10px] transform scale-90">置底</span>
            </button>
          </div>
        </div>
      </section>

      <!-- F. 删除 -->
      <div class="pt-4 border-t border-gray-100">
        <button
          @click="emit('delete')"
          class="action-btn text-red-600 bg-red-50 border-red-100 hover:bg-red-100 active:scale-95">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除元素
        </button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-300 p-6 text-center select-none">
      <div class="text-4xl mb-3 opacity-30 grayscale">🎨</div>
      <p class="text-xs">选择元素以编辑属性</p>
    </div>
  </aside>
</template>

<style scoped>
  /* 核心状态样式 (高亮) */
  .btn-active {
    /* 实线/虚线 使用此样式 */
    @apply bg-indigo-600 text-white border-indigo-600 shadow-md;
  }
  .btn-active-sub {
    /* 滤镜等 使用此样式 */
    @apply bg-white border-indigo-500 text-indigo-600 ring-1 ring-indigo-500 shadow-sm;
  }

  /* 🟢 [修改] 文字样式按钮专用样式 */
  .font-style-btn {
    @apply h-9 flex items-center justify-center border border-gray-200 rounded-lg bg-white text-gray-600 text-sm hover:bg-gray-50 active:scale-95 transition;
  }
  .font-style-btn.active {
    /* 选中态：淡紫背景 + 深紫文字 + 边框 */
    @apply bg-indigo-50 text-indigo-600 border-indigo-300 ring-1 ring-indigo-100;
  }

  /* 基础样式 */
  .section-title {
    @apply text-[10px] font-bold text-gray-400 uppercase tracking-wider block;
  }
  .label-row {
    @apply flex justify-between text-xs text-gray-500 mb-1;
  }
  .val {
    @apply font-mono text-gray-400;
  }
  .flex-row-center {
    @apply flex items-center justify-between;
  }
  .control-group {
    @apply space-y-1;
  }

  /* 控件 */
  .color-picker {
    @apply w-6 h-6 rounded cursor-pointer border border-gray-200 bg-transparent p-0 overflow-hidden shadow-sm;
  }
  .range-input {
    @apply w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer;
  }
  .range-input::-webkit-slider-thumb {
    @apply w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-md appearance-none transition-transform hover:scale-110;
    margin-top: -1px;
  }
  .range-input::-moz-range-thumb {
    @apply w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-md appearance-none transition-transform hover:scale-110 border-none;
  }

  /* 按钮通用 */
  .filter-btn {
    @apply flex flex-col items-center justify-center p-2 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition h-12 bg-gray-50 shadow-sm active:scale-95;
  }
  .action-btn {
    @apply w-full py-2.5 border rounded-lg shadow-sm text-xs font-semibold transition flex items-center justify-center gap-2;
  }

  /* 动画 */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
