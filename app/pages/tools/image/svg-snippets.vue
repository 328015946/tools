<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('svg_gen.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('svg_gen.desc') }}</p>
    </div>

    <!-- 过滤器 -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="activeCategory = cat"
        :class="[
          'px-4 py-2 rounded-full text-sm font-medium transition border',
          activeCategory === cat
            ? 'bg-rose-600 text-white border-rose-600'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50'
        ]">
        {{ cat }}
      </button>
    </div>

    <!-- 网格列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in filteredSnippets"
        :key="item.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition group">
        <!-- 预览区域 (Preview) -->
        <!-- 如果是 Pattern，需要占满容器；如果是 Icon，居中显示 -->
        <div class="relative h-48 bg-gray-50 border-b border-gray-100 overflow-hidden flex items-center justify-center">
          <!-- 背景棋盘格 (用于显示透明度) -->
          <div
            class="absolute inset-0 opacity-20 pointer-events-none"
            style="background-image: radial-gradient(#999 1px, transparent 1px); background-size: 10px 10px"></div>

          <!-- SVG 渲染容器 -->
          <div
            v-html="item.getCode(item.params)"
            :class="[
              'transition-all duration-300',
              item.category === 'Pattern' || item.category === 'Shape' ? 'w-full h-full' : '' // Pattern 铺满
            ]"></div>
        </div>

        <!-- 控制区域 (Controls) -->
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-bold text-gray-800">{{ $t(item.nameKey) }}</h3>
            <span
              class="text-[10px] px-2 py-1 rounded-full bg-rose-50 text-rose-600 font-bold uppercase tracking-wider">
              {{ item.category }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mb-4 h-5 truncate">{{ $t(item.descKey) }}</p>

          <!-- 动态表单 -->
          <div v-if="item.controls.length" class="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div v-for="ctrl in item.controls" :key="ctrl.key" class="text-xs flex items-center justify-between gap-3">
              <label class="text-gray-600 font-medium min-w-[60px]">{{ ctrl.label }}</label>

              <!-- Select -->
              <select
                v-if="ctrl.type === 'select'"
                v-model="item.params[ctrl.key]"
                class="flex-1 p-1.5 border rounded bg-white text-xs">
                <option v-for="opt in ctrl.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- Color -->
              <div v-else-if="ctrl.type === 'color'" class="flex items-center gap-2">
                <input type="color" v-model="item.params[ctrl.key]" class="h-6 w-8 p-0 border rounded cursor-pointer" />
                <span class="text-gray-400 font-mono">{{ item.params[ctrl.key] }}</span>
              </div>

              <!-- Range -->
              <input
                v-else-if="ctrl.type === 'range'"
                type="range"
                v-model.number="item.params[ctrl.key]"
                :min="ctrl.min"
                :max="ctrl.max"
                :step="ctrl.step || 1"
                class="flex-1 accent-rose-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />

              <!-- Number -->
              <input
                v-else-if="ctrl.type === 'number'"
                type="number"
                v-model.number="item.params[ctrl.key]"
                :min="ctrl.min"
                :max="ctrl.max"
                :step="ctrl.step"
                class="w-16 p-1.5 border rounded text-right" />

              <!-- Boolean -->
              <input
                v-else-if="ctrl.type === 'boolean'"
                type="checkbox"
                v-model="item.params[ctrl.key]"
                class="w-4 h-4 accent-rose-500 rounded cursor-pointer" />
            </div>
          </div>

          <!-- 源码/复制区域 -->
          <div class="mt-auto pt-2 border-t border-gray-100 flex gap-2">
            <!-- 源码输入框 (只读，用于复制) -->
            <input
              readonly
              :value="item.getCode(item.params)"
              class="flex-1 text-[10px] bg-gray-50 border border-gray-200 rounded px-2 text-gray-500 font-mono truncate focus:outline-none" />
            <button
              @click="copyToClipboard(item.getCode(item.params))"
              class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded transition shadow-sm flex items-center gap-1">
              <span class="text-xs">📋</span> {{ $t('svg_gen.copy_code') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { copyToClipboard } = useCopy()
  const { snippets } = useSvgSnippets()

  const activeCategory = ref('All')

  const categories = computed(() => {
    const cats = new Set(snippets.map(s => s.category))
    return ['All', ...Array.from(cats)]
  })

  const filteredSnippets = computed(() => {
    if (activeCategory.value === 'All') return snippets
    return snippets.filter(s => s.category === activeCategory.value)
  })

  useHead({ title: t('svg_gen.title') })
</script>
