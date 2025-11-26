<script setup lang="ts">
  import { ref, watch } from 'vue'

  defineProps<{ assets: any }>()

  const emit = defineEmits([
    'add-element',
    'apply-template',
    'upload-image',
    'set-bg-color',
    'set-drawing-mode',
    'set-brush-color',
    'set-brush-width'
  ])

  const activeTab = ref<'templates' | 'elements' | 'text' | 'upload' | 'draw'>('elements')
  const fileInput = ref<HTMLInputElement | null>(null)

  // --- 画笔状态 ---
  const isDrawing = ref(false)
  const brushColor = ref('#000000')
  const brushWidth = ref(5)

  // 监听画笔设置
  watch(isDrawing, val => emit('set-drawing-mode', val))
  watch(brushColor, val => emit('set-brush-color', val))
  watch(brushWidth, val => emit('set-brush-width', parseInt(val as any)))

  // 监听 Tab 切换：进画笔Tab自动开，出Tab自动关
  watch(activeTab, newTab => {
    if (newTab === 'draw') {
      isDrawing.value = true
    } else {
      isDrawing.value = false
    }
  })

  const handleUpload = (e: Event) => {
    const input = e.target as HTMLInputElement
    if (input.files?.[0]) {
      emit('upload-image', input.files[0])
      input.value = ''
    }
  }
</script>

<template>
  <div class="flex h-full border-r border-gray-200 bg-white z-10">
    <!-- 1. 一级导航 -->
    <nav class="w-16 flex flex-col items-center py-4 gap-6 border-r border-gray-100 shrink-0">
      <button
        v-for="tab in ['templates', 'elements', 'text', 'draw', 'upload']"
        :key="tab"
        @click="activeTab = tab as any"
        class="flex flex-col items-center gap-1 p-2 rounded-lg transition w-12"
        :class="activeTab === tab ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-900'">
        <span class="text-xl capitalize">
          {{
            tab === 'templates' ? '🎨' : tab === 'elements' ? '🧩' : tab === 'text' ? 'T' : tab === 'draw' ? '🖊️' : '☁️'
          }}
        </span>
        <span class="text-[10px]">{{
          tab === 'templates'
            ? '背景'
            : tab === 'elements'
            ? '素材'
            : tab === 'text'
            ? '文字'
            : tab === 'draw'
            ? '画笔'
            : '上传'
        }}</span>
      </button>
    </nav>

    <!-- 2. 二级抽屉 -->
    <aside class="w-64 flex flex-col">
      <div class="p-4 border-b border-gray-100">
        <h2 class="font-bold text-gray-800 text-lg">
          {{
            activeTab === 'templates'
              ? '背景设置'
              : activeTab === 'elements'
              ? '添加素材'
              : activeTab === 'text'
              ? '添加文字'
              : activeTab === 'draw'
              ? '自由绘制'
              : '本地上传'
          }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <!-- === 1. 画笔面板 (新功能) === -->
        <div v-if="activeTab === 'draw'" class="space-y-6">
          <!-- 开关 -->
          <div
            @click="isDrawing = !isDrawing"
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition select-none"
            :class="isDrawing ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🖌️</span>
              <div class="flex flex-col">
                <span class="text-sm font-bold" :class="isDrawing ? 'text-indigo-700' : 'text-gray-700'">启用画笔</span>
                <span class="text-[10px] text-gray-500">{{ isDrawing ? '点击画布即可绘画' : '点击此处开启' }}</span>
              </div>
            </div>
            <div
              class="w-10 h-5 rounded-full relative transition-colors"
              :class="isDrawing ? 'bg-indigo-500' : 'bg-gray-300'">
              <div
                class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all"
                :class="isDrawing ? 'left-6' : 'left-1'"></div>
            </div>
          </div>

          <!-- 颜色 -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-400 uppercase">笔触颜色</label>
            <div class="flex gap-2 flex-wrap">
              <div
                v-for="c in ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']"
                :key="c"
                @click="brushColor = c"
                class="w-8 h-8 rounded-full cursor-pointer border hover:scale-110 transition shadow-sm"
                :class="{ 'ring-2 ring-indigo-500 ring-offset-2': brushColor === c }"
                :style="{ backgroundColor: c }"></div>
              <label
                class="w-8 h-8 rounded-full cursor-pointer border bg-white flex items-center justify-center hover:bg-gray-50 relative overflow-hidden">
                <span class="text-xs">➕</span>
                <input type="color" v-model="brushColor" class="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>
          </div>

          <!-- 粗细 -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <label class="text-xs font-bold text-gray-400 uppercase">笔触粗细</label>
              <span class="text-xs font-mono text-gray-500">{{ brushWidth }}px</span>
            </div>
            <input
              type="range"
              v-model="brushWidth"
              min="1"
              max="50"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            <!-- 粗细预览 -->
            <div class="h-12 border border-gray-100 rounded-lg bg-gray-50 flex items-center justify-center mt-2">
              <div
                class="rounded-full bg-gray-800 transition-all"
                :style="{ width: brushWidth + 'px', height: brushWidth + 'px', backgroundColor: brushColor }"></div>
            </div>
          </div>
        </div>

        <!-- === 2. 背景模版 (已恢复原样) === -->
        <div v-if="activeTab === 'templates'" class="space-y-6">
          <!-- 复杂模版 -->
          <div>
            <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">推荐模版</h3>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="tpl in assets.templates"
                :key="tpl.id"
                @click="emit('apply-template', tpl)"
                class="aspect-[2/3] rounded-lg cursor-pointer border hover:shadow-md transition overflow-hidden relative group">
                <!-- 恢复了背景预览 -->
                <div class="w-full h-full" :style="{ background: tpl.preview }"></div>
                <div class="absolute bottom-0 inset-x-0 bg-white/90 p-2 text-xs text-center font-medium">
                  {{ tpl.label }}
                </div>
              </div>
            </div>
          </div>
          <!-- 纯色背景 -->
          <div>
            <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase">纯色背景</h3>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="color in assets.colors"
                :key="color"
                @click="emit('set-bg-color', color)"
                class="w-full aspect-square rounded-full cursor-pointer border hover:scale-110 transition"
                :style="{ backgroundColor: color }"></div>
            </div>
          </div>
        </div>

        <!-- === 3. 素材元素 (已恢复原样) === -->
        <div v-if="activeTab === 'elements'" class="grid grid-cols-2 gap-3">
          <div
            v-for="(item, idx) in assets.elements"
            :key="idx"
            @click="emit('add-element', item)"
            class="aspect-square bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer border border-transparent hover:border-indigo-200 transition group">
            <!-- 恢复了形状判断逻辑 -->
            <div
              v-if="item.type === 'shape'"
              :style="{ backgroundColor: item.color }"
              class="w-10 h-10 shadow-sm transition-transform group-hover:scale-110"
              :class="
                item.shape === 'circle' ? 'rounded-full' : item.shape === 'triangle' ? 'clip-triangle' : 'rounded-sm'
              "></div>
            <img v-else :src="item.url" class="w-12 h-12 object-contain transition-transform group-hover:scale-110" />
          </div>
        </div>

        <!-- === 4. 文字 (已恢复原样) === -->
        <div v-if="activeTab === 'text'" class="space-y-3">
          <div
            v-for="(item, idx) in assets.text"
            :key="idx"
            @click="emit('add-element', item)"
            class="bg-gray-50 hover:bg-indigo-50 border hover:border-indigo-200 rounded p-4 cursor-pointer transition text-center">
            <span :style="{ fontSize: item.fontSize > 30 ? '24px' : '16px', fontWeight: item.fontWeight }">{{
              item.content
            }}</span>
          </div>
        </div>

        <!-- === 5. 上传 === -->
        <div
          v-if="activeTab === 'upload'"
          class="flex flex-col items-center justify-center h-64 bg-gray-50 rounded border-2 border-dashed">
          <button @click="fileInput?.click()" class="bg-indigo-600 text-white px-4 py-2 rounded">选择图片</button>
          <input type="file" ref="fileInput" @change="handleUpload" hidden />
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
  /* 别忘了这个三角形的样式 */
  .clip-triangle {
    clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  }
</style>
