<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('snippets.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('snippets.desc') }}</p>
    </div>

    <!-- Filter -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="activeCategory = cat"
        :class="[
          'px-4 py-2 rounded-full text-sm font-medium transition border',
          activeCategory === cat
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        ]">
        {{ cat }}
      </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in filteredSnippets"
        :key="item.id"
        class="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition">
        <!-- Preview -->
        <div
          class="h-32 bg-gray-100 border-b border-gray-100 flex items-center justify-center relative overflow-hidden p-4">
          <div :style="item.getCode(item.params)" class="transition-all duration-300">
            <span v-if="item.category === 'Text'" class="text-lg font-bold">Text</span>
            <span v-else-if="item.category === 'Layout'" class="w-8 h-8 bg-indigo-500 rounded block"></span>
            <div
              v-else-if="item.category === 'UI' || item.category === 'Effect'"
              class="w-16 h-16 flex items-center justify-center bg-white shadow rounded">
              UI
            </div>
          </div>
          <!-- Grid Background -->
          <div
            class="absolute inset-0 opacity-10 pointer-events-none"
            style="background-image: radial-gradient(#666 1px, transparent 1px); background-size: 10px 10px"></div>
        </div>

        <!-- Controls -->
        <div class="p-4 flex-1 flex flex-col">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-gray-800 text-sm">{{ $t(item.nameKey) }}</h3>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{{
              item.category
            }}</span>
          </div>
          <p class="text-xs text-gray-500 mb-4 h-8 line-clamp-2">{{ $t(item.descKey) }}</p>

          <div v-if="item.controls.length" class="space-y-2 mb-4 p-2 bg-gray-50 rounded border border-gray-100">
            <div v-for="ctrl in item.controls" :key="ctrl.key" class="text-xs flex items-center justify-between gap-2">
              <label class="text-gray-500 whitespace-nowrap">{{ ctrl.label }}</label>

              <select
                v-if="ctrl.type === 'select'"
                v-model="item.params[ctrl.key]"
                class="w-20 p-1 border rounded bg-white text-xs">
                <option v-for="opt in ctrl.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <input
                v-else-if="ctrl.type === 'color'"
                type="color"
                v-model="item.params[ctrl.key]"
                class="h-5 w-6 p-0 border rounded cursor-pointer" />

              <input
                v-else-if="ctrl.type === 'range'"
                type="range"
                v-model.number="item.params[ctrl.key]"
                :min="ctrl.min"
                :max="ctrl.max"
                :step="ctrl.step || 1"
                class="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />

              <input
                v-else-if="ctrl.type === 'number'"
                type="number"
                v-model.number="item.params[ctrl.key]"
                :min="ctrl.min"
                :max="ctrl.max"
                class="w-16 p-1 border rounded text-right" />
            </div>
          </div>

          <!-- Code -->
          <div class="relative group mt-auto">
            <pre class="bg-gray-800 text-gray-300 text-[10px] p-3 rounded-lg overflow-x-auto font-mono max-h-24">{{
              item.getCode(item.params)
            }}</pre>
            <button
              @click="copyToClipboard(item.getCode(item.params))"
              class="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 text-white rounded opacity-0 group-hover:opacity-100 transition">
              📋
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
  const { snippets } = useCssSnippets()

  const activeCategory = ref('All')

  const categories = computed(() => {
    const cats = new Set(snippets.map(s => s.category))
    return ['All', ...Array.from(cats)]
  })

  const filteredSnippets = computed(() => {
    if (activeCategory.value === 'All') return snippets
    return snippets.filter(s => s.category === activeCategory.value)
  })

  useHead({ title: t('snippets.title') })
</script>
