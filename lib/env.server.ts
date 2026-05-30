import 'server-only'
import { z } from 'zod'

// SERVER-ONLY env module: validates the server secrets. The 'server-only'
// import makes any client-side import a build-time error.
const serverSchema = z.object({
  DASHBOARD_PASSWORD_SECRET: z.string(),
  ALPACA_API_KEY: z.string(),
  ALPACA_SECRET_KEY: z.string(),
  ALPACA_BASE_URL: z
    .string()
    .url('Invalid Alpaca base URL')
    .default('https://paper-api.alpaca.markets/v2'),
})

export const serverEnv = serverSchema.parse(process.env)
export type ServerEnv = z.infer<typeof serverSchema>
