<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('json.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('json.desc') }}</p>
    </div>

    <!-- 工具栏组件 -->
    <JsonToolbar :content="outputJson" @format="handleFormat" @minify="handleMinify" @clear="handleClear" />

    <!-- 主体编辑器区域：响应式布局 (大屏左右分栏，小屏上下排列) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      <!-- 左侧：输入 -->
      <CodeEditor
        v-model="inputJson"
        :label="$t('json.input_label')"
        :placeholder="$t('json.placeholder')"
        :error="errorMsg">
        <template #header-action>
          <span class="text-xs text-gray-400 font-mono">{{ inputSize }}</span>
        </template>
      </CodeEditor>

      <!-- 右侧：输出 -->
      <CodeEditor v-model="outputJson" :label="$t('json.output_label')" readonly placeholder="...">
        <template #header-action>
          <span class="text-xs text-gray-400 font-mono">{{ outputSize }}</span>
        </template>
      </CodeEditor>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 自动导入组件
  import CodeEditor from '~/components/tools/CodeEditor.vue'
  import JsonToolbar from '~/components/tools/JsonToolbar.vue'

  const { t } = useI18n()

  // 状态
  const inputJson = ref('')
  const outputJson = ref('')
  const errorMsg = ref<string | null>(null)

  // 辅助函数：计算大小
  const getSize = (str: string) => {
    if (!str) return '0 B'
    const len = new Blob([str]).size
    return len > 1024 ? (len / 1024).toFixed(2) + ' KB' : len + ' B'
  }

  const inputSize = computed(() => getSize(inputJson.value))
  const outputSize = computed(() => getSize(outputJson.value))

  // 核心逻辑：解析 JSON
  const parseJson = (): any | null => {
    errorMsg.value = null
    if (!inputJson.value.trim()) return null

    try {
      // 处理一些非标准 JSON (比如带单引号的 key)，这里只做基础的标准 JSON 解析
      // 如果需要更强的功能，可以引入 json5 库
      return JSON.parse(inputJson.value)
    } catch (e: any) {
      errorMsg.value = t('json.invalid') + e.message
      return null
    }
  }

  // 功能：格式化
  const handleFormat = (spaces: number) => {
    const obj = parseJson()
    if (obj) {
      outputJson.value = JSON.stringify(obj, null, spaces)
    }
  }

  // 功能：压缩
  const handleMinify = () => {
    const obj = parseJson()
    if (obj) {
      outputJson.value = JSON.stringify(obj)
    }
  }

  // 功能：清空
  const handleClear = () => {
    inputJson.value = ''
    outputJson.value = ''
    errorMsg.value = null
  }

  // 设置 SEO Meta
  useHead({
    title: t('json.title') + ' - NuxtTools',
    meta: [{ name: 'description', content: t('json.desc') }]
  })
</script>
