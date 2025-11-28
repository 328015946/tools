<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-26 16:46:56
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-27 18:47:33
 * @FilePath: \xiao-nuxt4\app\components\EditorHeader.vue
 * @Description: 注释
-->
<script setup lang="ts">
  const props = defineProps<{
    historyIndex: number
    historyLength: number
    // [新增] 接收当前尺寸
    canvasWidth: number
    canvasHeight: number
  }>()

  const emit = defineEmits(['undo', 'redo', 'save', 'download', 'toggle-grid', 'add-guide', 'resize'])
  // 控制图层面板
  const showLayers = ref(false)

  // [新增] 常用尺寸预设
  const presets = [
    { label: '自定义', w: 0, h: 0 },
    { label: '电商海报 (800x800)', w: 800, h: 800 },
    { label: '手机海报 (600x800)', w: 600, h: 800 },
    { label: 'Instagram (1080x1080)', w: 1080, h: 1080 },
    { label: '小红书 (1242x1660)', w: 1242, h: 1660 },
    { label: '公众号封面 (900x383)', w: 900, h: 383 },
    { label: 'A4 纸 (595x842)', w: 595, h: 842 } // 72dpi
  ]

  // 处理输入框变化 (失去焦点或回车时触发)
  const handleInput = (e: any, type: 'w' | 'h') => {
    const val = parseInt(e.target.value)
    if (!val || val <= 0) return

    emit('resize', {
      width: type === 'w' ? val : props.canvasWidth,
      height: type === 'h' ? val : props.canvasHeight
    })
  }

  // 处理预设选择
  const handlePreset = (e: any) => {
    const idx = e.target.selectedIndex
    if (idx > 0) {
      // 跳过"自定义"
      const p = presets[idx]
      emit('resize', { width: p.w, height: p.h })
    }
  }
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
    <div class="flex items-center gap-4">
      <span class="text-indigo-600 text-xl font-black tracking-tight">DesignPro</span>

      <!-- 撤销/重做 -->
      <div class="flex items-center gap-1 bg-gray-100 rounded-md p-1">
        <button
          @click="$emit('undo')"
          :disabled="historyIndex <= 0"
          class="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition"
          title="撤销 (Ctrl+Z)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        </button>
        <button
          @click="$emit('redo')"
          :disabled="historyIndex >= historyLength - 1"
          class="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 transition"
          title="重做 (Ctrl+Shift+Z)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path>
          </svg>
        </button>
      </div>
    </div>
    <!-- [新增] 中间：尺寸控制区 -->
    <div class="flex items-center gap-2 px-4 border-l border-r border-gray-100 mx-2">
      <!-- 预设下拉 -->
      <select
        @change="handlePreset"
        class="text-xs border border-gray-200 rounded py-1 px-2 bg-gray-50 text-gray-600 outline-none hover:border-indigo-300 w-24 truncate">
        <option v-for="(p, i) in presets" :key="i" :value="i">{{ p.label }}</option>
      </select>

      <!-- 宽 -->
      <div
        class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200 focus-within:ring-1 focus-within:ring-indigo-500">
        <span class="text-[10px] text-gray-400 font-bold">W</span>
        <input
          type="number"
          :value="canvasWidth"
          @change="e => handleInput(e, 'w')"
          class="w-12 bg-transparent text-xs font-mono text-gray-700 outline-none text-right" />
      </div>

      <span class="text-gray-300">×</span>

      <!-- 高 -->
      <div
        class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200 focus-within:ring-1 focus-within:ring-indigo-500">
        <span class="text-[10px] text-gray-400 font-bold">H</span>
        <input
          type="number"
          :value="canvasHeight"
          @change="e => handleInput(e, 'h')"
          class="w-12 bg-transparent text-xs font-mono text-gray-700 outline-none text-right" />
      </div>
      <span class="text-[10px] text-gray-400 ml-1">px</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 border-r border-gray-200 pr-4 mr-4">
        <button @click="$emit('toggle-grid')" class="tool-btn" title="显示/隐藏网格">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 4v16M14 4v16M4 10h16M4 14h16" />
          </svg>
        </button>
        <button @click="$emit('add-guide', 'h')" class="tool-btn" title="添加水平辅助线">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
          </svg>
        </button>
        <button @click="$emit('add-guide', 'v')" class="tool-btn" title="添加垂直辅助线">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16" />
          </svg>
        </button>
      </div>
      <button @click="$emit('save')" class="text-sm text-gray-600 hover:text-indigo-600 font-medium">保存项目</button>
      <button
        @click="$emit('download')"
        class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition shadow-sm">
        下载图片
      </button>
    </div>
  </header>
</template>
<style scoped>
  /* 增加一个简单的按钮样式 */
  .tool-btn {
    @apply p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-indigo-600 transition;
  }
</style>
