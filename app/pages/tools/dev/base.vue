<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 11:40:55
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 11:47:47
 * @FilePath: \xiao-nuxt4\app\pages\tools\dev\base.vue
 * @Description: 注释
-->
<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('base.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('base.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 gap-6 bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
      <!-- 十进制 -->
      <div class="input-group">
        <label class="label">{{ $t('base.dec') }}</label>
        <div class="input-wrapper">
          <input type="text" v-model="vals.dec" @input="update('dec')" class="input" placeholder="1024" />
          <button @click="copyToClipboard(vals.dec)" class="copy-btn" title="Copy">📋</button>
        </div>
      </div>

      <!-- 二进制 -->
      <div class="input-group">
        <label class="label">{{ $t('base.bin') }}</label>
        <div class="input-wrapper">
          <input
            type="text"
            v-model="vals.bin"
            @input="update('bin')"
            class="input font-mono text-sm"
            placeholder="10000000000" />
          <button @click="copyToClipboard(vals.bin)" class="copy-btn" title="Copy">📋</button>
        </div>
      </div>

      <!-- 十六进制 -->
      <div class="input-group">
        <label class="label">{{ $t('base.hex') }}</label>
        <div class="input-wrapper relative">
          <input
            type="text"
            v-model="vals.hex"
            @input="update('hex')"
            class="input pl-10 uppercase font-mono"
            placeholder="400" />
          <button @click="copyToClipboard(vals.hex)" class="copy-btn" title="Copy">📋</button>
        </div>
      </div>

      <!-- 八进制 -->
      <div class="input-group">
        <label class="label">{{ $t('base.oct') }}</label>
        <div class="input-wrapper">
          <input type="text" v-model="vals.oct" @input="update('oct')" class="input font-mono" placeholder="2000" />
          <button @click="copyToClipboard(vals.oct)" class="copy-btn" title="Copy">📋</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const { copyToClipboard } = useCopy() // 复用你的 useCopy
  const vals = reactive({
    bin: '',
    oct: '',
    dec: '',
    hex: ''
  })

  // 核心转换逻辑
  // BigInt 支持大数转换，比 parseInt 强
  const update = (from: 'bin' | 'oct' | 'dec' | 'hex') => {
    let val = vals[from].trim()
    if (!val) {
      // 清空所有
      vals.bin = vals.oct = vals.dec = vals.hex = ''
      return
    }

    try {
      let num: bigint
      if (from === 'dec') num = BigInt(val)
      else if (from === 'hex') num = BigInt('0x' + val.replace(/^0x/, ''))
      else if (from === 'oct') num = BigInt('0o' + val)
      else if (from === 'bin') num = BigInt('0b' + val)
      else return

      // 更新其他三个
      if (from !== 'dec') vals.dec = num.toString(10)
      if (from !== 'hex') vals.hex = num.toString(16).toUpperCase()
      if (from !== 'oct') vals.oct = num.toString(8)
      if (from !== 'bin') vals.bin = num.toString(2)
    } catch (e) {
      // 输入非法时不更新其他框，或者显示错误状态
      // 这里为了体验流畅，不做额外处理
    }
  }

  useHead({ title: t('base.title') + ' - NuxtTools' })
</script>

<style scoped>
  .input-group {
    @apply flex flex-col sm:flex-row sm:items-center gap-2;
  }
  .label {
    @apply w-32 font-bold text-gray-700 text-sm flex-shrink-0;
  }
  .input-wrapper {
    @apply flex-grow flex items-center gap-2 relative;
  }
  .input {
    @apply w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition;
  }
  .copy-btn {
    @apply p-3 text-gray-400 hover:text-emerald-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-emerald-50 transition flex-shrink-0;
  }
</style>
