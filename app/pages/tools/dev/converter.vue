<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('converter.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('converter.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
      <!-- 左侧：输入与配置 -->
      <div class="flex flex-col gap-4">
        <!-- 控制栏 -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
          <!-- 模式选择 -->
          <div class="bg-gray-100 p-1 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-1">
            <button
              v-for="opt in options"
              :key="opt.val"
              @click="mode = opt.val"
              class="px-2 py-2 text-xs font-bold rounded-md transition text-center"
              :class="
                mode === opt.val
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              ">
              {{ opt.label }}
            </button>
          </div>

          <!-- 类名配置 (仅在转代码模式显示) -->
          <div v-if="mode.includes('json2')" class="w-32">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">{{ $t('converter.root_class') }}</label>
            <input
              type="text"
              v-model="rootClass"
              class="w-full p-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Root" />
          </div>

          <!-- 包名 (仅 Java 显示) -->
          <div v-if="mode === 'json2java'" class="w-40">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">{{ $t('converter.package') }}</label>
            <input
              type="text"
              v-model="packageName"
              class="w-full p-2 border border-gray-300 rounded-lg text-sm"
              placeholder="com.example" />
          </div>
        </div>

        <!-- 输入框 -->
        <div class="flex-grow flex flex-col">
          <div class="flex justify-between mb-2">
            <label class="text-sm font-bold text-gray-700">{{ $t('converter.input_label') }}</label>
            <div class="flex gap-2">
              <button @click="pasteSample" class="text-xs text-emerald-600 hover:underline">粘贴示例</button>
              <button @click="inputData = ''" class="text-xs text-red-500 hover:underline">清空</button>
            </div>
          </div>
          <textarea
            v-model="inputData"
            class="w-full h-full p-4 border border-gray-300 rounded-xl font-mono text-xs resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
            placeholder="{ ... }"></textarea>
        </div>
      </div>

      <!-- 右侧：输出结果 -->
      <div class="flex flex-col h-full">
        <div class="flex justify-between mb-2">
          <label class="text-sm font-bold text-gray-700">{{ $t('converter.output_label') }}</label>
          <span v-if="errorMsg" class="text-xs text-red-500 font-bold bg-red-50 px-2 rounded">{{ errorMsg }}</span>
        </div>

        <div class="flex-grow relative bg-gray-900 rounded-xl border border-gray-700 overflow-hidden group">
          <textarea
            :value="outputData"
            readonly
            class="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs resize-none focus:outline-none custom-scrollbar"></textarea>

          <button
            @click="copyToClipboard(outputData)"
            class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-medium backdrop-blur transition border border-white/10">
            {{ copied ? '✅ Copied' : '📋 Copy' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { XMLParser, XMLBuilder } from 'fast-xml-parser'

  const { t } = useI18n()
  const { copyToClipboard, copied } = useCopy()

  const mode = ref('json2csharp')
  const inputData = ref('')
  const rootClass = ref('Root')
  const packageName = ref('com.example.model')
  const outputData = ref('')
  const errorMsg = ref('')
  const options = computed(() => [
    { val: 'json2csharp', label: 'JSON → C#' },
    { val: 'json2java', label: 'JSON → Java' },
    { val: 'json2xml', label: 'JSON → XML' },
    { val: 'xml2json', label: 'XML → JSON' }
  ])
  // 示例数据
  const pasteSample = () => {
    if (mode.value.startsWith('xml')) {
      inputData.value = `<root>\n  <user>\n    <name>John</name>\n    <age>30</age>\n  </user>\n</root>`
    } else {
      inputData.value = JSON.stringify(
        {
          id: 1,
          name: 'Nuxt Tools',
          features: ['JSON', 'XML'],
          isActive: true,
          meta: { created: '2024', author: 'Xiao' }
        },
        null,
        2
      )
    }
  }

  // -------------------------------------------------
  // 核心转换逻辑
  // -------------------------------------------------

  const convert = () => {
    if (!inputData.value.trim()) {
      outputData.value = ''
      errorMsg.value = ''
      return
    }

    try {
      errorMsg.value = ''

      // 1. XML <-> JSON 互转
      if (mode.value === 'xml2json') {
        const parser = new XMLParser()
        const obj = parser.parse(inputData.value)
        outputData.value = JSON.stringify(obj, null, 2)
        return
      }

      if (mode.value === 'json2xml') {
        const obj = JSON.parse(inputData.value)
        const builder = new XMLBuilder({ format: true, ignoreAttributes: false })
        outputData.value = builder.build(obj)
        return
      }

      // 2. JSON 转代码 (C# / Java)
      const obj = JSON.parse(inputData.value)
      const classes: string[] = []

      if (mode.value === 'json2csharp') {
        generateCSharp(obj, rootClass.value, classes)
        outputData.value = classes.join('\n\n')
      } else if (mode.value === 'json2java') {
        generateJava(obj, rootClass.value, classes)
        outputData.value = `package ${packageName.value};\n\n` + classes.join('\n\n')
      }
    } catch (e: any) {
      console.error(e)
      errorMsg.value = e.message.includes('JSON') ? t('converter.error_json') : t('converter.error_xml')
    }
  }

  // --- C# 生成器 ---
  const generateCSharp = (obj: any, className: string, classes: string[]) => {
    let classContent = `public class ${className}\n{\n`

    for (const key in obj) {
      const value = obj[key]
      const type = getCSharpType(value, key, classes)
      // PascalCase Property
      const propName = key.charAt(0).toUpperCase() + key.slice(1)
      classContent += `    public ${type} ${propName} { get; set; }\n`
    }

    classContent += `}`
    classes.push(classContent)
  }

  const getCSharpType = (value: any, key: string, classes: string[]): string => {
    if (value === null) return 'object'
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double'
    if (typeof value === 'boolean') return 'bool'
    if (Array.isArray(value)) {
      const itemType = value.length > 0 ? getCSharpType(value[0], key + 'Item', classes) : 'object'
      return `List<${itemType}>`
    }
    if (typeof value === 'object') {
      const nestedClassName = key.charAt(0).toUpperCase() + key.slice(1)
      generateCSharp(value, nestedClassName, classes) // 递归生成子类
      return nestedClassName
    }
    return 'object'
  }

  // --- Java 生成器 (简化版，不带 Lombok) ---
  const generateJava = (obj: any, className: string, classes: string[]) => {
    let classContent = `public class ${className} {\n`

    // Fields
    for (const key in obj) {
      const type = getJavaType(obj[key], key, classes)
      classContent += `    private ${type} ${key};\n`
    }

    classContent += `\n    // Getters and Setters can be generated by IDE or Lombok\n`
    classContent += `}`
    classes.push(classContent)
  }

  const getJavaType = (value: any, key: string, classes: string[]): string => {
    if (value === null) return 'Object'
    if (typeof value === 'string') return 'String'
    if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Double'
    if (typeof value === 'boolean') return 'Boolean'
    if (Array.isArray(value)) {
      const itemType = value.length > 0 ? getJavaType(value[0], key + 'Item', classes) : 'Object'
      return `List<${itemType}>`
    }
    if (typeof value === 'object') {
      const nestedClassName = key.charAt(0).toUpperCase() + key.slice(1)
      generateJava(value, nestedClassName, classes)
      return nestedClassName
    }
    return 'Object'
  }

  watch([inputData, mode, rootClass, packageName], convert)

  useHead({ title: t('converter.title') + ' - 小宾果' })
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
