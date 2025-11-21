<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {{ $t('auth.login_title') }}
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">{{ $t('auth.username') }}</label>
          <div class="mt-2">
            <input
              v-model="form.username"
              type="text"
              required
              class="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">{{ $t('auth.password') }}</label>
          <div class="mt-2">
            <input
              v-model="form.password"
              type="password"
              required
              class="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" />
          </div>
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm text-center">{{ errorMsg }}</div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
            {{ loading ? $t('auth.logging_in') : $t('auth.login_btn') }}
          </button>
        </div>
      </form>

      <p class="mt-10 text-center text-sm text-gray-500">
        {{ $t('auth.no_account') }}
        <NuxtLink :to="localePath('/register')" class="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">
          {{ $t('auth.go_register') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { login, loading } = useAuth()
  const form = reactive({ username: '', password: '' })
  const errorMsg = ref('')

  // 在 script 中使用 t 需要解构
  const { t } = useI18n()
  const localePath = useLocalePath()

  const handleLogin = async () => {
    errorMsg.value = ''
    const res = await login(form)
    if (res.success) {
      navigateTo(localePath('/')) // 跳转时也要带上语言
    } else {
      // 这里使用 t() 函数来翻译脚本中的字符串，如果是后端返回的错误，通常后端也需要支持多语言
      errorMsg.value = res.error ? res.error : t('auth.error')
    }
  }
</script>
