<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 14:56:43
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:56:54
 * @FilePath: \xiao-nuxt4\app\components\tools\CodeEditor.vue
 * @Description: 注释
-->
<template>
  <div class="flex flex-col h-full">
    <!-- 顶部标签 -->
    <div class="flex justify-between items-center mb-2">
      <label class="text-sm font-bold text-gray-700 flex items-center gap-2">
        {{ label }}
        <span
          v-if="readonly"
          class="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 rounded border border-gray-200"
          >Read Only</span
        >
      </label>
      <!-- 插槽：允许父组件在右上角放额外的东西，比如字数统计 -->
      <slot name="header-action"></slot>
    </div>

    <!-- 编辑区域 -->
    <div class="relative flex-grow">
      <textarea
        :value="modelValue"
        @input="updateValue"
        :placeholder="placeholder"
        :readonly="readonly"
        class="w-full h-full p-4 font-mono text-sm bg-gray-50 border rounded-lg focus:ring-2 focus:outline-none resize-none transition-colors"
        :class="[
          error
            ? 'border-red-300 bg-red-50 focus:ring-red-200 text-red-900'
            : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 text-gray-800',
          readonly ? 'cursor-default bg-gray-100 text-gray-600' : ''
        ]"
        spellcheck="false"></textarea>

      <!-- 错误提示浮层 -->
      <div
        v-if="error"
        class="absolute bottom-0 left-0 right-0 bg-red-100 text-red-600 text-xs p-2 rounded-b-lg border-t border-red-200 truncate">
        ❌ {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    readonly?: boolean
    error?: string | null
  }>()

  const emit = defineEmits(['update:modelValue'])

  const updateValue = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    emit('update:modelValue', target.value)
  }
</script>
