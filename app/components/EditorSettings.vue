<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ activeObject: any }>()
  const emit = defineEmits(['update-prop', 'change-layer', 'delete', 'group', 'ungroup', 'toggle-style'])

  const update = (key: string, value: any) => emit('update-prop', { key, value })

  // --- 类型判断 ---
  const isText = computed(
    () => props.activeObject && (props.activeObject.type === 'i-text' || props.activeObject.type === 'text')
  )
  const isImage = computed(() => props.activeObject && props.activeObject.type === 'image')
  const isSelection = computed(() => props.activeObject && props.activeObject.type === 'activeSelection')
  const isGroup = computed(() => props.activeObject && props.activeObject.type === 'group')

  // 更新阴影
  const updateShadow = (color: string) => {
    const shadow = { color, blur: 10, offsetX: 5, offsetY: 5 }
    update('shadow', color ? shadow : null)
  }
</script>

<template>
  <aside class="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10 h-full">
    <!-- 顶部标题 -->
    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
      <h2 class="font-bold text-gray-700 text-sm uppercase">
        <span v-if="isText">📝 文字属性</span>
        <span v-else-if="isImage">🖼️ 图片属性</span>
        <span v-else-if="isGroup">⛓️ 组合属性</span>
        <span v-else-if="isSelection">✨ 多选属性</span>
        <span v-else>🎨 元素属性</span>
      </h2>
    </div>

    <div v-if="activeObject" class="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
      <!-- 1. 组合操作区 (仅在多选或组时显示) -->
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

      <!-- 2. 文字专属设置 (置顶显示) -->
      <div v-if="isText" class="space-y-4 pb-4 border-b border-gray-100">
        <div class="space-y-2">
          <label class="section-title">文字样式</label>
          <div class="flex gap-2">
            <button
              @click="emit('toggle-style', 'bold')"
              class="style-btn font-bold"
              :class="{ active: activeObject.fontWeight === 'bold' }">
              B
            </button>
            <button
              @click="emit('toggle-style', 'italic')"
              class="style-btn italic"
              :class="{ active: activeObject.fontStyle === 'italic' }">
              I
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">字号</span>
            <span class="text-xs font-mono">{{ activeObject.fontSize }}</span>
          </div>
          <input
            type="range"
            min="8"
            max="200"
            :value="activeObject.fontSize"
            @input="(e:any) => update('fontSize', parseInt(e.target.value))"
            class="range-input" />
        </div>

        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">文字颜色</span>
          <input
            type="color"
            :value="activeObject.fill"
            @input="(e:any) => update('fill', e.target.value)"
            class="color-picker" />
        </div>
      </div>

      <!-- 3. 通用外观 (非文字时显示更多细节) -->
      <div class="space-y-3">
        <label class="section-title">外观</label>

        <!-- 非文字时显示填充 -->
        <div v-if="!isText" class="flex items-center justify-between">
          <span class="text-sm text-gray-600">填充颜色</span>
          <input
            type="color"
            :value="activeObject.fill"
            @input="(e:any) => update('fill', e.target.value)"
            class="color-picker" />
        </div>

        <!-- 描边 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">描边颜色</span>
          <input
            type="color"
            :value="activeObject.stroke || '#000000'"
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

      <!-- 4. 阴影 -->
      <div class="space-y-3 pt-4 border-t border-gray-100">
        <label class="section-title">阴影</label>
        <div class="flex gap-2">
          <button @click="updateShadow('#000000')" class="flex-1 py-1 border rounded text-xs hover:bg-gray-50">
            添加
          </button>
          <button @click="updateShadow('')" class="flex-1 py-1 border rounded text-xs hover:bg-gray-50 text-red-500">
            移除
          </button>
        </div>
      </div>

      <!-- 5. 布局控制 (恢复你喜欢的 UI) -->
      <div class="space-y-3 pt-4 border-t border-gray-100">
        <label class="section-title">图层 & 透明度</label>

        <!-- 这里恢复了之前的 grid-cols-2 和 SVG 图标按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <!-- 置顶 -->
          <button @click="emit('change-layer', 'top')" class="layer-btn group">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 10l7-7m0 0l7 7m-7-7v18M5 3h14" />
            </svg>
            <span class="text-xs font-medium">置顶</span>
          </button>

          <!-- 上移 -->
          <button @click="emit('change-layer', 'up')" class="layer-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
            <span class="text-xs font-medium">上移</span>
          </button>

          <!-- 下移 -->
          <button @click="emit('change-layer', 'down')" class="layer-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-xs font-medium">下移</span>
          </button>

          <!-- 置底 -->
          <button @click="emit('change-layer', 'bottom')" class="layer-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3M5 21h14" />
            </svg>
            <span class="text-xs font-medium">置底</span>
          </button>
        </div>

        <div class="space-y-1 mt-3">
          <div class="flex justify-between">
            <span class="text-xs text-gray-500">不透明度</span>
            <span class="text-xs font-mono">{{ Math.round((activeObject.opacity || 1) * 100) }}%</span>
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

  /* 图层按钮样式 */
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
</style>
