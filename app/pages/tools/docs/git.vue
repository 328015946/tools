<template>
  <CheatsheetLayout :title="$t('cheatsheet.git_title')" :desc="$t('cheatsheet.git_desc')" :data="data" />
</template>

<script setup lang="ts">
  import CheatsheetLayout from '~/components/CheatsheetLayout.vue'
  const { t } = useI18n()

  const data = computed(() => [
    {
      category: t('cheatsheet_data.git.cat_config'),
      items: [
        { code: 'git config --global user.name "name"', desc: t('cheatsheet_data.git.desc_name') },
        { code: 'git config --global user.email "email"', desc: t('cheatsheet_data.git.desc_email') },
        { code: 'git config --global alias.co checkout', desc: t('cheatsheet_data.git.desc_alias') }
      ]
    },
    {
      category: t('cheatsheet_data.git.cat_create'),
      items: [
        { code: 'git init', desc: t('cheatsheet_data.git.desc_init') },
        { code: 'git clone <url>', desc: t('cheatsheet_data.git.desc_clone') }
      ]
    },
    {
      category: t('cheatsheet_data.git.cat_snapshot'),
      items: [
        { code: 'git add .', desc: t('cheatsheet_data.git.desc_add_all') },
        { code: 'git add <file>', desc: t('cheatsheet_data.git.desc_add_file') },
        { code: 'git commit -m "msg"', desc: t('cheatsheet_data.git.desc_commit') },
        { code: 'git commit --amend', desc: t('cheatsheet_data.git.desc_commit_amend') },
        { code: 'git status', desc: t('cheatsheet_data.git.desc_status') },
        { code: 'git diff', desc: t('cheatsheet_data.git.desc_diff') },
        { code: 'git restore <file>', desc: t('cheatsheet_data.git.desc_restore') }
      ]
    },
    {
      category: t('cheatsheet_data.git.cat_branch'),
      items: [
        { code: 'git branch', desc: t('cheatsheet_data.git.desc_branch_list') },
        { code: 'git branch <name>', desc: t('cheatsheet_data.git.desc_branch_new') },
        { code: 'git checkout <branch>', desc: t('cheatsheet_data.git.desc_checkout') },
        { code: 'git checkout -b <name>', desc: t('cheatsheet_data.git.desc_checkout_b') },
        { code: 'git merge <branch>', desc: t('cheatsheet_data.git.desc_merge') },
        { code: 'git branch -d <branch>', desc: t('cheatsheet_data.git.desc_branch_del') }
      ]
    },
    {
      category: t('cheatsheet_data.git.cat_remote'),
      items: [
        { code: 'git remote add origin <url>', desc: t('cheatsheet_data.git.desc_remote_add') },
        { code: 'git remote -v', desc: t('cheatsheet_data.git.desc_remote_v') },
        { code: 'git fetch', desc: t('cheatsheet_data.git.desc_fetch') },
        { code: 'git pull origin main', desc: t('cheatsheet_data.git.desc_pull') },
        { code: 'git push origin main', desc: t('cheatsheet_data.git.desc_push') },
        { code: 'git push -u origin main', desc: t('cheatsheet_data.git.desc_push_u') }
      ]
    },
    {
      category: t('cheatsheet_data.git.cat_undo'),
      items: [
        { code: 'git log --oneline', desc: t('cheatsheet_data.git.desc_log') },
        { code: 'git reset --soft HEAD~1', desc: t('cheatsheet_data.git.desc_reset_soft') },
        { code: 'git reset --hard HEAD~1', desc: t('cheatsheet_data.git.desc_reset_hard') },
        { code: 'git revert <commit>', desc: t('cheatsheet_data.git.desc_revert') },
        { code: 'git stash', desc: t('cheatsheet_data.git.desc_stash') },
        { code: 'git stash pop', desc: t('cheatsheet_data.git.desc_stash_pop') }
      ]
    }
  ])
</script>
