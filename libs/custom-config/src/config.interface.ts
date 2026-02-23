// Core configuration interfaces
export interface DatabaseConfig {
  url: string
}

export interface RedisConfig {
  url: string
}

export interface HostConfig {
  port: number
}

export interface LogConfig {
  level: string
  enableJsonFormat: boolean
}

export interface AdminConfig {
  apiKey: string
}

export interface AuthConfig {
  bcryptRounds: number
  sessionTtlSeconds: number
}

export interface JwtConfig {
  secret: string
  expiresIn: string
}

// Main application configuration
export interface AppConfig {
  host: HostConfig
  database: DatabaseConfig
  redis: RedisConfig
  auth: AuthConfig
  log: LogConfig
  admin: AdminConfig
  jwt: JwtConfig

  [key: string]: unknown
}
