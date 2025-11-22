<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 16:16:00
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 16:16:10
 * @FilePath: \xiao-nuxt4\app\pages\tools\docs\docker.vue
 * @Description: 注释
-->
<template>
  <CheatsheetLayout :title="$t('cheatsheet.docker_title')" :desc="$t('cheatsheet.docker_desc')" :data="data" />
</template>
<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()
  const data = computed(() => [
    {
      category: t('cheatsheet_data.docker.cat_image'),
      items: [
        { code: 'docker build -t <name> .', desc: t('cheatsheet_data.docker.desc_build') },
        { code: 'docker pull <image>', desc: t('cheatsheet_data.docker.desc_pull') },
        { code: 'docker images', desc: t('cheatsheet_data.docker.desc_ls') },
        { code: 'docker rmi <image>', desc: t('cheatsheet_data.docker.desc_rmi') }
      ]
    },
    {
      category: t('cheatsheet_data.docker.cat_container'),
      items: [
        { code: 'docker run -d -p 80:80 <image>', desc: t('cheatsheet_data.docker.desc_run') },
        { code: 'docker ps -a', desc: t('cheatsheet_data.docker.desc_ps') },
        { code: 'docker logs -f <id>', desc: t('cheatsheet_data.docker.desc_logs') },
        { code: 'docker exec -it <id> /bin/bash', desc: t('cheatsheet_data.docker.desc_exec') }
      ]
    },
    {
      category: t('cheatsheet_data.docker.cat_clean'),
      items: [
        { code: 'docker system prune', desc: t('cheatsheet_data.docker.desc_prune') },
        { code: 'docker stats', desc: t('cheatsheet_data.docker.desc_stats') }
      ]
    }
  ])
</script>
