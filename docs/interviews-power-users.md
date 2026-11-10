# Entrevistas com power users (Decksage)

Objetivo: ouvir 10–15 jogadores muito engajados para validar prioridades de produto e comunidade.

## Quem convidar

Execute no **SQL Editor** do Supabase (ajuste nomes de tabelas se o schema divergir).

### Por volume de decks

```sql
select
  p.id,
  p.email,
  p.username,
  p.full_name,
  count(d.id) as deck_count
from public.profiles p
join public.decks d on d.user_id = p.id
group by p.id, p.email, p.username, p.full_name
order by deck_count desc
limit 20;
```

### Por atividade recente (ex.: comentários)

Se a tabela `deck_comments` existir:

```sql
select
  p.id,
  p.email,
  p.username,
  count(c.id) as comments
from public.profiles p
join public.deck_comments c on c.user_id = p.id
where c.created_at > now() - interval '60 days'
group by p.id, p.email, p.username
order by comments desc
limit 20;
```

Cruze as duas listas, remova duplicados e convide por **e-mail** (oferta: ~30 min + agradecimento simbólico, se aplicável).

## Roteiro sugerido (~25 min)

1. **Contexto**: como você usa o Decksage hoje (formato, frequência)?  
2. **Valor**: o que te faz **voltar**?  
3. **Dor**: o que mais te **atrapalha** ou te faria parar de usar?  
4. **Comunidade**: comentários / Discord / feed — o que faria sentido para você?  
5. **Fechamento**: se pudesse pedir **uma** melhoria para a próxima versão, qual seria?

Registre notas por entrevista (problema → citação → severidade) e alinhe com eventos do PostHog quando possível.
