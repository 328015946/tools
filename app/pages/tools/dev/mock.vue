<template>
  <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('mock.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('mock.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      <!-- 左侧：配置区 (5/12) -->
      <div class="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
        <!-- 顶部控制栏 -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
          <!-- 数量滑块 -->
          <div>
            <div class="flex justify-between mb-1">
              <label class="text-sm font-bold text-gray-700">{{ $t('mock.count') }}</label>
              <span class="text-xs font-mono bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">{{ count }}</span>
            </div>
            <input
              type="range"
              v-model.number="count"
              min="1"
              max="100"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
          </div>

          <!-- 预设按钮 -->
          <div>
            <span class="text-xs font-bold text-gray-400 uppercase block mb-2">{{ $t('mock.presets') }}</span>
            <div class="flex gap-2">
              <button
                @click="loadPreset('user')"
                class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition">
                👤 {{ $t('mock.preset_user') }}
              </button>
              <button
                @click="loadPreset('product')"
                class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition">
                📦 {{ $t('mock.preset_product') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 字段列表 (可滚动) -->
        <div class="bg-white border border-gray-200 rounded-xl flex-grow flex flex-col overflow-hidden shadow-sm">
          <div
            class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between text-xs font-bold text-gray-500 uppercase">
            <span>{{ $t('mock.key_name') }}</span>
            <span>{{ $t('mock.data_type') }}</span>
          </div>

          <div class="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
            <div v-for="(field, idx) in fields" :key="idx" class="flex items-center gap-2 group">
              <!-- Key Input -->
              <input
                v-model="field.key"
                type="text"
                class="flex-1 min-w-0 p-2 text-sm border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="id" />

              <!-- Type Select -->
              <select
                v-model="field.type"
                class="flex-1 min-w-0 p-2 text-sm border border-gray-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option v-for="(labelKey, typeKey) in typeOptions" :key="typeKey" :value="typeKey">
                  {{ $t(labelKey) }}
                </option>
              </select>

              <!-- Delete Button -->
              <button
                @click="removeField(idx)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
                ✕
              </button>
            </div>
          </div>

          <!-- 底部添加按钮 -->
          <div class="p-3 border-t border-gray-200 bg-gray-50">
            <button
              @click="addField"
              class="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 rounded-lg text-sm font-bold transition">
              + {{ $t('mock.add_field') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果预览 (7/12) -->
      <div class="lg:col-span-7 h-full flex flex-col">
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-bold text-gray-700">{{ $t('mock.preview') }}</label>
          <div class="flex gap-2">
            <button
              @click="generateData"
              class="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition shadow-sm">
              🔄 {{ $t('mock.generate') }}
            </button>
            <button
              @click="copy"
              class="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:border-emerald-500 hover:text-emerald-600 transition">
              {{ copied ? '✅' : '📋' }}
            </button>
          </div>
        </div>

        <div class="flex-grow relative bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <textarea
            :value="resultJson"
            readonly
            class="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs resize-none focus:outline-none custom-scrollbar leading-relaxed"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 引入 Faker (按需引入以减小体积，或者直接引入 all)
  import { fakerZH_CN as faker } from '@faker-js/faker' // 使用中文数据源
  // 如果想用英文： import { faker } from '@faker-js/faker'

  const { t } = useI18n()
  const { copyToClipboard, copied } = useCopy()

  const count = ref(5)
  const resultJson = ref('')

  // 定义支持的数据类型映射
  const typeOptions = {
    uuid: 'mock.types.uuid',
    id: 'mock.types.id',
    name: 'mock.types.name',
    email: 'mock.types.email',
    avatar: 'mock.types.avatar',
    boolean: 'mock.types.boolean',
    number: 'mock.types.number',
    price: 'mock.types.price',
    date: 'mock.types.date',
    city: 'mock.types.city',
    ip: 'mock.types.ip',
    sentence: 'mock.types.sentence',
    paragraph: 'mock.types.paragraph'
  }

  // 字段配置结构
  interface FieldConfig {
    key: string
    type: keyof typeof typeOptions
  }

  const fields = ref<FieldConfig[]>([
    { key: 'id', type: 'id' },
    { key: 'username', type: 'name' },
    { key: 'email', type: 'email' },
    { key: 'isActive', type: 'boolean' }
  ])

  // 预设模版
  const loadPreset = (type: 'user' | 'product') => {
    if (type === 'user') {
      fields.value = [
        { key: 'userId', type: 'uuid' },
        { key: 'name', type: 'name' },
        { key: 'avatar', type: 'avatar' },
        { key: 'email', type: 'email' },
        { key: 'city', type: 'city' },
        { key: 'createdAt', type: 'date' }
      ]
    } else if (type === 'product') {
      fields.value = [
        { key: 'id', type: 'id' },
        { key: 'title', type: 'sentence' },
        { key: 'description', type: 'paragraph' },
        { key: 'price', type: 'price' },
        { key: 'cover', type: 'avatar' }, // 借用 avatar 当图片
        { key: 'isStock', type: 'boolean' }
      ]
    }
    generateData()
  }

  const addField = () => {
    fields.value.push({ key: 'newField', type: 'sentence' })
  }

  const removeField = (idx: number) => {
    fields.value.splice(idx, 1)
  }

  // 核心生成逻辑
  const generateData = () => {
    const data = []

    for (let i = 0; i < count.value; i++) {
      const item: Record<string, any> = {}

      fields.value.forEach(field => {
        const k = field.key
        switch (field.type) {
          case 'uuid':
            item[k] = faker.string.uuid()
            break
          case 'id':
            item[k] = i + 1
            break // 自增ID
          case 'name':
            item[k] = faker.person.fullName()
            break
          case 'email':
            item[k] = faker.internet.email()
            break
          case 'avatar':
            item[k] = faker.image.avatar()
            break
          case 'boolean':
            item[k] = faker.datatype.boolean()
            break
          case 'number':
            item[k] = faker.number.int({ min: 0, max: 100 })
            break
          case 'price':
            item[k] = parseFloat(faker.commerce.price())
            break
          case 'date':
            item[k] = faker.date.recent().toISOString()
            break
          case 'city':
            item[k] = faker.location.city()
            break
          case 'ip':
            item[k] = faker.internet.ip()
            break
          case 'sentence':
            item[k] = faker.lorem.sentence(5)
            break // 限制长度
          case 'paragraph':
            item[k] = faker.lorem.paragraph(2)
            break
          default:
            item[k] = null
        }
      })

      data.push(item)
    }

    resultJson.value = JSON.stringify(data, null, 2)
  }

  const copy = () => {
    copyToClipboard(resultJson.value)
  }

  // 监听变化自动生成 (使用 debounce 会更好，这里简单直接 watch)
  watch([count, fields], generateData, { deep: true })

  onMounted(generateData)

  useHead({ title: t('mock.title') + ' - 小宾果' })
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
