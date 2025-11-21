<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-21 13:49:06
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-21 14:06:22
 * @FilePath: \xiao-nuxt4\app\app.vue
 * @Description: 注释
-->
<template>
  <div>
    <!-- 无障碍路由通知，保留即可 -->
    <NuxtRouteAnnouncer />

    <!-- 核心：这里会应用 layouts/default.vue 里的布局 (包含导航栏) -->
    <NuxtLayout>
      <!-- 核心：这里会根据网址渲染 pages/ 下面对应的页面 -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
