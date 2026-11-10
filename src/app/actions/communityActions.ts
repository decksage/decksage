'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { checkUserRole } from '@/lib/auth';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { captureServer } from '@/lib/analytics/posthog-server';
import { AnalyticsEvents } from '@/lib/analytics/events';

function sanitizeComment(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'code'] });
}

// --- NPS ---
const npsSchema = z.object({
  score: z.number().int().min(0).max(10),
  follow_up: z.string().max(2000).optional(),
});

export async function submitNpsResponse(score: number, followUp?: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login para enviar NPS.' };

  const parsed = npsSchema.safeParse({ score, follow_up: followUp });
  if (!parsed.success) return { success: false, message: 'Dados inválidos.' };

  const { error } = await supabase.from('nps_responses').insert({
    user_id: user.id,
    score: parsed.data.score,
    follow_up: parsed.data.follow_up ?? null,
  });
  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'Você já respondeu o NPS este mês. Obrigado!' };
    }
    return { success: false, message: 'Não foi possível guardar a resposta.' };
  }
  captureServer(user.id, AnalyticsEvents.NPS_SUBMITTED, { score: parsed.data.score });
  revalidatePath('/');
  return { success: true, message: 'Obrigado pelo feedback!' };
}

// --- Onboarding ---
const onboardingSchema = z.object({
  answer: z.enum([
    'deck_builder',
    'translations',
    'ai_analysis',
    'community',
    'friend',
    'other',
  ]),
});

export async function submitOnboardingAnswer(answer: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login.' };

  const parsed = onboardingSchema.safeParse({ answer });
  if (!parsed.success) return { success: false, message: 'Opção inválida.' };

  const { error } = await supabase.from('onboarding_answers').insert({
    user_id: user.id,
    answer: parsed.data.answer,
  });
  if (error) {
    if (error.code === '23505') return { success: true, message: 'Já registrado.' };
    return { success: false, message: 'Erro ao guardar.' };
  }

  await supabase
    .from('profiles')
    .update({
      onboarding_source: parsed.data.answer,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  captureServer(user.id, AnalyticsEvents.ONBOARDING_ANSWERED, { answer: parsed.data.answer });
  revalidatePath('/');
  return { success: true, message: 'Bem-vindo!' };
}

// --- Roadmap votes ---
export async function voteRoadmapFeedback(feedbackId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login para votar.' };

  const { data: fb } = await supabase.from('feedback').select('id').eq('id', feedbackId).eq('is_public', true).maybeSingle();
  if (!fb) return { success: false, message: 'Item não encontrado.' };

  const { error } = await supabase.from('feedback_votes').insert({ user_id: user.id, feedback_id: feedbackId });
  if (error) {
    if (error.code === '23505') return { success: false, message: 'Você já votou neste item.' };
    return { success: false, message: 'Erro ao votar.' };
  }
  revalidatePath('/roadmap');
  return { success: true, message: 'Voto registado!' };
}

export async function unvoteRoadmapFeedback(feedbackId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login.' };

  await supabase.from('feedback_votes').delete().eq('user_id', user.id).eq('feedback_id', feedbackId);
  revalidatePath('/roadmap');
  return { success: true, message: 'Voto removido.' };
}

export async function setFeedbackPublicRoadmap(feedbackId: string, isPublic: boolean) {
  const ok = await checkUserRole('admin');
  if (!ok) throw new Error('Acesso negado.');
  const supabase = createClient();
  const { error } = await supabase.from('feedback').update({ is_public: isPublic }).eq('id', feedbackId);
  if (error) throw new Error('Falha ao atualizar.');
  revalidatePath('/admin/feedback');
  revalidatePath('/roadmap');
}

// --- Deck comments ---
export async function createDeckComment(deckId: string, content: string, parentId?: string | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login para comentar.' };

  const clean = sanitizeComment(content.trim());
  if (clean.length < 2) return { success: false, message: 'Comentário muito curto.' };

  if (parentId) {
    const { data: parent } = await supabase.from('deck_comments').select('id, parent_id').eq('id', parentId).maybeSingle();
    if (!parent || parent.parent_id) {
      return { success: false, message: 'Resposta inválida (máximo 1 nível).' };
    }
  }

  const { data: deck } = await supabase.from('decks').select('format, is_public').eq('id', deckId).single();
  if (!deck?.is_public) return { success: false, message: 'Deck não aceita comentários.' };

  const { error } = await supabase.from('deck_comments').insert({
    deck_id: deckId,
    user_id: user.id,
    parent_id: parentId || null,
    content: clean,
  });
  if (error) return { success: false, message: 'Erro ao comentar.' };

  captureServer(user.id, AnalyticsEvents.DECK_COMMENTED, { deck_id: deckId });

  revalidatePath(`/decksage/${deckId}`);
  revalidatePath(`/my-deck/${deck.format}/${deckId}`);
  return { success: true, message: 'Comentário publicado.' };
}

export async function softDeleteDeckComment(commentId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login necessário.' };

  const { error } = await supabase
    .from('deck_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) return { success: false, message: 'Erro ao remover.' };
  revalidatePath('/');
  return { success: true, message: 'Removido.' };
}

// --- Post comments ---
export async function createPostComment(postId: string, content: string, parentId?: string | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Faça login.' };

  const clean = sanitizeComment(content.trim());
  if (clean.length < 2) return { success: false, message: 'Comentário muito curto.' };

  const { data: post } = await supabase.from('posts').select('slug, status').eq('id', postId).single();
  if (!post || post.status !== 'published') return { success: false, message: 'Post inválido.' };

  const { error } = await supabase.from('post_comments').insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId || null,
    content: clean,
  });
  if (error) return { success: false, message: 'Erro ao comentar.' };

  revalidatePath(`/blog/${post.slug}`);
  return { success: true, message: 'Comentário publicado.' };
}

// --- Likes ---
export async function toggleDeckLike(deckId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, liked: false, message: 'Faça login.' };

  const { data: existing } = await supabase
    .from('deck_likes')
    .select('deck_id')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .maybeSingle();

  if (existing) {
    await supabase.from('deck_likes').delete().eq('user_id', user.id).eq('deck_id', deckId);
    revalidatePath(`/decksage/${deckId}`);
    return { success: true, liked: false };
  }

  const { data: deck } = await supabase.from('decks').select('is_public, user_id').eq('id', deckId).single();
  if (!deck?.is_public) return { success: false, liked: false, message: 'Deck não público.' };

  const { error } = await supabase.from('deck_likes').insert({ user_id: user.id, deck_id: deckId });
  if (error) return { success: false, liked: false, message: 'Erro.' };

  captureServer(user.id, AnalyticsEvents.DECK_LIKED, { deck_id: deckId });
  revalidatePath(`/decksage/${deckId}`);
  return { success: true, liked: true };
}

// --- Notifications ---
export async function markNotificationRead(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
  revalidatePath('/notifications');
}

export async function markNotificationReadForm(formData: FormData) {
  const id = formData.get('id') as string;
  if (id) await markNotificationRead(id);
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  revalidatePath('/notifications');
}

// --- Reports ---
export async function submitReport(entityType: string, entityId: string, reason: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login necessário.' };
  if (reason.trim().length < 3) return { success: false, message: 'Descreva o motivo.' };

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
    reason: reason.trim().slice(0, 500),
  });
  if (error) return { success: false, message: 'Erro ao enviar denúncia.' };
  revalidatePath('/admin/moderation');
  return { success: true, message: 'Denúncia recebida. Obrigado.' };
}

export async function resolveReport(reportId: string, status: 'closed' | 'dismissed') {
  const ok = await checkUserRole('admin');
  if (!ok) throw new Error('Negado.');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from('reports')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id ?? null,
    })
    .eq('id', reportId);
  revalidatePath('/admin/moderation');
}

export async function resolveReportForm(formData: FormData) {
  const id = formData.get('report_id') as string;
  const status = formData.get('status') as 'closed' | 'dismissed';
  if (!id || (status !== 'closed' && status !== 'dismissed')) return;
  await resolveReport(id, status);
}

// --- Follows ---
export async function followUser(targetUserId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login necessário.' };
  if (user.id === targetUserId) return { success: false, message: 'Não pode seguir a si mesmo.' };

  const { error } = await supabase.from('follows').insert({ follower_id: user.id, followee_id: targetUserId });
  if (error) {
    if (error.code === '23505') return { success: true, message: 'Já segue.' };
    return { success: false, message: 'Erro.' };
  }
  captureServer(user.id, AnalyticsEvents.FOLLOW_CREATED, { followee_id: targetUserId });
  revalidatePath('/profile');
  return { success: true, message: 'A seguir!' };
}

export async function unfollowUser(targetUserId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login.' };
  await supabase.from('follows').delete().eq('follower_id', user.id).eq('followee_id', targetUserId);
  revalidatePath('/profile');
  return { success: true, message: 'Deixou de seguir.' };
}

// --- Profile community fields ---
export async function updateProfileCommunityFields(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login.' };

  const bio = (formData.get('bio') as string)?.slice(0, 2000) ?? '';
  const favorite_format = (formData.get('favorite_format') as string)?.slice(0, 64) ?? null;
  const favorite_colors = (formData.get('favorite_colors') as string)?.slice(0, 128) ?? null;
  const website_url = (formData.get('website_url') as string)?.slice(0, 500) ?? null;
  const notification_digest = (formData.get('notification_digest') as string) || 'off';

  const { error } = await supabase
    .from('profiles')
    .update({
      bio: bio || null,
      favorite_format,
      favorite_colors,
      website_url,
      notification_digest: ['off', 'weekly', 'daily'].includes(notification_digest) ? notification_digest : 'off',
    })
    .eq('id', user.id);

  if (error) return { success: false, message: 'Erro ao atualizar.' };
  revalidatePath('/profile');
  return { success: true, message: 'Perfil atualizado.' };
}

// --- Community publications (UGC) ---
export async function saveCommunityPublicationDraft(input: {
  id?: string;
  title: string;
  slug: string;
  publication_type: 'primer' | 'tier_list';
  body: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login.' };

  const slug = input.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);

  if (input.id) {
    const { error } = await supabase
      .from('community_publications')
      .update({
        title: input.title.slice(0, 200),
        slug,
        publication_type: input.publication_type,
        body: input.body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .eq('user_id', user.id)
      .in('status', ['draft', 'rejected']);

    if (error) return { success: false, message: 'Erro ao atualizar rascunho.' };
    return { success: true, id: input.id };
  }

  const { data, error } = await supabase
    .from('community_publications')
    .insert({
      user_id: user.id,
      title: input.title.slice(0, 200),
      slug,
      publication_type: input.publication_type,
      body: input.body,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) return { success: false, message: 'Erro ao criar rascunho.' };
  return { success: true, id: data?.id };
}

export async function submitCommunityPublicationForReview(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Login.' };

  const { error } = await supabase
    .from('community_publications')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .in('status', ['draft', 'rejected']);

  if (error) return { success: false, message: 'Erro.' };
  revalidatePath('/community');
  return { success: true, message: 'Enviado para revisão.' };
}

export async function reviewCommunityPublication(
  id: string,
  decision: 'published' | 'rejected',
  reviewerNote?: string,
) {
  const ok = await checkUserRole('admin');
  if (!ok) throw new Error('Negado.');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('community_publications')
    .update({
      status: decision,
      reviewer_note: reviewerNote ?? null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error('Falha');
  revalidatePath('/admin/community-publications');
  revalidatePath('/community');
}

export async function reviewCommunityPublicationForm(formData: FormData) {
  const id = formData.get('id') as string;
  const decision = formData.get('decision') as 'published' | 'rejected';
  const note = (formData.get('note') as string) || undefined;
  if (!id || (decision !== 'published' && decision !== 'rejected')) return;
  await reviewCommunityPublication(id, decision, note);
}

// --- Ambassador (admin) ---
export async function setAmbassadorFlag(profileId: string, isAmbassador: boolean) {
  const ok = await checkUserRole('admin');
  if (!ok) throw new Error('Negado.');
  const supabase = createClient();
  await supabase
    .from('profiles')
    .update({
      is_ambassador: isAmbassador,
      ambassador_since: isAmbassador ? new Date().toISOString() : null,
    })
    .eq('id', profileId);
  revalidatePath('/admin/users');
}
