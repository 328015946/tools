<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('gradient.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('gradient.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 左侧：控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <!-- 类型与角度 -->
          <div>
            <label class="text-xs font-bold text-gray-500 uppercase mb-2 block">{{ $t('gradient.type') }}</label>
            <div class="flex gap-4 mb-4">
              <button
                @click="type = 'linear'"
                :class="
                  type === 'linear'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                "
                class="flex-1 py-2 rounded-lg border text-sm font-medium transition">
                Linear
              </button>
              <button
                @click="type = 'radial'"
                :class="
                  type === 'radial'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 border-gray-200'
                "
                class="flex-1 py-2 rounded-lg border text-sm font-medium transition">
                Radial
              </button>
            </div>

            <div v-if="type === 'linear'">
              <div class="flex justify-between mb-1">
                <span class="text-sm text-gray-600">{{ $t('gradient.angle') }}</span>
                <span class="text-xs font-mono bg-gray-100 px-1 rounded">{{ angle }}°</span>
              </div>
              <input
                type="range"
                v-model.number="angle"
                min="0"
                max="360"
                class="w-full h-2 bg-gray-200 rounded-lg accent-emerald-600" />
            </div>
          </div>

          <!-- 颜色断点列表 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-xs font-bold text-gray-500 uppercase">{{ $t('gradient.stops') }}</label>
              <button @click="addStop" class="text-xs text-emerald-600 hover:underline font-bold">
                + {{ $t('gradient.add_stop') }}
              </button>
            </div>

            <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              <div
                v-for="(stop, idx) in stops"
                :key="idx"
                class="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 group">
                <input
                  type="color"
                  v-model="stop.color"
                  class="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer bg-white" />
                <input
                  type="range"
                  v-model.number="stop.pos"
                  min="0"
                  max="100"
                  class="flex-grow h-1.5 bg-gray-300 rounded-lg accent-gray-600" />
                <span class="text-xs font-mono w-8 text-right">{{ stop.pos }}%</span>
                <button
                  @click="removeStop(idx)"
                  :disabled="stops.length <= 2"
                  class="text-gray-400 hover:text-red-500 disabled:opacity-30 px-1">
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与代码 -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- 预览画布 -->
        <div
          class="flex-grow min-h-[300px] rounded-2xl shadow-lg transition-all duration-200 border border-gray-100"
          :style="{ background: cssValue }"></div>

        <!-- 代码展示 -->
        <div class="bg-gray-900 rounded-xl p-5 relative group">
          <div class="text-gray-500 text-xs font-bold uppercase mb-2">CSS Code</div>
          <code class="block font-mono text-emerald-400 text-sm break-all"> background: {{ cssValue }}; </code>
          <button
            @click="copy"
            class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium transition border border-white/10">
            {{ copied ? '✅ Copied' : '📋 Copy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { copyToClipboard, copied } = useCopy()

  const type = ref('linear')
  const angle = ref(90)
  const stops = ref([
    { color: '#4ade80', pos: 0 }, // emerald-400
    { color: '#3b82f6', pos: 100 } // blue-500
  ])

  const cssValue = computed(() => {
    // 排序断点，防止位置错乱导致渲染错误
    const sortedStops = [...stops.value].sort((a, b) => a.pos - b.pos)
    const stopStr = sortedStops.map(s => `${s.color} ${s.pos}%`).join(', ')

    if (type.value === 'linear') {
      return `linear-gradient(${angle.value}deg, ${stopStr})`
    } else {
      return `radial-gradient(circle, ${stopStr})`
    }
  })

  const addStop = () => {
    // 在中间位置加一个随机色
    stops.value.push({ color: '#ffffff', pos: 50 })
  }

  const removeStop = (idx: number) => {
    if (stops.value.length > 2) {
      stops.value.splice(idx, 1)
    }
  }

  const copy = () => {
    copyToClipboard(`background: ${cssValue.value};`)
  }

  useHead({ title: t('gradient.title') + ' - NuxtTools' })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
</style>
