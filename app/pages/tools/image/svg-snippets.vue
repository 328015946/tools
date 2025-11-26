<template>
  <!-- 1. 修改：将最大宽度改大 max-w-[1600px] 或 max-w-full，让5列显示更从容 -->
  <div class="max-w-[1800px] mx-auto py-8 px-4">
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

    <!-- 2. 修改：Grid 响应式布局
         sm:2列, md:3列, lg:4列, xl:5列
         gap-6 改为 gap-4 让间距更紧凑 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="item in filteredSnippets"
        :key="item.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition group">
        <!-- 3. 修改：预览区域高度
             h-48 (192px) -> h-36 (144px) 或 h-40 (160px)
             这里使用 h-40 保持视觉平衡 -->
        <div class="relative h-40 bg-gray-50 border-b border-gray-100 overflow-hidden flex items-center justify-center">
          <!-- 背景棋盘格 -->
          <div
            class="absolute inset-0 opacity-20 pointer-events-none"
            style="background-image: radial-gradient(#999 1px, transparent 1px); background-size: 10px 10px"></div>

          <!-- SVG 渲染容器 -->
          <div
            v-html="item.getCode(item.params)"
            :class="[
              'transition-all duration-300',
              item.category === 'Pattern' || item.category === 'Shape' ? 'w-full h-full' : ''
            ]"></div>
        </div>

        <!-- 4. 修改：控制区域 Padding
             p-5 -> p-3，节省空间 -->
        <div class="p-3 flex-1 flex flex-col">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-gray-800 text-sm truncate pr-2">{{ $t(item.nameKey) }}</h3>
            <span
              class="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold uppercase tracking-wider shrink-0">
              {{ item.category }}
            </span>
          </div>
          <!-- mb-4 -> mb-2 -->
          <p class="text-xs text-gray-500 mb-2 h-4 truncate">{{ $t(item.descKey) }}</p>

          <!-- 动态表单 -->
          <div v-if="item.controls.length" class="space-y-2 mb-3 p-2 bg-gray-50 rounded border border-gray-100">
            <div v-for="ctrl in item.controls" :key="ctrl.key" class="text-xs flex items-center justify-between gap-2">
              <!-- 标签宽度稍微减小 -->
              <label class="text-gray-600 font-medium min-w-[50px] truncate">{{ ctrl.label }}</label>

              <!-- Select -->
              <select
                v-if="ctrl.type === 'select'"
                v-model="item.params[ctrl.key]"
                class="flex-1 p-1 border rounded bg-white text-xs h-6">
                <option v-for="opt in ctrl.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- Color -->
              <div v-else-if="ctrl.type === 'color'" class="flex items-center gap-2">
                <span class="text-gray-400 font-mono text-[10px]">{{ item.params[ctrl.key] }}</span>
                <input type="color" v-model="item.params[ctrl.key]" class="h-5 w-6 p-0 border rounded cursor-pointer" />
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
                class="w-12 p-1 border rounded text-right h-6" />

              <!-- Boolean -->
              <input
                v-else-if="ctrl.type === 'boolean'"
                type="checkbox"
                v-model="item.params[ctrl.key]"
                class="w-3.5 h-3.5 accent-rose-500 rounded cursor-pointer" />
            </div>
          </div>

          <!-- 源码/复制区域 -->
          <div class="mt-auto pt-2 border-t border-gray-100 flex gap-2">
            <input
              readonly
              :value="item.getCode(item.params)"
              class="flex-1 text-[10px] bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-500 font-mono truncate focus:outline-none" />
            <button
              @click="copyToClipboard(item.getCode(item.params))"
              class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded transition shadow-sm flex items-center gap-1 shrink-0">
              <span class="text-xs">📋</span>
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
