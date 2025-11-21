<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- 标题区域 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('base64.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('base64.desc') }}</p>
    </div>

    <!-- 工具栏 -->
    <Base64Toolbar
      :content="outputStr"
      @encode="handleEncode"
      @decode="handleDecode"
      @exchange="handleExchange"
      @clear="handleClear" />

    <!-- 编辑区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
      <!-- 输入框 -->
      <CodeEditor
        v-model="inputStr"
        :label="$t('base64.input_label')"
        :error="errorMsg"
        placeholder="Type something here..." />

      <!-- 输出框 -->
      <CodeEditor v-model="outputStr" :label="$t('base64.output_label')" readonly placeholder="..." />
    </div>
  </div>
</template>

<script setup lang="ts">
  import CodeEditor from '~/components/tools/CodeEditor.vue'
  import Base64Toolbar from '~/components/tools/Base64Toolbar.vue'

  const { t } = useI18n()

  const inputStr = ref('')
  const outputStr = ref('')
  const errorMsg = ref<string | null>(null)

  // ✅ 解决中文乱码的关键辅助函数
  const utf8_to_b64 = (str: string) => {
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
        return String.fromCharCode(parseInt(p1, 16))
      })
    )
  }

  const b64_to_utf8 = (str: string) => {
    return decodeURIComponent(
      window
        .atob(str)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
  }

  // 编码
  const handleEncode = () => {
    errorMsg.value = null
    if (!inputStr.value) return

    try {
      outputStr.value = utf8_to_b64(inputStr.value)
    } catch (e) {
      errorMsg.value = 'Encoding failed. Please check input.'
    }
  }

  // 解码
  const handleDecode = () => {
    errorMsg.value = null
    if (!inputStr.value) return

    try {
      outputStr.value = b64_to_utf8(inputStr.value)
    } catch (e) {
      errorMsg.value = t('base64.error')
    }
  }

  // 交换：把输出结果放到输入框，方便进行逆向操作
  const handleExchange = () => {
    if (!outputStr.value) return
    inputStr.value = outputStr.value
    outputStr.value = ''
    errorMsg.value = null
  }

  const handleClear = () => {
    inputStr.value = ''
    outputStr.value = ''
    errorMsg.value = null
  }

  // SEO Meta
  useHead({
    title: t('base64.title') + ' - NuxtTools',
    meta: [{ name: 'description', content: t('base64.desc') }]
  })
</script>
