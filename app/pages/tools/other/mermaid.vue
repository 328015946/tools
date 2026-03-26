<template>
  <div class="max-w-[1600px] mx-auto py-6 px-4">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('mermaid.title') }}</h1>
      </div>

      <!-- 模版切换 -->
      <div class="flex gap-2">
        <span class="text-sm text-gray-500 self-center mr-1 hidden sm:inline">{{ $t('mermaid.examples') }}:</span>
        <button
          v-for="(tpl, key) in templates"
          :key="key"
          @click="loadTemplate(key)"
          class="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded hover:bg-emerald-50 hover:border-emerald-200 transition capitalize">
          {{ $t('mermaid.' + key) }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] min-h-[600px]">
      <!-- 左侧：编辑器 -->
      <div class="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div
          class="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
          <span>{{ $t('mermaid.input_label') }}</span>
        </div>
        <textarea
          v-model="inputCode"
          class="flex-grow w-full p-4 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
          spellcheck="false"></textarea>
      </div>

      <!-- 右侧：预览 -->
      <div class="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
        <div
          class="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
          <span>{{ $t('mermaid.preview') }}</span>
          <div class="flex gap-2">
            <button @click="download('svg')" class="hover:text-emerald-600">SVG</button>
            <button @click="download('png')" class="hover:text-emerald-600">PNG</button>
          </div>
        </div>

        <div class="flex-grow overflow-auto p-8 flex items-center justify-center bg-white" ref="containerRef">
          <!-- 渲染容器 -->
          <div id="mermaid-export-container" v-html="svgOutput" class="max-w-full bg-white"></div>

          <!-- 错误提示 -->
          <div
            v-if="errorMsg"
            class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-red-500 text-sm p-8 text-center backdrop-blur-sm z-10">
            <div class="font-bold text-lg mb-2">⚠️ {{ $t('mermaid.error') }}</div>
            <pre class="bg-red-50 p-4 rounded text-left max-w-md overflow-auto border border-red-100">{{
              errorMsg
            }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import mermaid from 'mermaid'

  import { toPng } from 'html-to-image'
  const { t } = useI18n()

  const containerRef = ref<HTMLElement | null>(null)
  const inputCode = ref('')
  const svgOutput = ref('')
  const errorMsg = ref('')

  // 预设模版
  const templates: Record<string, string> = {
    flowchart: `graph TD
    A[Start] --> B{Is it?};
    B -- Yes --> C[OK];
    C --> D[Rethink];
    D --> B;
    B -- No ----> E[End];`,
    sequence: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!`,
    gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    anther task      : 24d`,
    pie: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`
  }

  const loadTemplate = (key: string) => {
    inputCode.value = templates[key]
  }

  // 核心渲染逻辑
  const render = async () => {
    if (!inputCode.value.trim()) return

    try {
      // 1. 验证语法
      await mermaid.parse(inputCode.value)
      errorMsg.value = ''

      // 2. 渲染 SVG
      // mermaid.render 返回 { svg: string }
      const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), inputCode.value)
      svgOutput.value = svg
    } catch (e: any) {
      // mermaid.parse 会抛错
      errorMsg.value = e.message
    }
  }

  // 初始化 Mermaid 配置
  onMounted(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose' // 允许 HTML 标签
    })

    // 加载默认模版
    loadTemplate('flowchart')

    // 初始渲染
    render()
  })

  // 监听输入 (防抖处理更好，这里直接 watch)
  let timer: NodeJS.Timeout
  watch(inputCode, () => {
    clearTimeout(timer)
    timer = setTimeout(render, 500) // 500ms 防抖，避免频繁报错
  })

  // 下载功能
  // 修改下载函数
  const download = async (type: 'svg' | 'png') => {
    if (!svgOutput.value) return

    // SVG 下载保持不变 (这是纯文本操作，最安全)
    if (type === 'svg') {
      const blob = new Blob([svgOutput.value], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'diagram.svg'
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    // PNG 下载：改用 html-to-image
    if (type === 'png') {
      const node = document.getElementById('mermaid-export-container')
      if (!node) return

      try {
        // 1. 临时给容器加个白色背景，防止透明
        // mermaid 默认背景可能是透明的
        const dataUrl = await toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2 })

        const link = document.createElement('a')
        link.download = 'diagram.png'
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error('PNG export failed:', error)
        alert('PNG 导出失败，请尝试下载 SVG')
      }
    }
  }

  useHead({ title: t('mermaid.title') + ' - 小宾果' })
</script>
