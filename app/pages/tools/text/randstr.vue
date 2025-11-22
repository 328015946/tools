<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 15:09:24
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 15:09:35
 * @FilePath: \xiao-nuxt4\app\pages\tools\text\randstr.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-3xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('randstr.title') }}</h1>
    </div>

    <div class="bg-white p-6 rounded-xl border shadow-sm mb-6">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-bold mb-1">{{ $t('randstr.count') }}</label>
          <input v-model.number="count" type="number" class="w-full p-2 border rounded" />
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">{{ $t('randstr.length') }}</label>
          <input v-model.number="length" type="number" class="w-full p-2 border rounded" />
        </div>
      </div>
      <div class="flex gap-4 mb-6">
        <label class="flex items-center"
          ><input type="radio" v-model="type" value="num" class="mr-2" /> {{ $t('randstr.type_num') }}</label
        >
        <label class="flex items-center"
          ><input type="radio" v-model="type" value="alpha" class="mr-2" /> {{ $t('randstr.type_alpha') }}</label
        >
        <label class="flex items-center"
          ><input type="radio" v-model="type" value="mix" class="mr-2" /> {{ $t('randstr.type_mix') }}</label
        >
      </div>
      <button @click="generate" class="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold">
        {{ $t('randstr.generate') }}
      </button>
    </div>

    <div class="relative">
      <textarea
        :value="result"
        readonly
        class="w-full h-64 p-4 bg-gray-900 text-emerald-400 font-mono rounded-xl"></textarea>
      <button
        @click="copyToClipboard(result)"
        class="absolute top-4 right-4 text-white bg-white/20 px-3 py-1 rounded backdrop-blur">
        Copy
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { copyToClipboard } = useCopy()
  const count = ref(10)
  const length = ref(12)
  const type = ref('mix')
  const result = ref('')

  const generate = () => {
    const chars = {
      num: '0123456789',
      alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      mix: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
    const pool = chars[type.value]
    const arr = []
    for (let i = 0; i < count.value; i++) {
      let s = ''
      for (let j = 0; j < length.value; j++) s += pool.charAt(Math.floor(Math.random() * pool.length))
      arr.push(s)
    }
    result.value = arr.join('\n')
  }
  onMounted(generate)
</script>
