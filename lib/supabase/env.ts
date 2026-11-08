// Leitura central das variaveis do Supabase. Nunca imprime valores.
export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  return v;
}

/** anon/publishable: seguro para o browser (RLS protege os dados). */
export function supabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!v) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY ausente");
  return v;
}
