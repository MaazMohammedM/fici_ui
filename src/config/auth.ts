export const authConfig = {
  redirectUrls: {
    signIn: '/',
    signUp: '/',
    callback: '/auth/callback'
  },
  validation: {
    minPasswordLength: 6,
    minNameLength: 2
  },
  ui: {
    showRememberMe: false,
    showForgotPassword: true,
    enableGoogleAuth: true
  }
};