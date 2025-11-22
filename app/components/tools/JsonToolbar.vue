<!-- components/tools/JsonToolbar.vue -->
<template>
  <div class="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6 items-center">
    <!-- 1. 视图切换 (新增) -->
    <div class="flex bg-gray-100 p-1 rounded-lg mr-4">
      <button
        @click="$emit('update:mode', 'code')"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1"
        :class="mode === 'code' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        📝 {{ $t('json.view_code') }}
      </button>
      <button
        @click="$emit('update:mode', 'tree')"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1"
        :class="mode === 'tree' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
        🌳 {{ $t('json.view_tree') }}
      </button>
    </div>

    <!-- 分割线 -->
    <div class="w-px h-6 bg-gray-200 mr-2 hidden sm:block"></div>

    <!-- 格式化按钮组 -->
    <div class="flex items-center space-x-2">
      <button @click="$emit('format', 2)" class="btn-secondary">
        {{ $t('json.format_2') }}
      </button>
      <button @click="$emit('format', 4)" class="btn-secondary">
        {{ $t('json.format_4') }}
      </button>
    </div>

    <!-- 压缩按钮 -->
    <button @click="$emit('minify')" class="btn-secondary ml-2">
      {{ $t('json.minify') }}
    </button>

    <div class="flex-grow"></div>

    <!-- 右侧操作 -->
    <button @click="$emit('clear')" class="text-gray-500 hover:text-red-500 px-3 py-2 text-sm transition">
      {{ $t('json.clear') }}
    </button>

    <button
      @click="copyResult"
      :disabled="!hasContent"
      class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
      <span v-if="copied">✅ {{ $t('json.copied') }}</span>
      <span v-else>📋 {{ $t('json.copy') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{
    content: string
    mode: 'code' | 'tree' // 新增 props
  }>()

  const emit = defineEmits(['format', 'minify', 'clear', 'update:mode']) // 新增 update:mode 事件

  const copied = ref(false)
  const hasContent = computed(() => props.content.length > 0)

  const copyResult = async () => {
    if (!props.content) return
    try {
      await navigator.clipboard.writeText(props.content)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch (err) {
      console.error(err)
    }
  }
</script>

<style scoped>
  .btn-secondary {
    @apply px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 hover:border-emerald-400 transition shadow-sm;
  }
</style>
