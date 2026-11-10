'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { Bell } from 'lucide-react';

export default function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setCount(0);
        return;
      }
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (!cancelled) setCount(error ? 0 : count ?? 0);
    };

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (count === null) return null;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-md p-2 text-foreground/80 hover:bg-white/[0.06] hover:text-primary"
      aria-label="Notificações"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-h-[1.1rem] min-w-[1.1rem] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-tight text-black">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
