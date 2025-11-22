<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('filter.title') }}</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 flex flex-col">
        <label class="text-sm font-bold mb-2 flex justify-between">
          {{ $t('filter.input') }}
          <span class="text-xs text-gray-400">{{ $t('filter.lines_count', { n: inputLines }) }}</span>
        </label>
        <textarea
          v-model="input"
          class="flex-grow h-96 p-3 border rounded-xl resize-none font-mono text-sm"
          placeholder="Apple&#10;Banana&#10;Apple"></textarea>
      </div>

      <!-- 中间：操作面板 -->
      <div class="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-200 space-y-4 h-fit">
        <div class="space-y-2">
          <label class="flex items-center"
            ><input type="checkbox" v-model="opt.dedupe" class="mr-2 rounded text-emerald-600" />
            {{ $t('filter.dedupe') }}</label
          >
          <label class="flex items-center"
            ><input type="checkbox" v-model="opt.trim" class="mr-2 rounded text-emerald-600" />
            {{ $t('filter.trim') }}</label
          >
        </div>
        <hr />
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="opt.sort = 'asc'"
            :class="opt.sort === 'asc' ? 'bg-emerald-100 text-emerald-700' : ''"
            class="py-2 border rounded text-sm">
            {{ $t('filter.sort_asc') }}
          </button>
          <button
            @click="opt.sort = 'desc'"
            :class="opt.sort === 'desc' ? 'bg-emerald-100 text-emerald-700' : ''"
            class="py-2 border rounded text-sm">
            {{ $t('filter.sort_desc') }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input v-model="opt.prefix" :placeholder="$t('filter.prefix')" class="p-2 border rounded text-sm" />
          <input v-model="opt.suffix" :placeholder="$t('filter.suffix')" class="p-2 border rounded text-sm" />
        </div>

        <button
          @click="process"
          class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg">
          ⚡ {{ $t('filter.process') }}
        </button>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-1 flex flex-col">
        <label class="text-sm font-bold mb-2 flex justify-between">
          {{ $t('filter.output') }}
          <span class="text-xs text-gray-400">{{ $t('filter.lines_count', { n: outputLines }) }}</span>
        </label>
        <div class="relative flex-grow">
          <textarea
            :value="output"
            readonly
            class="w-full h-96 p-3 bg-gray-50 border rounded-xl resize-none font-mono text-sm"></textarea>
          <button @click="copyToClipboard(output)" class="absolute top-2 right-2 p-1 bg-white border rounded shadow-sm">
            📋
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { copyToClipboard } = useCopy()
  const input = ref('Apple\nBanana\nOrange\nApple\nGrape')
  const output = ref('')
  const opt = reactive({ dedupe: true, trim: true, sort: 'asc', prefix: '', suffix: '' })

  const inputLines = computed(() => (input.value ? input.value.split('\n').length : 0))
  const outputLines = computed(() => (output.value ? output.value.split('\n').length : 0))

  const process = () => {
    let lines = input.value.split('\n')

    if (opt.trim) lines = lines.map(l => l.trim()).filter(l => l) // 去空行
    if (opt.dedupe) lines = [...new Set(lines)]
    if (opt.sort === 'asc') lines.sort()
    if (opt.sort === 'desc') lines.sort().reverse()

    if (opt.prefix || opt.suffix) {
      lines = lines.map(l => `${opt.prefix}${l}${opt.suffix}`)
    }

    output.value = lines.join('\n')
  }
  onMounted(process)
</script>
