<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 14:13:40
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 14:13:55
 * @FilePath: \xiao-nuxt4\app\pages\tools\other\palette.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{{ $t('palette.title') }}</h1>
      </div>
      <button
        @click="generateRandom"
        class="bg-emerald-600 text-white px-6 py-2 rounded-full hover:bg-emerald-700 shadow-lg transition transform active:scale-95">
        🎲 {{ $t('palette.random') }}
      </button>
    </div>

    <div class="h-[400px] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
      <div
        v-for="(color, idx) in colors"
        :key="idx"
        class="flex-1 flex items-center justify-center group relative transition-all hover:flex-[1.5]"
        :style="{ backgroundColor: color }">
        <button
          @click="copy(color)"
          class="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition font-mono text-lg font-bold uppercase tracking-wider shadow-sm border border-white/30">
          {{ color }}
        </button>
      </div>
    </div>

    <div class="text-center mt-4 text-gray-400 text-sm">Press Spacebar to generate</div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { copyToClipboard } = useCopy()

  const colors = ref<string[]>([])

  const generateRandom = () => {
    const newColors = []
    for (let i = 0; i < 5; i++) {
      newColors.push(
        '#' +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, '0')
      )
    }
    colors.value = newColors
  }

  const copy = (color: string) => {
    copyToClipboard(color)
  }

  // 监听空格键
  onMounted(() => {
    generateRandom()
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault()
        generateRandom()
      }
    })
  })

  useHead({ title: t('palette.title') + ' - 小宾果' })
</script>
