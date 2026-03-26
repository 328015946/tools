<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('url.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('url.desc') }}</p>
    </div>

    <!-- 操作栏 -->
    <div class="flex flex-wrap gap-2 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
      <button
        @click="handleEncode"
        class="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition font-medium">
        ⬇️ {{ $t('url.encode') }}
      </button>
      <button
        @click="handleDecode"
        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition shadow-sm">
        ⬆️ {{ $t('url.decode') }}
      </button>
      <div class="flex-grow"></div>
      <button @click="clear" class="text-gray-500 hover:text-red-500 px-3 py-2 text-sm">{{ $t('url.clear') }}</button>
    </div>

    <!-- 编辑器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
      <CodeEditor v-model="inputStr" :label="$t('url.input')" :placeholder="'https://example.com?q=hello world'" />
      <CodeEditor v-model="outputStr" :label="$t('url.output')" readonly placeholder="..." :error="errorMsg" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import CodeEditor from '~/components/tools/CodeEditor.vue' // 确保路径正确
  const { t } = useI18n()

  const inputStr = ref('')
  const outputStr = ref('')
  const errorMsg = ref<string | null>(null)

  const handleEncode = () => {
    errorMsg.value = null
    try {
      outputStr.value = encodeURIComponent(inputStr.value)
    } catch (e) {
      errorMsg.value = 'Error encoding'
    }
  }

  const handleDecode = () => {
    errorMsg.value = null
    try {
      outputStr.value = decodeURIComponent(inputStr.value)
    } catch (e) {
      errorMsg.value = 'Error decoding: Malformed URI'
    }
  }

  const clear = () => {
    inputStr.value = ''
    outputStr.value = ''
    errorMsg.value = null
  }

  useHead({ title: t('url.title') + ' - 小宾果' })
</script>
