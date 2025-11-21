<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('img_base64.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('img_base64.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：上传区 -->
      <div class="lg:col-span-1 space-y-6">
        <div
          @click="triggerUpload"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition h-64 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100"
          :class="isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'">
          <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileSelect" />
          <div v-if="previewUrl" class="w-full h-full flex items-center justify-center relative group">
            <img :src="previewUrl" class="max-w-full max-h-full object-contain shadow-sm" />
            <div
              class="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg font-medium">
              Change Image
            </div>
          </div>
          <div v-else>
            <div class="text-4xl mb-2">🖼️</div>
            <div class="text-gray-600 font-medium">{{ $t('img_base64.drop_zone') }}</div>
          </div>
        </div>

        <!-- 格式选择 -->
        <div class="bg-white p-4 border border-gray-200 rounded-xl">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('img_base64.format') }}</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center">
              <input type="radio" v-model="format" value="raw" class="text-emerald-600 focus:ring-emerald-500" />
              <span class="ml-2 text-sm">Raw (data:image/png;base64,...)</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="format" value="css" class="text-emerald-600 focus:ring-emerald-500" />
              <span class="ml-2 text-sm">CSS (background-image: url(...))</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="format" value="html" class="text-emerald-600 focus:ring-emerald-500" />
              <span class="ml-2 text-sm">HTML (&lt;img src="..." /&gt;)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="lg:col-span-2 flex flex-col">
        <div class="flex-grow relative">
          <textarea
            :value="formattedResult"
            readonly
            class="w-full h-[500px] p-4 font-mono text-xs bg-gray-900 text-emerald-400 border border-gray-700 rounded-xl focus:outline-none resize-none"
            placeholder="..."></textarea>

          <button
            @click="copy"
            v-if="formattedResult"
            class="absolute top-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition">
            {{ copied ? '✅ Copied' : $t('img_base64.copy_result') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const isDragging = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const previewUrl = ref('')
  const base64Str = ref('')
  const format = ref('raw')
  const copied = ref(false)

  // 计算最终输出格式
  const formattedResult = computed(() => {
    if (!base64Str.value) return ''
    if (format.value === 'css') return `background-image: url('${base64Str.value}');`
    if (format.value === 'html') return `<img src="${base64Str.value}" alt="Base64 Image" />`
    return base64Str.value
  })

  const triggerUpload = () => fileInput.value?.click()

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return alert('Not an image')

    // 预览
    previewUrl.value = URL.createObjectURL(file)

    // 转 Base64
    const reader = new FileReader()
    reader.onload = e => {
      base64Str.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: DragEvent) => {
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }

  const copy = () => {
    navigator.clipboard.writeText(formattedResult.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  useHead({ title: t('img_base64.title') + ' - NuxtTools' })
</script>
