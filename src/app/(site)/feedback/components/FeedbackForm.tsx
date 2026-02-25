'use client';

import { useActionState } from 'react';
import { submitFeedback } from '@/app/actions/feedbackActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface FeedbackFormProps {
  user: any;
  userName: string;
  userEmail: string;
}

const initialState = {
  message: '',
  success: false,
};

export default function FeedbackForm({ user, userName, userEmail }: FeedbackFormProps) {
  const [state, formAction, isPending] = useActionState(submitFeedback, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {!user && (
        <>
          <div className="space-y-2">
            <Label htmlFor="user_name">Nome</Label>
            <Input
              id="user_name"
              name="user_name"
              placeholder="Seu nome"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_email">Email</Label>
            <Input
              id="user_email"
              name="user_email"
              type="email"
              placeholder="seu@email.com"
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
        </>
      )}

      {user && (
        <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-700 text-sm text-neutral-300">
          <p>
            Logado como <strong>{userName || 'Usuário'}</strong>
          </p>
          <p className="text-neutral-500">{userEmail}</p>
          {/* We don't need hidden inputs for user_name/email if logged in, the server action gets it from session */}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="feedback_type">Tipo de Feedback</Label>
        <Select name="feedback_type" required>
          <SelectTrigger className="bg-neutral-800 border-neutral-700">
            <SelectValue placeholder="Selecione um tipo" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700">
            <SelectItem value="Sugestão">💡 Sugestão</SelectItem>
            <SelectItem value="Elogio">❤️ Elogio</SelectItem>
            <SelectItem value="Problema">🐛 Problema / Bug</SelectItem>
            <SelectItem value="Outro">💬 Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Mensagem</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Conte-nos o que você está pensando..."
          className="bg-neutral-800 border-neutral-700 min-h-[120px]"
          required
          minLength={10}
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isPending ? 'Enviando...' : 'Enviar Feedback'}
      </Button>
    </form>
  );
}
