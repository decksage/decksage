/* eslint-disable no-console */
/* eslint-disable no-undef */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Chrome } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');
  const destination = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Pequeno delay para garantir que o cookie da sessão seja propagado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Faz refresh dos Server Components para pegar a sessão nova
      router.refresh();

      // Redireciona para a Home ou Dashboard
      router.replace(destination);
    } catch (error: any) {
      console.error('Login Error:', error);
      if (error.message === 'Invalid login credentials') {
        setError('Email ou senha inválidos. Por favor, verifique os seus dados.');
      } else {
        setError(error.message || 'Ocorreu um erro inesperado.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google Login Error:', error);
      setError(error.message || 'Erro ao fazer login com Google.');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `radial-gradient(circle at top right, rgba(217, 119, 6, 0.1), transparent 40%),
                          radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 50%)`,
      }}
    >
      <div className="w-full max-w-md p-8 space-y-8 bg-card/80 backdrop-blur-sm rounded-xl shadow-2xl border border-white/15">
        <header className="text-center">
          <p className="kicker justify-center">Entrar</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-foreground/80 mt-2">Faça login para continuar a sua jornada.</p>
        </header>

        <Button onClick={handleLoginWithGoogle} variant="outline" className="h-12 w-full">
          <Chrome size={22} />
          Continuar com Google
        </Button>

        <div className="flex items-center">
          <div className="flex-grow border-t border-white/15"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">OU</span>
          <div className="flex-grow border-t border-white/15"></div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/[0.04] border-white/15 focus-visible:border-primary/60"
              placeholder="seu.email@exemplo.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-muted-foreground">
                Senha
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 bg-white/[0.04] border-white/15 focus-visible:border-primary/60"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro no Login</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar com Email'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
