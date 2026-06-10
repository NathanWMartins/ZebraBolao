'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function signInWithEmail(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/dashboard'

  if (!email || !password) {
    return { error: 'Preencha todos os campos.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.' }
    }
    return { error: 'Erro ao entrar. Tente novamente.' }
  }

  redirect(next)
}

export async function signUpWithEmail(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const username = (formData.get('username') as string)?.trim()
  const next = (formData.get('next') as string) || '/dashboard'

  if (!email || !password || !confirmPassword || !username) {
    return { error: 'Preencha todos os campos.' }
  }

  if (username.length < 3 || username.length > 30) {
    return { error: 'O nome de usuário deve ter entre 3 e 30 caracteres.' }
  }

  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return { error: 'O nome de usuário deve conter apenas letras, números, underscores e espaços.' }
  }

  if (password.length < 8) {
    return { error: 'A senha deve ter no mínimo 8 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: username },
    },
  })

  if (error) {
    console.error('signUpWithEmail error:', error.message, error.status)
    if (error.message.includes('already registered') || error.message.includes('User already registered')) {
      return { error: 'Este e-mail já está cadastrado. Tente fazer login.' }
    }
    return { error: `Erro ao criar conta: ${error.message}` }
  }

  // Se o usuário já tem sessão (confirmação desativada), redireciona direto
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    redirect(next)
  }

  return { success: true }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Preencha todos os campos.' }
  }

  if (password.length < 8) {
    return { error: 'A senha deve ter no mínimo 8 caracteres.' }
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Erro ao atualizar a senha. O link pode ter expirado.' }
  }

  redirect('/dashboard')
}

export async function sendPasswordReset(prevState: any, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email) {
    return { error: 'Informe seu e-mail.' }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    return { error: 'Erro ao enviar o e-mail. Tente novamente.' }
  }

  return { success: true }
}
