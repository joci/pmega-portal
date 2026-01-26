// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    appEnv: process.env.APP_ENV || process.env.NODE_ENV || 'local',
    appRole: process.env.APP_ROLE || 'admin',
    db: {
      profiles: {
        local: {
          host: process.env.DB_HOST_LOCAL || 'localhost',
          port: Number(process.env.DB_PORT_LOCAL || 5432),
          user: process.env.DB_USER_LOCAL || 'yosephworku',
          password: process.env.DB_PASSWORD_LOCAL || '',
          database: process.env.DB_NAME_LOCAL || ''
        },
        test: {
          host: process.env.DB_HOST_TEST || '',
          port: Number(process.env.DB_PORT_TEST || 5432),
          user: process.env.DB_USER_TEST || '',
          password: process.env.DB_PASSWORD_TEST || '',
          database: process.env.DB_NAME_TEST || ''
        },
        prod: {
          host: process.env.DB_HOST_PROD || '',
          port: Number(process.env.DB_PORT_PROD || 5432),
          user: process.env.DB_USER_PROD || '',
          password: process.env.DB_PASSWORD_PROD || '',
          database: process.env.DB_NAME_PROD || ''
        }
      }
    }
  },
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'am', name: 'Amharic', file: 'am.json' }
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    lazy: true,
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'omega_locale',
      redirectOn: 'root'
    }
  }
})
