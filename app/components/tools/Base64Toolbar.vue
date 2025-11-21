<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 15:13:53
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 15:14:09
 * @FilePath: \xiao-nuxt4\app\components\tools\Base64Toolbar.vue
 * @Description: 注释
-->
<template>
  <div class="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
    <!-- 核心操作 -->
    <div class="flex items-center space-x-2 border-r border-gray-200 pr-4 mr-2">
      <button @click="$emit('encode')" class="btn-primary">⬇️ {{ $t('base64.encode') }}</button>
      <button @click="$emit('decode')" class="btn-secondary">⬆️ {{ $t('base64.decode') }}</button>
    </div>

    <!-- 交换按钮 -->
    <button @click="$emit('exchange')" class="btn-secondary group" title="Swap Input/Output">
      <span class="group-hover:rotate-180 transition-transform inline-block">⇅</span> {{ $t('base64.exchange') }}
    </button>

    <div class="flex-grow"></div>

    <!-- 通用操作 -->
    <button @click="$emit('clear')" class="text-gray-500 hover:text-red-500 px-3 py-2 text-sm transition">
      {{ $t('base64.clear') }}
    </button>

    <button
      @click="copyResult"
      :disabled="!hasContent"
      class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
      <span v-if="copied" class="text-emerald-600">✅ {{ $t('base64.copied') }}</span>
      <span v-else>📋 {{ $t('base64.copy') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{
    content: string
  }>()

  const emit = defineEmits(['encode', 'decode', 'exchange', 'clear'])

  const copied = ref(false)
  const hasContent = computed(() => props.content.length > 0)

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
  .btn-primary {
    @apply px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition shadow-sm font-medium;
  }
  .btn-secondary {
    @apply px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 hover:border-emerald-400 transition shadow-sm;
  }
</style>
