import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Se o Supabase retornou erro no callback, redireciona pra home com o erro
  if (error) {
    const redirectUrl = new URL('/', origin)
    redirectUrl.searchParams.set('auth_error', errorDescription ?? error)
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const response = NextResponse.redirect(new URL('/dashboard', origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      const redirectUrl = new URL('/', origin)
      redirectUrl.searchParams.set('auth_error', exchangeError.message)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  // Sem código — volta pra home
  return NextResponse.redirect(new URL('/', origin))
}
