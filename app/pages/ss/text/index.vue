<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 14:47:36
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:51:27
 * @FilePath: \xiao-nuxt4\app\pages\tools\dev.vue
 * @Description: 注释
-->
<template>
  <div class="py-12 text-center">
    <h1 class="text-3xl font-bold mb-4">{{ $t('nav.dev_tools') }}</h1>
    <p class="text-gray-500">这里将放置开发相关的工具集合。</p>
    <div class="mt-8">
      <NuxtLinkLocale :to="'/'" class="text-emerald-600 hover:underline">← 返回首页</NuxtLinkLocale>
    </div>
  </div>
</template>
