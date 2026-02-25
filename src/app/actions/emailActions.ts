'use server';

import { createClient } from '@/app/utils/supabase/server';
import { Resend } from 'resend';
import { generateEmailHTML } from '@/lib/email-template';
import { checkUserRole } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBroadcastEmail(prevState: any, formData: FormData) {
  const isAdmin = await checkUserRole('admin');
  if (!isAdmin) {
    return {
      success: false,
      message: 'Acesso negado. Apenas administradores podem enviar emails.',
    };
  }

  const subject = formData.get('subject') as string;
  const content = formData.get('content') as string;
  const testEmail = formData.get('test_email') as string;
  const isTest = formData.get('is_test') === 'true';

  if (!subject || !content) {
    return { success: false, message: 'Assunto e conteúdo são obrigatórios.' };
  }

  const htmlContent = generateEmailHTML(content);

  try {
    if (isTest) {
      if (!testEmail) {
        return { success: false, message: 'Email de teste é obrigatório para envio de teste.' };
      }

      await resend.emails.send({
        from: 'DeckSage <nao-responda@decksage.com.br>',
        to: [testEmail],
        subject: `[TESTE] ${subject}`,
        html: htmlContent,
      });

      return { success: true, message: `Email de teste enviado para ${testEmail}!` };
    } else {
      // PRODUCTION BROADCAST
      const supabase = createClient();

      // Fetch all users with emails
      // Note: In a real large-scale app, we would paginate this or use batch sending.
      // For now, fetching first 1000 users.
      const { data: users, error } = await supabase
        .from('profiles') // Assuming profiles has emails, if not we might need a different approach or RPC
        .select('email')
        .not('email', 'is', null);

      if (error || !users || users.length === 0) {
        console.error('Erro ao buscar usuários:', error);
        return { success: false, message: 'Nenhum usuário encontrado para envio.' };
      }

      // Resend supports batching, but for simplicity/limitations we might loop
      // OR send to 'bcc' if the list is small enough (limit 50 per email usually).
      // A safer approach for list < 1000 is loop with delay or batch endpoint.

      // Let's implement a simple batch loop of 50
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        batches.push(users.slice(i, i + BATCH_SIZE).map((u) => u.email));
      }

      let sentCount = 0;
      for (const batch of batches) {
        await resend.emails.send({
          from: 'DeckSage <nao-responda@decksage.com.br>',
          to: ['nao-responda@decksage.com.br'],
          bcc: batch as string[],
          subject: subject,
          html: htmlContent,
        });
        sentCount += batch.length;
      }

      // Save to database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const blocksJson = formData.get('blocks') as string;
      const blocks = blocksJson ? JSON.parse(blocksJson) : null;

      // Generate a unique ID if not provided (for Resend batch tracking, though we just store the last one for now or null)
      // Resend send() returns an ID, but for batches we might get multiple.
      // Simplified: we just log it as sent.

      await supabase.from('email_broadcasts').insert({
        admin_id: user?.id,
        subject: subject,
        content: content,
        blocks: blocks,
        recipient_count: sentCount,
        status: 'sent',
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Disparo concluído! Email enviado para ${sentCount} usuários.`,
      };
    }
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return { success: false, message: `Erro ao enviar: ${error.message}` };
  }
}

export async function saveDraft(formData: FormData) {
  const supabase = await createClient();
  if (!(await checkUserRole('admin'))) {
    return {
      success: false,
      message: 'Acesso negado. Apenas administradores podem salvar rascunhos.',
    };
  }

  try {
    const id = formData.get('id') as string | null;
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string; // HTML
    const blocksJson = formData.get('blocks') as string;
    const blocks = blocksJson ? JSON.parse(blocksJson) : null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (id) {
      const { error } = await supabase
        .from('email_broadcasts')
        .update({
          subject,
          content,
          blocks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: 'Rascunho atualizado com sucesso!', id };
    } else {
      const { data, error } = await supabase
        .from('email_broadcasts')
        .insert({
          admin_id: user?.id,
          subject,
          content,
          blocks,
          status: 'draft',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, message: 'Rascunho salvo com sucesso!', id: data.id };
    }
  } catch (error: any) {
    console.error('Erro ao salvar rascunho:', error);
    return { success: false, message: `Erro ao salvar: ${error.message}` };
  }
}

export async function getBroadcasts() {
  if (!(await checkUserRole('admin'))) return []; // Or throw

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_broadcasts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar broadcasts:', error);
    return [];
  }

  return data;
}

export async function deleteBroadcast(id: string) {
  if (!(await checkUserRole('admin'))) {
    return {
      success: false,
      message: 'Acesso negado. Apenas administradores podem salvar rascunhos.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('email_broadcasts').delete().eq('id', id);
  if (error) return { success: false, message: error.message };

  return { success: true, message: 'Email excluído.' };
}

// Stats syncing would go here if we had Resend Pro or distinct IDs per email
// For BCC, Resend returns one ID. We'd ideally store that ID in sendBroadcastEmail above.
// For now, skipping complex stats sync implementation until required or using simplified model.
