'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSetCollection } from '@/app/actions/setCollectionActions';
import {
  collectionScopeDescription,
  collectionScopeLabel,
  type CollectionScope,
} from '@/app/lib/setCollection';
import { Button } from '@/components/ui/button';
import { Loader2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  setCode: string;
  existingCollectionId: string | null;
  isAuthenticated: boolean;
};

export default function StartSetCollectionButton({
  setCode,
  existingCollectionId,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<CollectionScope>('all_printings');
  const [showOptions, setShowOptions] = useState(false);
  const [pending, startTransition] = useTransition();

  if (existingCollectionId) {
    return (
      <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
        <Link href={`/my-collection/${existingCollectionId}`}>
          <Layers className="mr-2 h-4 w-4" />
          Abrir minha coleção
        </Link>
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" className="border-amber-500/40 text-amber-400">
        <Link href={`/login?next=/collections/${setCode}`}>
          <Layers className="mr-2 h-4 w-4" />
          Entrar para colecionar
        </Link>
      </Button>
    );
  }

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createSetCollection(setCode, scope);
      if (result.error && !result.collectionId) {
        setError(result.error);
        return;
      }
      if (result.collectionId) {
        router.push(`/my-collection/${result.collectionId}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-center md:items-start gap-3 w-full max-w-md">
      {!showOptions ? (
        <Button
          onClick={() => setShowOptions(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        >
          <Layers className="mr-2 h-4 w-4" />
          Iniciar minha coleção
        </Button>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {(['regular_only', 'all_printings'] as CollectionScope[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScope(option)}
                className={cn(
                  'rounded-lg border p-3 text-left text-xs transition-colors',
                  scope === option
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-neutral-700 bg-neutral-900/50 hover:border-neutral-600',
                )}
              >
                <p className="font-medium text-neutral-200">{collectionScopeLabel(option)}</p>
                <p className="text-neutral-500 mt-1">{collectionScopeDescription(option)}</p>
              </button>
            ))}
          </div>
          <Button
            onClick={handleCreate}
            disabled={pending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold w-full sm:w-auto"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando coleção…
              </>
            ) : (
              <>Criar coleção ({collectionScopeLabel(scope)})</>
            )}
          </Button>
        </>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
