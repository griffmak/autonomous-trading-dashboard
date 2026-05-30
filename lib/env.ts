import { z } from 'zod'

// CLIENT-SAFE env module: validates ONLY the two public vars.
// Referenced explicitly (not via process.env parse) so Next can inline them
// and so no server secret names or top-level process.env parse ship to the browser.
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
})

export const env = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

export type Env = z.infer<typeof clientSchema>
