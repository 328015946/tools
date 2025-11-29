<!-- components/ExportDialog.vue -->
<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps<{ visible: boolean }>()
  const emit = defineEmits(['close', 'confirm'])

  const format = ref('png')
  const quality = ref(0.9)
  const multiplier = ref(1) // 导出倍率

  const handleConfirm = () => {
    emit('confirm', {
      format: format.value,
      quality: quality.value,
      multiplier: multiplier.value
    })
    emit('close')
  }
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl w-96 p-6 animate-scale-in">
      <h3 class="text-lg font-bold text-gray-800 mb-4">导出设置</h3>

      <div class="space-y-4">
        <!-- 格式 -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">图片格式</label>
          <div class="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              v-for="f in ['png', 'jpeg', 'webp']"
              :key="f"
              @click="format = f"
              class="flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition"
              :class="format === f ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'">
              {{ f }}
            </button>
          </div>
        </div>

        <!-- 倍率 (清晰度) -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">分辨率倍率 ({{ multiplier }}x)</label>
          <div class="flex gap-2">
            <button
              v-for="m in [1, 2, 3, 4]"
              :key="m"
              @click="multiplier = m"
              class="flex-1 py-1.5 border rounded text-xs font-bold transition"
              :class="
                multiplier === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'
              ">
              {{ m }}x
            </button>
          </div>
          <p class="text-[10px] text-gray-400 mt-1">
            {{ multiplier === 1 ? '适用于屏幕显示 (72dpi)' : '适用于高清打印或大屏展示' }}
          </p>
        </div>

        <!-- 质量 (仅 JPEG/WebP) -->
        <div v-if="format !== 'png'" class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>压缩质量</span>
            <span>{{ Math.round(quality * 100) }}%</span>
          </div>
          <input
            type="range"
            v-model.number="quality"
            min="0.1"
            max="1"
            step="0.1"
            class="w-full h-1.5 bg-gray-200 rounded-lg accent-indigo-600 cursor-pointer" />
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button
          @click="$emit('close')"
          class="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          取消
        </button>
        <button
          @click="handleConfirm"
          class="flex-1 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 shadow-md">
          下载图片
        </button>
      </div>
    </div>
  </div>
</template>
