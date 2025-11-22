<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 14:57:48
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 14:57:58
 * @FilePath: \xiao-nuxt4\app\components\CheatsheetLayout.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
      <p class="text-gray-500 mt-2">{{ desc }}</p>
    </div>

    <!-- 搜索框 -->
    <div class="sticky top-20 z-10 bg-gray-50/80 backdrop-blur-md p-2 rounded-xl border border-gray-200 mb-8 shadow-sm">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          v-model="search"
          type="text"
          :placeholder="$t('cheatsheet.search')"
          class="w-full pl-10 pr-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white" />
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="(group, idx) in filteredData"
        :key="idx"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          class="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase tracking-wide">
          {{ group.category }}
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="(item, i) in group.items"
            :key="i"
            class="p-4 hover:bg-gray-50 transition group/item flex justify-between items-start gap-4">
            <div class="flex-grow min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <code class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-sm font-mono break-all">{{
                  item.code
                }}</code>
                <button
                  @click="copy(item.code)"
                  class="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-emerald-600 transition">
                  📋
                </button>
              </div>
              <div class="text-sm text-gray-500">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredData.length === 0" class="text-center text-gray-400 py-10">No results found.</div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{
    title: string
    desc: string
    data: Array<{ category: string; items: Array<{ code: string; desc: string }> }>
  }>()

  const { copyToClipboard } = useCopy()
  const search = ref('')

  const filteredData = computed(() => {
    if (!search.value) return props.data

    const q = search.value.toLowerCase()
    // 过滤逻辑：如果分类名或子项匹配，保留该组
    return props.data
      .map(group => {
        const matchItems = group.items.filter(
          item => item.code.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
        )
        if (matchItems.length > 0) {
          return { ...group, items: matchItems }
        }
        return null
      })
      .filter(Boolean) as typeof props.data
  })

  const copy = (text: string) => copyToClipboard(text)
</script>
