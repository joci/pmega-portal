import { useRuntimeConfig } from '#imports'

export type DbProfile = {
  host: string
  port: number
  user: string
  password: string
  database: string
}

const normalizeEnv = (value: string) => value.toLowerCase()

export const getDbProfile = () => {
  const config = useRuntimeConfig()
  const env = normalizeEnv(String(config.appEnv || 'local'))
  const profiles = config.db.profiles as Record<'local' | 'test' | 'prod', DbProfile>

  if (env === 'production' || env === 'prod') {
    return { name: 'prod', profile: profiles.prod }
  }
  if (env === 'test' || env === 'staging') {
    return { name: 'test', profile: profiles.test }
  }
  return { name: 'local', profile: profiles.local }
}

export const getDbConfig = () => getDbProfile().profile
