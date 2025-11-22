<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 14:14:22
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 14:22:56
 * @FilePath: \xiao-nuxt4\app\pages\tools\other\placeholder.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('placeholder.title') }}</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-4">
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-bold mb-1">{{ $t('placeholder.width') }}</label>
            <input v-model="width" type="number" class="w-full p-2 border rounded" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-bold mb-1">{{ $t('placeholder.height') }}</label>
            <input v-model="height" type="number" class="w-full p-2 border rounded" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">{{ $t('placeholder.bg_color') }} (Hex without #)</label>
          <input v-model="bgColor" type="text" class="w-full p-2 border rounded" placeholder="cccccc" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">{{ $t('placeholder.text_color') }}</label>
          <input v-model="textColor" type="text" class="w-full p-2 border rounded" placeholder="969696" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">{{ $t('placeholder.text') }}</label>
          <input v-model="text" type="text" class="w-full p-2 border rounded" placeholder="Hello" />
        </div>
      </div>

      <div class="flex flex-col items-center justify-center bg-gray-50 border rounded-xl p-4 min-h-[300px]">
        <img :src="url" class="max-w-full shadow-md mb-4" />

        <div class="w-full bg-white p-2 rounded border text-xs font-mono text-gray-600 break-all mb-2">
          {{ url }}
        </div>
        <button
          @click="copyToClipboard(url)"
          class="w-full py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700">
          {{ copied ? '✅ Copied' : $t('placeholder.copy_url') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { copyToClipboard, copied } = useCopy()

  const width = ref(600)
  const height = ref(400)
  const bgColor = ref('cccccc')
  const textColor = ref('969696')
  const text = ref('')

  const url = computed(() => {
    // 旧的 (不稳定): https://via.placeholder.com/...
    // 新的 (稳定): https://placehold.co/...

    // placehold.co 的格式是: /<width>x<height>/<bgcolor>/<textcolor>?text=...
    let u = `https://placehold.co/${width.value}x${height.value}/${bgColor.value}/${textColor.value}`

    if (text.value) {
      u += `?text=${encodeURIComponent(text.value)}`
    }

    return u
  })

  useHead({ title: t('placeholder.title') + ' - NuxtTools' })
</script>
