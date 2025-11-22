<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ $t('screen.title') }}</h1>
      <p class="text-gray-500 mt-2">{{ $t('screen.desc') }}</p>
    </div>

    <div class="mb-6">
      <input
        v-model="search"
        type="text"
        :placeholder="$t('screen.search')"
        class="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="dev in filteredDevices"
        :key="dev.name"
        class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg text-gray-800">{{ dev.name }}</h3>
          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{{ dev.os }}</span>
        </div>
        <div class="grid grid-cols-2 gap-y-2 text-sm">
          <div class="text-gray-500">{{ $t('screen.logic') }}</div>
          <div class="font-mono text-emerald-600 font-bold text-right">{{ dev.logic }}</div>
          <div class="text-gray-500">{{ $t('screen.physical') }}</div>
          <div class="font-mono text-right">{{ dev.physical }}</div>
          <div class="text-gray-500">{{ $t('screen.density') }}</div>
          <div class="font-mono text-right">@{{ dev.density }}x</div>
          <div class="text-gray-500">{{ $t('screen.size') }}</div>
          <div class="font-mono text-right">{{ dev.size }}"</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { t } = useI18n()
  const search = ref('')

  const devices = [
    { name: 'iPhone 15 Pro Max', logic: '430 x 932', physical: '1290 x 2796', density: 3, size: 6.7, os: 'iOS' },
    { name: 'iPhone 15 / 15 Pro', logic: '393 x 852', physical: '1179 x 2556', density: 3, size: 6.1, os: 'iOS' },
    { name: 'iPhone 14 Plus', logic: '428 x 926', physical: '1284 x 2778', density: 3, size: 6.7, os: 'iOS' },
    { name: 'iPhone 13 / 14', logic: '390 x 844', physical: '1170 x 2532', density: 3, size: 6.1, os: 'iOS' },
    { name: 'Pixel 7 Pro', logic: '412 x 892', physical: '1440 x 3120', density: 3.5, size: 6.7, os: 'Android' },
    { name: 'Samsung S23 Ultra', logic: '360 x 772', physical: '1440 x 3088', density: 4, size: 6.8, os: 'Android' },
    { name: 'iPad Pro 12.9"', logic: '1024 x 1366', physical: '2048 x 2732', density: 2, size: 12.9, os: 'iPadOS' },
    { name: 'MacBook Air M2', logic: '1470 x 956', physical: '2940 x 1912', density: 2, size: 13.6, os: 'macOS' }
  ]

  const filteredDevices = computed(() => {
    if (!search.value) return devices
    const q = search.value.toLowerCase()
    return devices.filter(d => d.name.toLowerCase().includes(q))
  })

  useHead({ title: t('screen.title') + ' - NuxtTools' })
</script>
