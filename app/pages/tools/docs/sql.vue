<!--
 * @Author: zengxiaobin
 * @Date: 2025-11-22 16:16:16
 * @LastEditors: xiaobin
 * @LastEditTime: 2025-11-22 16:16:31
 * @FilePath: \xiao-nuxt4\app\pages\tools\docs\sql.vue
 * @Description: 注释
-->
<template>
  <CheatsheetLayout :title="$t('cheatsheet.sql_title')" :desc="$t('cheatsheet.sql_desc')" :data="data" />
</template>
<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()
  const data = computed(() => [
    {
      category: t('cheatsheet_data.sql.cat_dml'),
      items: [
        { code: 'SELECT * FROM table WHERE col = "val"', desc: t('cheatsheet_data.sql.desc_select') },
        { code: 'INSERT INTO table (col) VALUES ("val")', desc: t('cheatsheet_data.sql.desc_insert') },
        { code: 'UPDATE table SET col = "val" WHERE id = 1', desc: t('cheatsheet_data.sql.desc_update') },
        { code: 'DELETE FROM table WHERE id = 1', desc: t('cheatsheet_data.sql.desc_delete') }
      ]
    },
    {
      category: t('cheatsheet_data.sql.cat_join'),
      items: [
        { code: 'SELECT * FROM t1 LEFT JOIN t2 ON t1.id = t2.uid', desc: t('cheatsheet_data.sql.desc_left') },
        { code: 'SELECT * FROM t1 INNER JOIN t2 ON t1.id = t2.uid', desc: t('cheatsheet_data.sql.desc_inner') }
      ]
    },
    {
      category: t('cheatsheet_data.sql.cat_ddl'),
      items: [
        { code: 'CREATE TABLE t (id INT, name VARCHAR(50))', desc: t('cheatsheet_data.sql.desc_create') },
        { code: 'DROP TABLE table_name', desc: t('cheatsheet_data.sql.desc_drop') }
      ]
    }
  ])
</script>
