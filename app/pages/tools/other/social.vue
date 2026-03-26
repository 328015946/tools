<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 14:13:25
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 14:13:34
 * @FilePath: \xiao-nuxt4\app\pages\tools\other\social.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('social.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('social.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：配置 -->
      <div class="lg:col-span-1 space-y-4">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('social.title_label') }}</label>
            <input v-model="form.title" type="text" class="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('social.desc_label') }}</label>
            <textarea v-model="form.desc" class="w-full p-2 border rounded-lg h-24 resize-none"></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">{{ $t('social.image_label') }}</label>
            <div
              @click="triggerUpload"
              class="h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 bg-cover bg-center"
              :style="form.image ? `background-image: url(${form.image})` : ''">
              <span v-if="!form.image" class="text-gray-400 text-sm">{{ $t('social.upload') }}</span>
            </div>
            <input type="file" ref="fileInput" class="hidden" @change="handleFile" />
          </div>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Twitter Card -->
        <div class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-w-md mx-auto lg:mx-0">
          <div class="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-bold border-b uppercase">
            Twitter Summary Card
          </div>
          <div
            class="h-48 bg-gray-200 bg-cover bg-center"
            :style="`background-image: url(${form.image || 'https://via.placeholder.com/600x300'})`"></div>
          <div class="p-4 bg-white">
            <div class="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{{ form.title || 'Page Title' }}</div>
            <div class="text-xs text-gray-500 line-clamp-2">{{ form.desc || 'Page description goes here...' }}</div>
            <div class="text-xs text-gray-400 mt-2">example.com</div>
          </div>
        </div>

        <!-- Facebook / WeChat -->
        <div class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-w-md mx-auto lg:mx-0">
          <div class="bg-gray-50 px-4 py-2 text-xs text-gray-500 font-bold border-b uppercase">Facebook / WeChat</div>
          <div
            class="h-64 bg-gray-200 bg-cover bg-center"
            :style="`background-image: url(${form.image || 'https://via.placeholder.com/600x300'})`"></div>
          <div class="p-4 bg-gray-100">
            <div class="text-xs text-gray-500 uppercase mb-1">EXAMPLE.COM</div>
            <div class="font-bold text-gray-900 mb-1 text-lg line-clamp-2 leading-tight">
              {{ form.title || 'Page Title' }}
            </div>
            <div class="text-sm text-gray-600 line-clamp-1">{{ form.desc || 'Page description goes here...' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const form = reactive({
    title: 'My Awesome Page',
    desc: 'This is a description for social media preview.',
    image: ''
  })
  const fileInput = ref<HTMLInputElement | null>(null)

  const triggerUpload = () => fileInput.value?.click()
  const handleFile = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) form.image = URL.createObjectURL(file)
  }

  useHead({ title: t('social.title') + ' - 小宾果' })
</script>
