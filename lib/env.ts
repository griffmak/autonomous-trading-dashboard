import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  DASHBOARD_PASSWORD_SECRET: z.string(),
  ALPACA_API_KEY: z.string(),
  ALPACA_SECRET_KEY: z.string(),
  ALPACA_BASE_URL: z.string().url('Invalid Alpaca base URL').default('https://paper-api.alpaca.markets/v2'),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
