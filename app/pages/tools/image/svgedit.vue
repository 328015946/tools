<template>
  <div class="max-w-[1400px] mx-auto py-6 px-4">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('svg_edit.title') }}</h1>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-160px)] min-h-[600px]">
      <!-- 左侧：代码编辑 -->
      <div class="flex flex-col gap-4">
        <div class="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex-grow flex flex-col relative">
          <div class="flex justify-between items-center px-2 py-2 border-b border-gray-100 mb-2">
            <span class="text-xs font-bold text-gray-500 uppercase">{{ $t('svg_edit.input_label') }}</span>
            <div class="flex gap-2">
              <button
                @click="formatSvg"
                class="text-xs bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 px-2 py-1 rounded transition">
                {{ $t('svg_edit.format_code') }}
              </button>
            </div>
          </div>

          <textarea
            v-model="svgCode"
            class="flex-grow w-full p-4 font-mono text-sm border-none focus:ring-0 resize-none leading-relaxed text-gray-700 bg-gray-50/50 rounded-lg custom-scrollbar"
            spellcheck="false"></textarea>
        </div>

        <!-- 操作按钮组 -->
        <div class="grid grid-cols-3 gap-4">
          <button
            @click="copyBase64"
            class="py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition font-medium text-sm flex justify-center items-center gap-2 shadow-sm">
            📄 {{ $t('svg_edit.copy_base64') }}
          </button>
          <button
            @click="download('svg')"
            class="py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition font-medium text-sm flex justify-center items-center gap-2 shadow-sm">
            ⬇️ {{ $t('svg_edit.download_svg') }}
          </button>
          <button
            @click="download('png')"
            class="py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20">
            🖼️ {{ $t('svg_edit.download_png') }}
          </button>
        </div>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="flex flex-col gap-4">
        <div
          class="bg-gray-50 border border-gray-200 rounded-xl flex-grow flex flex-col overflow-hidden shadow-inner relative">
          <!-- 背景控制栏 -->
          <div
            class="absolute top-4 right-4 z-10 flex bg-white/90 backdrop-blur border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              v-for="bg in backgrounds"
              :key="bg.class"
              @click="currentBg = bg.class"
              class="w-6 h-6 rounded mr-1 last:mr-0 border border-gray-200 focus:ring-2 ring-emerald-500 transition"
              :class="bg.class"
              :title="bg.name"></button>
          </div>

          <!-- 预览区域 -->
          <!--
            使用 v-html 直接渲染 SVG 字符串。
            注意：为了安全，生产环境最好用 DOMPurify 过滤一下，
            但作为开发者工具，为了保留 SVG 的所有特性（如 style, script, animate），
            直接渲染体验最好。
          -->
          <div class="flex-grow flex items-center justify-center p-8 overflow-auto" :class="currentBg">
            <!-- 这里的 div 用来限制最大尺寸，防止超大 SVG 撑爆布局 -->
            <div
              v-html="svgCode"
              class="svg-container max-w-full max-h-full shadow-none transition-transform duration-200"></div>
          </div>

          <div class="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-400 flex justify-between">
            <span>Rendered Size: {{ svgDimensions.width }} x {{ svgDimensions.height }}</span>
            <span>Size: {{ (svgCode.length / 1024).toFixed(2) }} KB</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { copyToClipboard } = useCopy()
  const { t } = useI18n()

  // 默认值：你的 Logo 代码
  const defaultSvg = `<svg width="200" height="200" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#0F172A" />
  <path d="M13 11 L20 18 L13 25" stroke="#10B981" stroke-width="3.2" stroke-linecap="round" />
  <path d="M27 11 L20 18 L27 25" stroke="white" stroke-width="3.2" stroke-linecap="round" />
  <text x="28" y="16" font-size="9.5" font-family="monospace" fill="#10B981">xi</text>
  <text x="6" y="36" font-size="9.5" font-family="monospace" fill="white">xiao</text>
</svg>`

  const svgCode = ref(defaultSvg)

  // 背景选项
  const backgrounds = [
    { name: 'Checkerboard', class: 'checkerboard' },
    { name: 'White', class: 'bg-white' },
    { name: 'Black', class: 'bg-gray-900' },
    { name: 'Gray', class: 'bg-gray-200' }
  ]
  const currentBg = ref('checkerboard')

  // 获取 SVG 尺寸（用于显示信息）
  const svgDimensions = computed(() => {
    // 简单的正则匹配 width/height，仅做参考
    const w = svgCode.value.match(/width="([^"]+)"/)
    const h = svgCode.value.match(/height="([^"]+)"/)
    return {
      width: w ? w[1] : 'auto',
      height: h ? h[1] : 'auto'
    }
  })

  // 简单格式化 XML
  const formatSvg = () => {
    // 这里做一个简单的正则换行和缩进，实际可以用 xml-formatter 库
    let formatted = ''
    let pad = 0
    const xml = svgCode.value.replace(/>\s*</g, '><') // 去除标签间空格

    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) pad -= 1
      else if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) pad += 1 // 简化判断

      let indent = ''
      for (let i = 0; i < pad; i++) indent += '  '

      formatted += indent + '<' + node + '>\n'
    })
    // 上面的正则太简陋，为了稳定性，我们暂且只做简单的去除多余空行，或者保持原样
    // 更好的方式是引入 prettier/standalone，但为了轻量，这里仅做去空格处理
    svgCode.value = svgCode.value.replace(/[\r\n]+\s*/g, '\n').trim()
  }

  // 复制 Base64 Data URI (用于 CSS background-image)
  // 修改 copyBase64 函数
  const copyBase64 = () => {
    const base64 = btoa(unescape(encodeURIComponent(svgCode.value)))
    const dataUri = `data:image/svg+xml;base64,${base64}`

    // ✅ 一行代码搞定复制 + 提示
    copyToClipboard(dataUri)
  }

  // 下载功能
  const download = (type: 'svg' | 'png') => {
    if (type === 'svg') {
      const blob = new Blob([svgCode.value], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'image.svg'
      link.click()
      URL.revokeObjectURL(url)
    } else {
      // PNG 下载需借助 Canvas
      const img = new Image()
      const base64 = btoa(unescape(encodeURIComponent(svgCode.value)))
      const dataUri = `data:image/svg+xml;base64,${base64}`

      img.onload = () => {
        const canvas = document.createElement('canvas')
        // 获取 SVG 的真实大小，如果没有定义宽高，默认 300x150
        canvas.width = img.width || 800
        canvas.height = img.height || 600

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const link = document.createElement('a')
          link.download = 'image.png'
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
      }
      img.src = dataUri
    }
  }

  useHead({ title: t('svg_edit.title') + ' - NuxtTools' })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 4px;
  }
  .checkerboard {
    background-image: linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  /* 确保预览区内的 SVG 保持比例，不被拉伸 */
  .svg-container :deep(svg) {
    max-width: 100%;
    max-height: 100%;
    height: auto;
    /* 如果 SVG 代码里写死了 width/height，这里可能需要 override */
  }
</style>
