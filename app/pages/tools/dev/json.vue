<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- 标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('json.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('json.desc') }}</p>
    </div>

    <!-- 工具栏：绑定 viewMode -->
    <JsonToolbar
      :content="outputJson"
      v-model:mode="viewMode"
      @format="handleFormat"
      @minify="handleMinify"
      @clear="handleClear" />

    <!-- 主体区域 -->
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

      <!-- 右侧：输出 (根据模式切换) -->
      <div class="h-full flex flex-col">
        <!-- 这里为了复用 CodeEditor 的头部样式，我们手动写一个容器 -->
        <div class="flex justify-between items-center mb-2 h-6">
          <label class="text-sm font-bold text-gray-700 flex items-center gap-2">
            {{ $t('json.output_label') }}
            <span
              v-if="viewMode === 'tree'"
              class="text-xs font-normal text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100"
              >Tree View</span
            >
          </label>
          <span class="text-xs text-gray-400 font-mono">{{ outputSize }}</span>
        </div>

        <!-- 1. 代码模式 (CodeEditor) -->
        <div v-if="viewMode === 'code'" class="flex-grow relative h-full">
          <CodeEditor v-model="outputJson" readonly placeholder="..." class="h-full" />
        </div>

        <!-- 2. 树形模式 (VueJsonPretty) -->
        <div v-else class="flex-grow relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-inner">
          <!-- 只有在 JSON 合法时才显示树 -->
          <ClientOnly>
            <div v-if="jsonObject" class="h-full overflow-auto p-4 custom-scrollbar">
              <VueJsonPretty
                :data="jsonObject"
                :deep="2"
                :show-length="true"
                :show-line="false"
                :show-double-quotes="true"
                :show-icon="true"
                :select-on-click-node="true"
                class="custom-json-tree" />
            </div>
            <!-- 如果 JSON 不合法或为空 -->
            <div v-else class="h-full flex items-center justify-center text-gray-400 text-sm">
              {{ errorMsg ? 'Invalid JSON' : 'Waiting for input...' }}
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import CodeEditor from '~/components/tools/CodeEditor.vue'
  import JsonToolbar from '~/components/tools/JsonToolbar.vue'
  // 引入 JSON Viewer
  import VueJsonPretty from 'vue-json-pretty'
  import 'vue-json-pretty/lib/styles.css'

  const { t } = useI18n()

  // 状态
  const inputJson = ref('')
  const outputJson = ref('')
  const errorMsg = ref<string | null>(null)
  const viewMode = ref<'code' | 'tree'>('code') // 新增视图状态

  // 辅助函数：计算大小
  const getSize = (str: string) => {
    if (!str) return '0 B'
    const len = new Blob([str]).size
    return len > 1024 ? (len / 1024).toFixed(2) + ' KB' : len + ' B'
  }

  const inputSize = computed(() => getSize(inputJson.value))
  const outputSize = computed(() => getSize(outputJson.value))

  // 核心逻辑：解析 JSON (返回 Object 用于 Tree View)
  const jsonObject = computed(() => {
    if (!outputJson.value) return null
    try {
      return JSON.parse(outputJson.value)
    } catch (e) {
      return null
    }
  })

  const parseJson = (): any | null => {
    errorMsg.value = null
    if (!inputJson.value.trim()) return null

    try {
      return JSON.parse(inputJson.value)
    } catch (e: any) {
      errorMsg.value = t('json.invalid') + e.message
      return null
    }
  }

  // 监听输入，自动更新输出 (如果想输入时自动格式化，可以打开这个监听)
  // 但通常为了性能，还是点击按钮或者输入停止后才更新
  watch(inputJson, () => {
    const obj = parseJson()
    if (obj) {
      // 默认保持原来的格式化状态，或者默认 2 空格
      outputJson.value = JSON.stringify(obj, null, 2)
    } else {
      // 如果出错，不更新 output，或者清空，视需求而定
      // outputJson.value = ''
    }
  })

  // 功能：格式化
  const handleFormat = (spaces: number) => {
    const obj = parseJson()
    if (obj) {
      outputJson.value = JSON.stringify(obj, null, spaces)
      // 格式化时自动切回 Code 模式看效果，或者保持原样，这里保持原样
    }
  }

  const handleMinify = () => {
    const obj = parseJson()
    if (obj) {
      outputJson.value = JSON.stringify(obj)
    }
  }

  const handleClear = () => {
    inputJson.value = ''
    outputJson.value = ''
    errorMsg.value = null
  }

  useHead({
    title: t('json.title') + ' - NuxtTools',
    meta: [{ name: 'description', content: t('json.desc') }]
  })
</script>

<style scoped>
  /* 覆盖 VueJsonPretty 的默认颜色以匹配主题 */
  :deep(.vjs-key) {
    color: #059669 !important; /* emerald-600 */
  }
  :deep(.vjs-value-string) {
    color: #d97706 !important; /* amber-600 */
  }
  :deep(.vjs-tree) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.875rem;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  /* ... 之前的 CSS ... */

  /* 自定义箭头样式 */
  :deep(.vjs-tree .vjs-caret) {
    /* 调整箭头位置和大小 */
    width: 10px !important;
    height: 10px !important;
    margin-right: 4px;
    color: #64748b; /* slate-500 */
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  /* 默认状态（折叠）：向右的三角形 */
  :deep(.vjs-tree .vjs-caret svg) {
    /* 隐藏原本的 path，或者如果它用的是 border 方式 */
    /* vue-json-pretty 新版通常用 svg */
    fill: currentColor;
  }

  /* 展开状态：旋转 90 度向下 */
  :deep(.vjs-tree .vjs-caret.is-open) {
    transform: rotate(90deg);
    color: #059669; /* 展开时变绿 */
  }

  /* 鼠标悬停时 */
  :deep(.vjs-tree .vjs-caret:hover) {
    color: #059669;
  }

  /* 优化整体行高 */
  :deep(.vjs-tree-node) {
    padding: 2px 0;
  }
  :deep(.vjs-tree-node:hover) {
    background-color: #ecfdf5; /* hover 时背景变浅绿 emerald-50 */
    border-radius: 4px;
  }
</style>
