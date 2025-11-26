<script setup lang="ts">
  import { ref, computed } from 'vue'

  const { t } = useI18n()
  // 假设 useCopy 封装了 toast，用于显示重置/复制成功的提示
  const { copyToClipboard } = useCopy()

  // --- SEO ---
  useHead({
    title: t('calc.bmi_title'),
    meta: [{ name: 'description', content: t('calc.bmi_desc') }]
  })

  // --- 状态 ---
  // 转换比例常量
  const KG_PER_LB = 0.453592
  const CM_PER_IN = 2.54

  // 增加单位状态 (metric: 公制, imperial: 英制)
  const unitSystem = ref<'metric' | 'imperial'>('metric')

  // 公制默认值
  const defaultHeight = 175 // cm
  const defaultWeight = 70 // kg

  // 英制默认值 (大约 5'9" 和 154 lbs)
  const defaultHeightImperial = 69 // inches
  const defaultWeightImperial = 154 // lbs

  // 用户输入值
  const height = ref<number | null>(defaultHeight)
  const weight = ref<number | null>(defaultWeight)

  // --- 方法 ---

  const resetInputs = () => {
    if (unitSystem.value === 'metric') {
      height.value = defaultHeight
      weight.value = defaultWeight
    } else {
      height.value = defaultHeightImperial
      weight.value = defaultWeightImperial
    }
    copyToClipboard(t('calc.reset_success'), false)
  }

  /**
   * 计算 BMI: BMI = 体重 (kg) / [身高 (m) * 身高 (m)]
   */
  const bmiValue = computed<number | null>(() => {
    if (!height.value || !weight.value || height.value <= 0 || weight.value <= 0) {
      return null
    }

    let currentHeight = height.value
    let currentWeight = weight.value

    // 根据单位系统进行转换，最终统一使用公制单位进行计算
    if (unitSystem.value === 'imperial') {
      // 转换身高：英寸 -> 厘米
      currentHeight = height.value * CM_PER_IN
      // 转换体重：磅 -> 公斤
      currentWeight = weight.value * KG_PER_LB
    }

    // 公制计算
    const heightInMeters = currentHeight / 100
    // 四舍五入到小数点后一位
    return parseFloat((currentWeight / (heightInMeters * heightInMeters)).toFixed(1))
  })

  // 评估 BMI 结果
  const bmiStatus = computed<{ labelKey: string; color: string; range: string } | null>(() => {
    if (bmiValue.value === null) return null

    const bmi = bmiValue.value

    if (bmi < 18.5) return { labelKey: 'calc.underweight', color: 'text-blue-600', range: '< 18.5' }
    if (bmi >= 18.5 && bmi < 25) return { labelKey: 'calc.normal', color: 'text-green-600', range: '18.5 - 24.9' }
    if (bmi >= 25 && bmi < 30) return { labelKey: 'calc.overweight', color: 'text-yellow-600', range: '25.0 - 29.9' }
    if (bmi >= 30 && bmi < 35) return { labelKey: 'calc.obese_1', color: 'text-orange-600', range: '30.0 - 34.9' }
    if (bmi >= 35 && bmi < 40) return { labelKey: 'calc.obese_2', color: 'text-red-600', range: '35.0 - 39.9' }

    return { labelKey: 'calc.obese_3', color: 'text-purple-600', range: '> 40.0' }
  })

  const handleCopyResult = () => {
    if (bmiValue.value && bmiStatus.value) {
      // 复制格式化结果
      const copyText = `${t('calc.bmi_val')}: ${bmiValue.value}, ${t('calc.status')}: ${t(bmiStatus.value.labelKey)} (${
        bmiStatus.value.range
      })`
      copyToClipboard(copyText)
    }
  }
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- 头部信息 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('calc.bmi_title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('calc.bmi_desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 1. 输入控制区 (左侧) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-md p-6 space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">{{ $t('calc.input') }}</h2>

            <!-- 重置按钮 -->
            <button
              class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center gap-1"
              @click="resetInputs">
              <span class="text-base leading-none">🔄</span>
              {{ $t('tool.reset') }}
            </button>
          </div>

          <!-- 单位切换 -->
          <div class="border-b border-gray-200 pb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('calc.unit_system') }}</label>
            <div class="inline-flex rounded-md shadow-sm">
              <button
                @click="unitSystem = 'metric'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-l-lg border transition',
                  unitSystem === 'metric'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]">
                {{ $t('calc.metric') }}
              </button>
              <button
                @click="unitSystem = 'imperial'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-r-lg border transition',
                  unitSystem === 'imperial'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                ]">
                {{ $t('calc.imperial') }}
              </button>
            </div>
          </div>

          <!-- 输入网格 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <!-- 身高输入 -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700">{{ $t('calc.height') }}</label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  v-model.number="height"
                  :min="1"
                  class="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  :placeholder="unitSystem === 'metric' ? '175' : '69'" />
                <span
                  class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 text-sm">
                  {{ unitSystem === 'metric' ? 'cm' : 'in' }}
                </span>
              </div>
            </div>

            <!-- 体重输入 -->
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700">{{ $t('calc.weight') }}</label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  v-model.number="weight"
                  :min="1"
                  class="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  :placeholder="unitSystem === 'metric' ? '70' : '154'" />
                <span
                  class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 text-sm">
                  {{ unitSystem === 'metric' ? 'kg' : 'lb' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 结果展示区 (右侧) -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white border border-gray-200 rounded-xl shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4 flex justify-between items-center">
            {{ $t('calc.result') }}
            <button
              @click="handleCopyResult"
              v-if="bmiValue !== null"
              class="px-2 py-1 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition flex items-center gap-1">
              <span class="text-xs">📋</span> {{ $t('tool.copy') }}
            </button>
          </h2>

          <div v-if="bmiValue !== null">
            <!-- BMI 值 -->
            <div class="mb-4 p-4 bg-gray-50 rounded-lg">
              <div class="text-gray-500 text-sm">{{ $t('calc.bmi_val') }}:</div>
              <div class="text-5xl font-extrabold mt-1" :class="bmiStatus?.color">
                {{ bmiValue }}
              </div>
            </div>

            <!-- 健康状态 -->
            <div v-if="bmiStatus" class="space-y-2">
              <div class="text-gray-500 text-sm">{{ $t('calc.status') }}:</div>
              <div
                class="p-3 rounded-lg font-medium bg-opacity-10"
                :class="[bmiStatus.color, { 'bg-opacity-10': true }]">
                <span class="font-bold mr-1">{{ $t(bmiStatus.labelKey) }}</span>
                <span class="text-sm text-gray-600"> ({{ bmiStatus.range }})</span>
              </div>

              <!-- 健康提示 -->
              <p class="text-xs text-gray-500 pt-2 italic">
                {{ $t('calc.health_tip') }}
              </p>
            </div>
          </div>
          <!-- 默认提示 -->
          <div v-else class="text-gray-400 p-4 border border-dashed rounded-lg text-center">
            {{ $t('calc.enter_valid_data') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
