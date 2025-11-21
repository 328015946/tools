<template>
  <div class="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
    <!-- 格式化按钮组 -->
    <div class="flex items-center space-x-2 border-r border-gray-200 pr-4 mr-2">
      <button @click="$emit('format', 2)" class="btn-secondary">
        {{ $t('json.format_2') }}
      </button>
      <button @click="$emit('format', 4)" class="btn-secondary">
        {{ $t('json.format_4') }}
      </button>
    </div>

    <!-- 压缩按钮 -->
    <button @click="$emit('minify')" class="btn-secondary">
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
  }>()

  const emit = defineEmits(['format', 'minify', 'clear'])

  const copied = ref(false)
  const hasContent = computed(() => props.content.length > 0)

  // 复制功能逻辑
  const copyResult = async () => {
    if (!props.content) return
    try {
      await navigator.clipboard.writeText(props.content)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }
</script>

<style scoped>
  /* 定义一个简单的按钮样式类，复用 CSS */
  .btn-secondary {
    @apply px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 hover:border-emerald-400 transition shadow-sm;
  }
</style>
