<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 14:01:13
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:01:25
 * @FilePath: \xiao-nuxt4\app\layouts\default.vue
 * @Description: 注释
-->
<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>
