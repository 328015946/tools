<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('qrcode.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('qrcode.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- 左侧：输入配置 -->
      <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('qrcode.input_label') }}</label>
          <textarea
            v-model="text"
            :placeholder="$t('qrcode.placeholder')"
            class="w-full h-32 p-3 border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border resize-none"></textarea>
        </div>

        <!-- 参数网格 -->
        <div class="grid grid-cols-2 gap-4">
          <!-- 颜色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('qrcode.color') }}</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                v-model="color"
                class="w-10 h-10 p-1 rounded border border-gray-300 cursor-pointer flex-shrink-0" />
              <span class="text-xs text-gray-500 font-mono uppercase">{{ color }}</span>
            </div>
          </div>

          <!-- 尺寸 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('qrcode.size') }}</label>
            <select
              v-model="width"
              class="w-full h-10 border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 border text-sm">
              <option :value="200">Small (200px)</option>
              <option :value="500">Medium (500px)</option>
              <option :value="1000">Large (1000px)</option>
            </select>
          </div>

          <!-- ✅ 新增：边距 (占据两列宽或者单独一行) -->
          <div class="col-span-2">
            <div class="flex justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">{{ $t('qrcode.margin') }}</label>
              <span class="text-xs font-mono text-gray-500">{{ margin }} blocks</span>
            </div>
            <input
              type="range"
              v-model.number="margin"
              min="0"
              max="10"
              step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
            <div class="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (无边距)</span>
              <span>10 (宽边距)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览结果 -->
      <div
        class="bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div v-if="text" class="bg-white p-4 rounded-lg shadow-lg mb-6">
          <img v-if="qrDataUrl" :src="qrDataUrl" class="max-w-full h-auto" :style="{ width: '250px' }" alt="QR Code" />
        </div>
        <div v-else class="text-gray-400 text-center">
          <div class="text-4xl mb-2">📱</div>
          {{ $t('qrcode.input_label') }}
        </div>

        <a
          v-if="qrDataUrl"
          :href="qrDataUrl"
          download="qrcode.png"
          class="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30">
          {{ $t('qrcode.download') }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import QRCode from 'qrcode'

  const { t } = useI18n()

  const text = ref('https://nuxt.com')
  const color = ref('#000000')
  const width = ref(500)
  const margin = ref(1) // ✅ 新增 margin 状态，默认为 1 (qrcode 标准默认其实是 4，但现在的 UI 通常喜欢窄一点)
  const qrDataUrl = ref('')

  // 监听变化自动生成
  // ✅ 把 margin 加到 watch 列表里
  watch(
    [text, color, width, margin],
    async () => {
      if (!text.value) {
        qrDataUrl.value = ''
        return
      }
      try {
        qrDataUrl.value = await QRCode.toDataURL(text.value, {
          width: width.value,
          margin: margin.value, // ✅ 使用动态 margin
          color: {
            dark: color.value,
            light: '#ffffff'
          }
        })
      } catch (err) {
        console.error(err)
      }
    },
    { immediate: true }
  )

  useHead({ title: t('qrcode.title') + ' - 小宾果' })
</script>
