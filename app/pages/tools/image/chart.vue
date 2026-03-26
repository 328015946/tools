<template>
  <div class="max-w-[1400px] mx-auto py-6 px-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ $t('chart.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ $t('chart.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
      <!-- 左侧：配置面板 (4/12) -->
      <div class="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
        <!-- 1. 全局设置 -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="font-bold text-gray-800 border-b pb-2 mb-3 text-sm uppercase">{{ $t('chart.config_title') }}</h3>

          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('chart.chart_type') }}</label>
              <select
                v-model="type"
                class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500">
                <option value="bar">{{ $t('chart.types.bar') }}</option>
                <option value="line">{{ $t('chart.types.line') }}</option>
                <option value="pie">{{ $t('chart.types.pie') }}</option>
                <option value="doughnut">{{ $t('chart.types.doughnut') }}</option>
                <option value="polarArea">{{ $t('chart.types.polarArea') }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('chart.chart_title') }}</label>
              <input
                v-model="chartTitle"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-lg text-sm"
                placeholder="My Chart" />
            </div>
          </div>
        </div>

        <!-- 2. 数据录入表 (可滚动) -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm flex-grow flex flex-col overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <span class="font-bold text-gray-700 text-xs uppercase">{{ $t('chart.data_config') }}</span>
            <span class="text-xs text-gray-400">{{ rows.length }} items</span>
          </div>

          <!-- 表头 -->
          <div
            class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
            <div class="col-span-4">{{ $t('chart.label') }}</div>
            <div class="col-span-3">{{ $t('chart.value') }}</div>
            <div class="col-span-3">{{ $t('chart.color') }}</div>
            <div class="col-span-2 text-center">Op</div>
          </div>

          <!-- 列表 -->
          <div class="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
            <div v-for="(row, idx) in rows" :key="idx" class="grid grid-cols-12 gap-2 items-center group">
              <div class="col-span-4">
                <input
                  type="text"
                  v-model="row.label"
                  class="w-full p-1.5 text-sm border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="col-span-3">
                <input
                  type="number"
                  v-model.number="row.value"
                  class="w-full p-1.5 text-sm border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div class="col-span-3 flex items-center">
                <input
                  type="color"
                  v-model="row.color"
                  class="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer mr-2" />
              </div>
              <div class="col-span-2 text-center">
                <button
                  @click="removeRow(idx)"
                  class="text-gray-300 hover:text-red-500 p-1 transition"
                  :disabled="rows.length <= 1">
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="p-3 border-t border-gray-200 bg-gray-50">
            <button
              @click="addRow"
              class="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 rounded-lg text-sm font-bold transition">
              + {{ $t('chart.add_row') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览 (8/12) -->
      <div class="lg:col-span-8 flex flex-col h-full">
        <div
          class="bg-white border border-gray-200 rounded-xl shadow-sm flex-grow p-6 flex items-center justify-center relative overflow-hidden">
          <!-- 图表组件容器 -->
          <!-- 必须设置 relative 和 height/width 才能让 Chart.js 自适应 -->
          <div class="relative w-full h-full max-h-[600px]">
            <ClientOnly>
              <!-- 动态组件渲染 -->
              <component :is="currentChartComponent" :data="chartData" :options="chartOptions" ref="chartRef" />
            </ClientOnly>
          </div>

          <!-- 下载按钮 (悬浮) -->
          <button
            @click="downloadChart"
            class="absolute top-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition flex items-center gap-2">
            <span>📷</span> {{ $t('chart.download') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    Filler
  } from 'chart.js'
  import { Bar, Line, Pie, Doughnut, PolarArea } from 'vue-chartjs'

  // 注册 Chart.js 组件
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    Filler
  )

  const { t } = useI18n()

  // 状态
  const type = ref<'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea'>('bar')
  const chartTitle = ref('Monthly Sales')
  const chartRef = ref(null)

  // 数据行
  const rows = ref([
    { label: 'Jan', value: 12, color: '#3b82f6' },
    { label: 'Feb', value: 19, color: '#ef4444' },
    { label: 'Mar', value: 3, color: '#fbbf24' },
    { label: 'Apr', value: 5, color: '#10b981' },
    { label: 'May', value: 2, color: '#8b5cf6' },
    { label: 'Jun', value: 3, color: '#ec4899' }
  ])

  // 映射图表组件
  const currentChartComponent = computed(() => {
    switch (type.value) {
      case 'bar':
        return Bar
      case 'line':
        return Line
      case 'pie':
        return Pie
      case 'doughnut':
        return Doughnut
      case 'polarArea':
        return PolarArea
      default:
        return Bar
    }
  })

  // 构造 Chart.js 数据
  const chartData = computed(() => {
    return {
      labels: rows.value.map(r => r.label),
      datasets: [
        {
          label: chartTitle.value, // 用于 Tooltip
          data: rows.value.map(r => r.value),
          backgroundColor: rows.value.map(r => r.color),
          borderColor: rows.value.map(r => r.color),
          borderWidth: 1,
          // 针对 Line Chart 的特殊配置
          tension: 0.4, // 平滑曲线
          fill: type.value === 'line' // 是否填充下方
        }
      ]
    }
  })

  // 图表配置
  const chartOptions = computed(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type.value === 'pie' || type.value === 'doughnut' || type.value === 'polarArea',
          position: 'bottom'
        },
        title: {
          display: true,
          text: chartTitle.value,
          font: { size: 20 }
        }
      },
      scales: {
        // 只有直角坐标系才显示 XY 轴
        y: { display: type.value === 'bar' || type.value === 'line' },
        x: { display: type.value === 'bar' || type.value === 'line' }
      }
    }
  })

  // 操作
  const addRow = () => {
    rows.value.push({ label: 'New', value: Math.floor(Math.random() * 20), color: '#9ca3af' })
  }

  const removeRow = (idx: number) => {
    if (rows.value.length > 1) rows.value.splice(idx, 1)
  }

  const downloadChart = () => {
    // 获取组件内的 Canvas 元素
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `chart-${type.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  useHead({ title: t('chart.title') + ' - 小宾果' })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 4px;
  }
</style>
