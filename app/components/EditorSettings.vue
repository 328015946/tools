<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ activeObject: any }>()

  // 增加 update-image-radius 事件
  const emit = defineEmits([
    'update-prop',
    'change-layer',
    'delete',
    'group',
    'ungroup',
    'toggle-style',
    'update-image-radius', // [新增]
    'align', // 👈 必须在这里加上这一行
    'update-filter', // [新增]
    'set-as-bg' // [新增]
  ])

  const update = (key: string, value: any) => emit('update-prop', { key, value })
  // input type="color" 只能接受 #RRGGBB，不能接受 rgb() 或 rgba()
  const normalizeColor = (color: string | undefined | null) => {
    if (!color) return '#000000'

    // 如果已经是 hex 格式 (#fff 或 #ffffff)
    if (color.startsWith('#')) {
      if (color.length === 4) {
        // #fff -> #ffffff
        return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      }
      return color.slice(0, 7) // 忽略 alpha 通道 (#ffffff00 -> #ffffff)
    }

    // 处理 rgb(r, g, b) 或 rgba(r, g, b, a)
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g)
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]).toString(16).padStart(2, '0')
        const g = parseInt(rgb[1]).toString(16).padStart(2, '0')
        const b = parseInt(rgb[2]).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
      }
    }

    return '#000000' // 默认回退
  }
  // --- 2. 类型判断修复 (核心修改) ---
  // 获取当前类型并转为小写，确保 activeselection 和 activeSelection 都能匹配
  const objectType = computed(() => {
    return props.activeObject?.type?.toLowerCase() || ''
  })
  // --- 类型判断 ---
  const isText = computed(() => props.activeObject && ['i-text', 'text', 'textbox'].includes(props.activeObject.type))
  const isImage = computed(() => props.activeObject && props.activeObject.type === 'image')
  const isGroup = computed(() => props.activeObject && props.activeObject.type === 'group')
  // 【这里是关键修改】匹配全小写
  const isSelection = computed(() => objectType.value === 'activeselection')
  // 普通形状 (矩形、圆、三角等)，排除文字、图片、组
  // 排除多选状态，多选时 activeSelection 可能没有 fill 属性，导致逻辑混乱，
  // 我们只让多选显示“组合”按钮，不显示颜色选择器，除非你真的想支持多选改色
  const isShape = computed(
    () => props.activeObject && !isText.value && !isImage.value && !isGroup.value && !isSelection.value
  )

  // 更新阴影
  const updateShadow = (color: string) => {
    const shadow = { color, blur: 10, offsetX: 5, offsetY: 5 }
    update('shadow', color ? shadow : null)
  }
</script>

<template>
  <aside class="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10 h-full">
    <!-- 1. 顶部标题栏 -->
    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
      <h2 class="font-bold text-gray-700 text-sm uppercase flex items-center gap-2">
        <span v-if="isText">📝 文字属性</span>
        <span v-else-if="isImage">🖼️ 图片属性</span>
        <span v-else-if="isGroup">⛓️ 组合属性</span>
        <span v-else-if="isSelection">✨ 多选属性</span>
        <span v-else>🎨 形状属性</span>
      </h2>
      <!-- 显示对象类型用于调试，可删 -->
      <span class="text-[10px] text-gray-400 font-mono" v-if="activeObject">{{ activeObject.type }}</span>
    </div>
    <!-- 对齐工具栏 -->
    <!-- 对齐工具栏 -->
    <div v-if="activeObject" class="space-y-2 p-4 border-b border-gray-100">
      <label class="section-title">快捷对齐</label>

      <!-- 改为 2 列布局，更像你的截图风格 -->
      <div class="grid grid-cols-2 gap-2">
        <!-- 左对齐 -->
        <button @click="$emit('align', 'left')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v16" />
          </svg>
          <span>左对齐</span>
        </button>

        <!-- 水平居中 -->
        <button @click="$emit('align', 'centerH')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8h8M6 16h12" />
          </svg>
          <span>水平居中</span>
        </button>

        <!-- 右对齐 -->
        <button @click="$emit('align', 'right')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6H4M20 12h-8M20 18H8" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 4v16" />
          </svg>
          <span>右对齐</span>
        </button>

        <!-- 顶对齐 -->
        <button @click="$emit('align', 'top')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4v16M12 4v10M18 4v14" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16" />
          </svg>
          <span>顶对齐</span>
        </button>

        <!-- 垂直居中 -->
        <button @click="$emit('align', 'centerV')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8v8M16 6v12" />
          </svg>
          <span>垂直居中</span>
        </button>

        <!-- 底对齐 -->
        <button @click="$emit('align', 'bottom')" class="align-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 20V4M12 20v-8M18 20V6" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20h16" />
          </svg>
          <span>底对齐</span>
        </button>
      </div>
    </div>
    <!-- 2. 内容滚动区 -->
    <div v-if="activeObject" class="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
      <!-- === A. 组合/多选操作区 === -->
      <div v-if="isSelection" class="bg-indigo-50 p-3 rounded-lg text-center border border-indigo-100">
        <p class="text-xs text-indigo-600 mb-2 font-medium">已选中多个元素</p>
        <button @click="emit('group')" class="action-btn text-indigo-700 border-indigo-200">🔗 组合 (Ctrl+G)</button>
      </div>
      <div v-if="isGroup" class="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
        <p class="text-xs text-gray-500 mb-2">这是一个组合</p>
        <button @click="emit('ungroup')" class="action-btn text-gray-700 border-gray-300">
          ⛓️ 取消组合 (Ctrl+Shift+G)
        </button>
      </div>

      <!-- === B. 文字专属设置 === -->
      <div v-if="isText" class="space-y-5 pb-4 border-b border-gray-100">
        <label class="section-title">排版设置</label>

        <!-- 1. 基础样式 (加粗/斜体/下划线/删除线) -->
        <div class="flex gap-2">
          <button
            @click="emit('toggle-style', 'bold')"
            class="style-btn font-bold"
            :class="{ active: activeObject.fontWeight === 'bold' }"
            title="加粗">
            B
          </button>
          <button
            @click="emit('toggle-style', 'italic')"
            class="style-btn italic"
            :class="{ active: activeObject.fontStyle === 'italic' }"
            title="斜体">
            I
          </button>
          <button
            @click="update('underline', !activeObject.underline)"
            class="style-btn underline"
            :class="{ active: activeObject.underline }"
            title="下划线">
            U
          </button>
          <button
            @click="update('linethrough', !activeObject.linethrough)"
            class="style-btn line-through"
            :class="{ active: activeObject.linethrough }"
            title="删除线">
            S
          </button>
        </div>

        <!-- 2. 字号 -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>字号 (Size)</span>
            <span class="font-mono">{{ activeObject.fontSize }}</span>
          </div>
          <input
            type="range"
            min="8"
            max="200"
            :value="activeObject.fontSize"
            @input="(e:any) => update('fontSize', parseInt(e.target.value))"
            class="range-input" />
        </div>

        <!-- 3. [新增] 字间距 (Letter Spacing) -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>字间距 (Spacing)</span>
            <span class="font-mono">{{ activeObject.charSpacing || 0 }}</span>
          </div>
          <!-- Fabric 的 charSpacing 单位是千分之em，范围通常 -100 到 800 -->
          <input
            type="range"
            min="-100"
            max="800"
            step="10"
            :value="activeObject.charSpacing || 0"
            @input="(e:any) => update('charSpacing', parseInt(e.target.value))"
            class="range-input" />
        </div>

        <!-- 4. [新增] 行高 (Line Height) -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>行高 (Line Height)</span>
            <span class="font-mono">{{ (activeObject.lineHeight || 1.16).toFixed(1) }}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            :value="activeObject.lineHeight || 1.16"
            @input="(e:any) => update('lineHeight', parseFloat(e.target.value))"
            class="range-input" />
        </div>

        <!-- 5. 颜色与描边 -->
        <div class="space-y-3 pt-2 border-t border-gray-50">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">文字颜色</span>
            <input
              type="color"
              :value="normalizeColor(activeObject.fill)"
              @input="(e:any) => update('fill', e.target.value)"
              class="color-picker" />
          </div>

          <!-- [新增] 文字描边 -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">文字描边</span>
            <input
              type="color"
              :value="activeObject.stroke || '#000000'"
              @input="(e:any) => update('stroke', e.target.value)"
              class="color-picker" />
          </div>
          <div v-if="activeObject.stroke" class="space-y-1">
            <div class="flex justify-between text-xs text-gray-500">
              <span>描边粗细</span>
              <span class="font-mono">{{ activeObject.strokeWidth || 0 }}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              :value="activeObject.strokeWidth || 0"
              @input="(e:any) => update('strokeWidth', parseFloat(e.target.value))"
              class="range-input" />
          </div>
        </div>
      </div>

      <!-- === C. 图片专属设置 (新增圆角) === -->
      <!-- === C. 图片专属设置 (升级版) === -->
      <div v-if="isImage" class="space-y-5 pb-4 border-b border-gray-100">
        <label class="section-title">图片样式</label>

        <!-- 圆角控制 (保留你之前的) -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>圆角半径</span>
            <span class="font-mono">{{ activeObject.corners || 0 }}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="activeObject.corners || 0"
            @input="(e:any) => emit('update-image-radius', parseInt(e.target.value))"
            class="range-input" />
        </div>

        <!-- [新增] 滤镜 (Filters) -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-gray-400">滤镜特效</label>
          <div class="grid grid-cols-3 gap-2">
            <button @click="$emit('update-filter', 'none')" class="filter-btn">🚫 原图</button>
            <button @click="$emit('update-filter', 'grayscale')" class="filter-btn grayscale">🌑 黑白</button>
            <button @click="$emit('update-filter', 'sepia')" class="filter-btn sepia">🍂 复古</button>
            <button @click="$emit('update-filter', 'invert')" class="filter-btn invert">🌗 反色</button>
            <button @click="$emit('update-filter', 'blur')" class="filter-btn blur-[1px]">💧 模糊</button>
            <button @click="$emit('update-filter', 'contrast')" class="filter-btn contrast-125">🔆 对比</button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-sm text-gray-600">边框颜色</span>
          <input
            type="color"
            :value="activeObject.stroke || '#000000'"
            @input="(e:any) => update('stroke', e.target.value)"
            class="color-picker" />
        </div>
        <div class="space-y-1" v-if="activeObject.stroke">
          <span class="text-xs text-gray-500">边框宽度: {{ activeObject.strokeWidth || 0 }}</span>
          <input
            type="range"
            min="0"
            max="20"
            :value="activeObject.strokeWidth || 0"
            @input="(e:any) => update('strokeWidth', parseInt(e.target.value))"
            class="range-input" />
        </div>
        <!-- [新增] 设为背景按钮 -->
        <div class="pt-2 border-t border-gray-50">
          <button
            @click="$emit('set-as-bg')"
            class="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition flex items-center justify-center gap-2 border border-indigo-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            设为画布背景 (铺满)
          </button>
          <p class="text-[10px] text-gray-400 mt-1 text-center">将移除当前图片并设为背景</p>
        </div>
      </div>

      <!-- === D. 普通形状 (矩形/圆) === -->
      <div v-if="isShape" class="space-y-3 pb-4 border-b border-gray-100">
        <label class="section-title">填充与描边</label>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">填充颜色</span>
          <input
            type="color"
            :value="normalizeColor(activeObject.fill)"
            @input="(e:any) => update('fill', e.target.value)"
            class="color-picker" />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">描边颜色</span>
          <input
            type="color"
            :value="normalizeColor(activeObject.stroke || '#000000')"
            @input="(e:any) => update('stroke', e.target.value)"
            class="color-picker" />
        </div>

        <div class="space-y-1">
          <span class="text-xs text-gray-500">描边宽度: {{ activeObject.strokeWidth || 0 }}</span>
          <input
            type="range"
            min="0"
            max="20"
            :value="activeObject.strokeWidth || 0"
            @input="(e:any) => update('strokeWidth', parseInt(e.target.value))"
            class="range-input" />
        </div>
      </div>

      <!-- === E. 通用效果 (阴影/透明度/图层) === -->
      <div class="space-y-6">
        <!-- 阴影 -->
        <div class="space-y-2">
          <label class="section-title">阴影</label>
          <div class="flex gap-2">
            <button @click="updateShadow('#000000')" class="flex-1 py-1 border rounded text-xs hover:bg-gray-50">
              添加阴影
            </button>
            <button @click="updateShadow('')" class="flex-1 py-1 border rounded text-xs hover:bg-gray-50 text-red-500">
              移除
            </button>
          </div>
        </div>

        <!-- 图层与透明度 -->
        <div class="space-y-3">
          <label class="section-title">图层 & 透明度</label>

          <div class="grid grid-cols-2 gap-2">
            <button @click="emit('change-layer', 'top')" class="layer-btn group">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18M5 3h14" />
              </svg>
              <span>置顶</span>
            </button>
            <button @click="emit('change-layer', 'up')" class="layer-btn">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              <span>上移</span>
            </button>
            <button @click="emit('change-layer', 'down')" class="layer-btn">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>下移</span>
            </button>
            <button @click="emit('change-layer', 'bottom')" class="layer-btn">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3M5 21h14" />
              </svg>
              <span>置底</span>
            </button>
          </div>

          <div class="space-y-1 mt-3">
            <div class="flex justify-between text-xs text-gray-500">
              <span>不透明度</span>
              <span class="font-mono">{{ Math.round((activeObject.opacity || 1) * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              :value="activeObject.opacity || 1"
              @input="(e:any) => update('opacity', parseFloat(e.target.value))"
              class="range-input" />
          </div>
        </div>
      </div>

      <!-- 删除按钮 -->
      <div class="pt-6 pb-2">
        <button
          @click="emit('delete')"
          class="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition shadow-sm flex items-center justify-center gap-2">
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

    <!-- 未选中状态 -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center select-none">
      <div class="text-5xl mb-4 grayscale opacity-30">🎨</div>
      <p class="text-sm font-medium">点击画布中的元素<br />开始编辑属性</p>
    </div>
  </aside>
</template>

<style scoped>
  .section-title {
    @apply text-xs font-bold text-gray-400 uppercase tracking-wider block;
  }
  .color-picker {
    @apply w-6 h-6 rounded cursor-pointer border border-gray-200 bg-transparent p-0 overflow-hidden;
  }
  .range-input {
    @apply w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600;
  }
  .action-btn {
    @apply w-full py-1.5 bg-white border rounded shadow-sm text-xs font-medium hover:bg-gray-50 transition;
  }
  .style-btn {
    @apply flex-1 border border-gray-200 rounded py-1.5 hover:bg-gray-50 transition text-sm;
  }
  .style-btn.active {
    @apply bg-indigo-50 text-indigo-600 border-indigo-300;
  }
  .layer-btn {
    @apply flex items-center justify-center gap-2 px-2 py-2 border border-gray-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition text-gray-600 text-xs font-medium;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 2px;
  }
  /* 添加到 EditorSettings.vue 的 style 中 */

  /* 修改 align-btn 样式 */
  .align-btn {
    @apply flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition text-gray-600 text-xs font-medium w-full;
  }
  .filter-btn {
    @apply flex flex-col items-center justify-center p-2 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition h-14 bg-gray-50;
  }
</style>
