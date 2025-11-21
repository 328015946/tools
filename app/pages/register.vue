<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 14:02:14
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:02:22
 * @FilePath: \xiao-nuxt4\app\pages\register.vue
 * @Description: 注释
-->
<template>
  <div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">注册新用户</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">用户名</label>
          <div class="mt-2">
            <input
              v-model="form.username"
              type="text"
              required
              class="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900">密码</label>
          <div class="mt-2">
            <input
              v-model="form.password"
              type="password"
              required
              class="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
            {{ loading ? '注册中...' : '注册并自动登录' }}
          </button>
        </div>
      </form>

      <p class="mt-10 text-center text-sm text-gray-500">
        已有账号?
        <NuxtLink to="/login" class="font-semibold leading-6 text-emerald-600 hover:text-emerald-500">去登录</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  const { register, loading } = useAuth()
  const form = reactive({ username: '', password: '' })

  const handleRegister = async () => {
    const res = await register(form)
    if (res.success) {
      navigateTo('/')
    }
  }
</script>
