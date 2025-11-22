<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('sql.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('sql.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      <!-- 左侧：输入 -->
      <div class="flex flex-col h-full">
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-bold text-gray-700">{{ $t('sql.input_label') }}</label>
          <div class="flex gap-2">
            <select v-model="dialect" class="text-xs border-gray-300 rounded py-1 pl-2 pr-6">
              <option value="sql">Standard SQL</option>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="bigquery">BigQuery</option>
              <option value="transactsql">SQL Server (T-SQL)</option>
            </select>
            <button @click="input = ''" class="text-xs text-red-500 hover:underline">{{ $t('sql.clear') }}</button>
          </div>
        </div>
        <textarea
          v-model="input"
          class="flex-grow p-4 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none"
          placeholder="SELECT * FROM table..."></textarea>
      </div>

      <!-- 右侧：输出 -->
      <div class="flex flex-col h-full">
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-bold text-gray-700">{{ $t('sql.output_label') }}</label>
          <div class="flex gap-2">
            <button @click="minify" class="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">
              {{ $t('sql.minify') }}
            </button>
            <button
              @click="format"
              class="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 shadow-sm">
              ✨ {{ $t('sql.format') }}
            </button>
          </div>
        </div>
        <div class="flex-grow relative bg-gray-900 rounded-xl border border-gray-700 overflow-hidden group">
          <textarea
            :value="output"
            readonly
            class="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-sm resize-none focus:outline-none custom-scrollbar"></textarea>
          <button
            @click="copyToClipboard(output)"
            class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium backdrop-blur border border-white/10">
            {{ copied ? '✅' : '📋' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { format as fmt } from 'sql-formatter'

  const { t } = useI18n()
  const { copyToClipboard, copied } = useCopy()

  const input = ref('SELECT id, name, email FROM users WHERE status = 1 AND created_at > "2023-01-01" ORDER BY id DESC')
  const output = ref('')
  const dialect = ref('sql')

  const format = () => {
    try {
      output.value = fmt(input.value, {
        language: dialect.value as any, // sql-formatter 的类型定义可能有点滞后，强转一下
        keywordCase: 'upper',
        indent: '  '
      })
    } catch (e) {
      output.value = t('sql.error')
    }
  }

  const minify = () => {
    // 简单的压缩：去掉换行和多余空格
    output.value = input.value.replace(/\s+/g, ' ').trim()
  }

  // 监听输入变化自动格式化
  watch([input, dialect], format)
  onMounted(format)

  useHead({ title: t('sql.title') + ' - NuxtTools' })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
</style>
