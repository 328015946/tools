<template>
  <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('ssl.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('ssl.desc') }}</p>
    </div>

    <!-- Input Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('ssl.host_label') }}</label>
          <input
            v-model="host"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            :placeholder="$t('ssl.host_placeholder')"
            @keyup.enter="checkCert"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('ssl.port_label') }}</label>
          <input
            v-model="port"
            type="number"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="443"
          />
        </div>
        <button
          @click="checkCert"
          :disabled="loading || !host"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span v-if="loading" class="animate-spin text-lg">⌛</span>
          {{ loading ? $t('ssl.checking') : $t('ssl.check_btn') }}
        </button>
      </div>
      <p v-if="error" class="mt-3 text-red-600 text-sm flex items-center gap-1">
        <span>⚠️</span> {{ $t('ssl.error') }} {{ error }}
      </p>
    </div>

    <!-- Result Section -->
    <div v-if="cert" class="space-y-6">
      <!-- Status Card -->
      <div :class="['rounded-xl p-6 border-l-4 shadow-sm', statusClasses]">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium uppercase tracking-wider opacity-70">{{ $t('ssl.status') }}</h3>
            <p class="text-2xl font-bold mt-1">{{ statusText }}</p>
          </div>
          <div class="text-right">
            <h3 class="text-sm font-medium uppercase tracking-wider opacity-70">{{ $t('ssl.remaining') }}</h3>
            <p class="text-2xl font-bold mt-1">{{ daysRemaining }} {{ $t('ssl.days') }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Subject -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span class="text-blue-500">👤</span> {{ $t('ssl.subject') }}
          </h3>
          <dl class="space-y-3">
            <div v-for="(val, key) in cert.subject" :key="key" class="flex flex-col">
              <dt class="text-xs font-medium text-gray-500 uppercase">{{ key }}</dt>
              <dd class="text-sm text-gray-900 break-all">{{ val }}</dd>
            </div>
          </dl>
        </div>

        <!-- Issuer -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span class="text-emerald-500">🏢</span> {{ $t('ssl.issuer') }}
          </h3>
          <dl class="space-y-3">
            <div v-for="(val, key) in cert.issuer" :key="key" class="flex flex-col">
              <dt class="text-xs font-medium text-gray-500 uppercase">{{ key }}</dt>
              <dd class="text-sm text-gray-900 break-all">{{ val }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Technical Details -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span class="text-purple-500">⚙️</span> {{ $t('ssl.technical') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div class="flex flex-col">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.valid_from') }}</dt>
            <dd class="text-sm text-gray-900">{{ formatDate(cert.valid_from) }}</dd>
          </div>
          <div class="flex flex-col">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.valid_to') }}</dt>
            <dd class="text-sm text-gray-900">{{ formatDate(cert.valid_to) }}</dd>
          </div>
          <div class="flex flex-col">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.algorithm') }}</dt>
            <dd class="text-sm text-gray-900">{{ cert.bits }} bits</dd>
          </div>
          <div class="flex flex-col">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.serial') }}</dt>
            <dd class="text-sm text-gray-900 font-mono break-all">{{ cert.serialNumber }}</dd>
          </div>
          <div class="flex flex-col md:col-span-2">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.fingerprint') }}</dt>
            <dd class="text-sm text-gray-900 font-mono break-all">{{ cert.fingerprint }}</dd>
          </div>
          <div v-if="cert.subjectaltname" class="flex flex-col md:col-span-2">
            <dt class="text-xs font-medium text-gray-500 uppercase">{{ $t('ssl.sans') }}</dt>
            <dd class="text-sm text-gray-900 break-all">{{ cert.subjectaltname }}</dd>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const host = ref('')
const port = ref(443)
const loading = ref(false)
const cert = ref<any>(null)
const error = ref('')

const checkCert = async () => {
  if (!host.value) return
  
  loading.value = true
  error.value = ''
  cert.value = null
  
  try {
    // Basic domain cleanup
    const cleanHost = host.value.replace(/^https?:\/\//, '').split('/')[0].split(':')[0]
    
    const data = await $fetch('/api/ssl-check', {
      params: { host: cleanHost, port: port.value }
    })
    cert.value = data
  } catch (e: any) {
    error.value = e.statusMessage || e.message || 'Unknown error'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const daysRemaining = computed(() => {
  if (!cert.value) return 0
  const expiry = new Date(cert.value.valid_to)
  const now = new Date()
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const statusClasses = computed(() => {
  const days = daysRemaining.value
  if (days <= 0) return 'bg-red-50 border-red-500 text-red-700'
  if (days <= 30) return 'bg-amber-50 border-amber-500 text-amber-700'
  return 'bg-emerald-50 border-emerald-500 text-emerald-700'
})

const statusText = computed(() => {
  const days = daysRemaining.value
  if (days <= 0) return t('ssl.expired')
  if (days <= 30) return t('ssl.warning')
  return t('ssl.valid')
})

useHead({
  title: t('ssl.title') + ' - 小宾果',
  meta: [{ name: 'description', content: t('ssl.desc') }]
})
</script>
