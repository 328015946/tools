<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 13:49:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 10:38:51
 * @FilePath: \xiao-nuxt4\app\app.vue
 * @Description: 注释
-->
<template>
  <div>
    <!-- 无障碍路由通知，保留即可 -->
    <NuxtRouteAnnouncer />
    <!-- ✅ 添加 Toaster 组件 -->
    <!-- position: 位置 (top-center, top-right, bottom-right 等) -->
    <!-- richColors: 开启富颜色模式 (成功绿/失败红) -->
    <Toaster position="top-center" richColors closeButton />
    <!-- 核心：这里会应用 layouts/default.vue 里的布局 (包含导航栏) -->
    <NuxtLayout>
      <!-- 核心：这里会根据网址渲染 pages/ 下面对应的页面 -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
  // ✅ 引入组件和样式
  import { Toaster } from 'vue-sonner'
  // 👇👇👇 【关键】：必须引入这个样式文件！ 👇👇👇
  import 'vue-sonner/style.css'
</script>
<!-- 👇👇👇 添加这段样式 👇👇👇 -->
<style>
  /* 强制覆盖 vue-sonner 的关闭按钮位置 */
  [data-sonner-toast] [data-close-button] {
    left: auto !important; /* 取消默认的左边定位 */
    right: -10px !important; /* 强制靠右 */
    top: -2px !important; /* 强制靠上 */
  }
</style>
