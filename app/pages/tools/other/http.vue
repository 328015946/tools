<template>
  <div class="max-w-6xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('http.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('http.desc') }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：请求配置 -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- URL Bar -->
        <div
          class="flex gap-0 shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
          <select
            v-model="method"
            class="bg-gray-50 border-r border-gray-300 px-4 py-3 font-bold text-gray-700 focus:outline-none">
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
          <input
            v-model="url"
            type="text"
            class="flex-grow px-4 py-3 border-none focus:ring-0"
            placeholder="https://jsonplaceholder.typicode.com/todos/1"
            @keyup.enter="sendRequest" />
          <button
            @click="sendRequest"
            :disabled="loading"
            class="bg-emerald-600 text-white px-6 py-3 font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span v-if="loading" class="animate-spin">↻</span>
            {{ $t('http.send') }}
          </button>
        </div>

        <!-- Tabs: Params, Headers, Body -->
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div class="flex border-b border-gray-200 bg-gray-50">
            <button
              v-for="tab in ['Params', 'Headers', 'Body']"
              :key="tab"
              @click="activeTab = tab"
              class="px-6 py-3 text-sm font-medium transition border-b-2"
              :class="
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ">
              {{ tab }}
            </button>
          </div>

          <div class="p-4 min-h-[200px]">
            <!-- Key-Value 编辑器组件 (Params & Headers) -->
            <div v-if="activeTab === 'Params' || activeTab === 'Headers'" class="space-y-2">
              <div v-for="(item, index) in activeTab === 'Params' ? params : headers" :key="index" class="flex gap-2">
                <input
                  type="text"
                  v-model="item.key"
                  placeholder="Key"
                  class="flex-1 p-2 border border-gray-300 rounded text-sm" />
                <input
                  type="text"
                  v-model="item.value"
                  placeholder="Value"
                  class="flex-1 p-2 border border-gray-300 rounded text-sm" />
                <button @click="removeRow(activeTab, index)" class="text-gray-400 hover:text-red-500 p-2">✕</button>
              </div>
              <button @click="addRow(activeTab)" class="text-xs text-emerald-600 font-bold hover:underline mt-2">
                + {{ $t('http.add_row') }}
              </button>
            </div>

            <!-- Body 编辑器 -->
            <div v-if="activeTab === 'Body'">
              <div class="flex gap-4 mb-2 text-xs">
                <label class="flex items-center"
                  ><input type="radio" v-model="bodyType" value="json" class="mr-1 text-emerald-600" /> JSON</label
                >
                <label class="flex items-center"
                  ><input type="radio" v-model="bodyType" value="text" class="mr-1 text-emerald-600" /> Text</label
                >
              </div>
              <textarea
                v-model="bodyContent"
                class="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="{ ... }"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：响应结果 -->
      <div class="lg:col-span-1 flex flex-col h-full min-h-[500px]">
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm flex-grow flex flex-col overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <span class="font-bold text-gray-700">{{ $t('http.response') }}</span>

            <!-- 状态标签 -->
            <div v-if="response" class="flex gap-2 text-xs">
              <span class="px-2 py-1 rounded bg-gray-200 text-gray-700 font-mono">{{ response.time }}ms</span>
              <span
                class="px-2 py-1 rounded font-mono font-bold text-white"
                :class="response.status >= 200 && response.status < 300 ? 'bg-green-500' : 'bg-red-500'">
                {{ response.status }} {{ response.statusText }}
              </span>
            </div>
          </div>

          <!-- 响应内容 -->
          <div class="flex-grow relative bg-gray-900 overflow-auto custom-scrollbar">
            <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-gray-500">
              <div class="animate-spin h-8 w-8 border-4 border-gray-600 border-t-emerald-500 rounded-full"></div>
            </div>

            <pre
              v-if="response && response.data"
              class="p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all"
              >{{ response.data }}</pre
            >

            <div v-if="errorMsg" class="p-6 text-center text-red-400 text-sm">⚠️ {{ errorMsg }}</div>

            <div v-if="!response && !loading && !errorMsg" class="p-8 text-center text-gray-600 text-sm">
              Ready to send request...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()

  const method = ref('GET')
  const url = ref('https://jsonplaceholder.typicode.com/todos/1')
  const activeTab = ref('Params')
  const bodyType = ref('json')
  const bodyContent = ref('')
  const loading = ref(false)
  const errorMsg = ref('')

  // 动态 Key-Value 数据
  const params = ref([{ key: '', value: '' }])
  const headers = ref([{ key: '', value: '' }])

  const response = ref<any>(null)

  const addRow = (type: string) => {
    if (type === 'Params') params.value.push({ key: '', value: '' })
    if (type === 'Headers') headers.value.push({ key: '', value: '' })
  }

  const removeRow = (type: string, index: number) => {
    if (type === 'Params') params.value.splice(index, 1)
    if (type === 'Headers') headers.value.splice(index, 1)
  }

  // 核心发送逻辑
  const sendRequest = async () => {
    if (!url.value) return

    loading.value = true
    response.value = null
    errorMsg.value = ''

    const startTime = Date.now()

    try {
      // 1. 构建 URL (拼接 Params)
      const urlObj = new URL(url.value)
      params.value.forEach(p => {
        if (p.key) urlObj.searchParams.append(p.key, p.value)
      })

      // 2. 构建 Headers
      const headerObj: Record<string, string> = {}
      headers.value.forEach(h => {
        if (h.key) headerObj[h.key] = h.value
      })
      if (bodyType.value === 'json' && method.value !== 'GET') {
        headerObj['Content-Type'] = 'application/json'
      }

      // 3. 发送 Fetch
      const options: RequestInit = {
        method: method.value,
        headers: headerObj
      }

      if (method.value !== 'GET' && method.value !== 'HEAD' && bodyContent.value) {
        options.body = bodyContent.value
      }

      const res = await fetch(urlObj.toString(), options)

      // 4. 处理结果
      const endTime = Date.now()
      const contentType = res.headers.get('content-type')
      let data
      if (contentType && contentType.includes('application/json')) {
        data = await res.json() // 自动解析 JSON
        data = JSON.stringify(data, null, 2) // 格式化
      } else {
        data = await res.text()
      }

      response.value = {
        status: res.status,
        statusText: res.statusText,
        time: endTime - startTime,
        data: data
      }
    } catch (e: any) {
      console.error(e)
      errorMsg.value = t('http.error_cors') + ` (${e.message})`
    } finally {
      loading.value = false
    }
  }

  useHead({ title: t('http.title') + ' - NuxtTools' })
</script>

<style scoped>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }
</style>
