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
  // Supabase server-side access. The secret key bypasses RLS, so all DB reads
  // run server-side behind the password gate — the anon key is no longer shipped
  // to the browser. SUPABASE_URL falls back to the public URL var for parity.
  SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .default(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
})

export const serverEnv = serverSchema.parse(process.env)
export type ServerEnv = z.infer<typeof serverSchema>
