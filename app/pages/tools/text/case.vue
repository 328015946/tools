<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 15:08:46
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 15:08:55
 * @FilePath: \xiao-nuxt4\app\pages\tools\text\case.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('case.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('case.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-bold mb-2">{{ $t('case.input') }}</label>
        <textarea v-model="input" class="w-full h-64 p-3 border rounded-xl" placeholder="hello_world"></textarea>
      </div>

      <div class="space-y-3">
        <label class="block text-sm font-bold mb-2">{{ $t('case.output') }}</label>
        <!-- 按钮组 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mode in modes"
            :key="mode"
            @click="convert(mode)"
            class="py-2 px-3 bg-white border rounded hover:bg-emerald-50 hover:border-emerald-200 text-sm text-left transition flex justify-between items-center group">
            <span>{{ $t('case.' + mode) }}</span>
            <span class="text-emerald-500 opacity-0 group-hover:opacity-100">→</span>
          </button>
        </div>

        <!-- 结果展示 -->
        <div class="relative">
          <textarea
            :value="output"
            readonly
            class="w-full h-32 p-3 bg-gray-50 border rounded-xl text-emerald-600 font-mono"></textarea>
          <button
            @click="copyToClipboard(output)"
            class="absolute top-2 right-2 text-xs bg-white border px-2 py-1 rounded">
            Copy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as changeCase from 'change-case' // 引入库
  const { copyToClipboard } = useCopy()

  const input = ref('hello_world')
  const output = ref('')
  const modes = ['uppercase', 'lowercase', 'camel', 'pascal', 'snake', 'kebab', 'constant', 'sentence']

  const convert = (mode: string) => {
    if (!input.value) return
    // change-case 库的方法映射
    // 注意：change-case v5+ 的 API 变了，如果是旧版可能不同
    // 这里假设是用 v4 或 v5 的常见方法名
    // 简单的手动映射一下防止 API 变动
    switch (mode) {
      case 'uppercase':
        output.value = input.value.toUpperCase()
        break
      case 'lowercase':
        output.value = input.value.toLowerCase()
        break
      case 'camel':
        output.value = changeCase.camelCase(input.value)
        break
      case 'pascal':
        output.value = changeCase.pascalCase(input.value)
        break
      case 'snake':
        output.value = changeCase.snakeCase(input.value)
        break
      case 'kebab':
        output.value = changeCase.kebabCase(input.value)
        break
      case 'constant':
        output.value = changeCase.constantCase(input.value)
        break
      case 'sentence':
        output.value = changeCase.sentenceCase(input.value)
        break
    }
  }
  // 初始化执行一次
  onMounted(() => convert('camel'))
</script>
