import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  console.log('🔄 Callback received with code:', code ? 'YES' : 'NO');

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error('❌ Error setting cookies:', error);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session) {
      console.log('✅ Session created for:', data.session.user.email);

      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response
    } else {
      console.error('❌ Auth exchange error:', error);
    }
  }

  console.log('⚠️ No code or error occurred, redirecting to home');
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}