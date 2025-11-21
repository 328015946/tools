// composables/useAuth.ts
export const useAuth = () => {
  // 使用 useCookie 替代 useState，这样数据会保存在浏览器的 Cookie 中
  // 刷新页面或服务端渲染时都能读取到
  const user = useCookie<{ username: string; email: string } | null>('user_info', {
    default: () => null, // 默认为未登录
    watch: true, // 监听变化自动更新 UI
    maxAge: 60 * 60 * 24 * 7 // Cookie 有效期 7 天
  })

  // 模拟登录状态 loading
  const loading = useState('auth_loading', () => false)

  // 模拟登录函数
  const login = async (form: any) => {
    loading.value = true
    try {
      // 模拟 API 请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 简单的模拟验证
      if (form.username === 'admin' && form.password === '123456') {
        // 登录成功，设置 user cookie
        user.value = {
          username: 'Admin User',
          email: 'admin@example.com'
        }
        return { success: true }
      } else {
        return { success: false, error: '用户名或密码错误 (试试 admin / 123456)' }
      }
    } finally {
      loading.value = false
    }
  }

  // 模拟注册函数
  const register = async (form: any) => {
    loading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 注册成功后直接登录
      user.value = {
        username: form.username,
        email: `${form.username}@example.com`
      }
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = () => {
    user.value = null
    navigateTo('/login')
  }

  return {
    user,
    loading,
    login,
    register,
    logout
  }
}
