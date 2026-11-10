'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { followUser, unfollowUser } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function ProfileFollowButton({
  targetUserId,
  initialFollowing,
  canInteract,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  canInteract: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (!canInteract) return null;

  const toggle = () => {
    startTransition(async () => {
      if (following) {
        const r = await unfollowUser(targetUserId);
        if (r.success) {
          setFollowing(false);
          toast.success(r.message);
        } else toast.error(r.message);
      } else {
        const r = await followUser(targetUserId);
        if (r.success) {
          setFollowing(true);
          toast.success(r.message);
        } else toast.error(r.message);
      }
    });
  };

  return (
    <Button
      type="button"
      variant={following ? 'outline' : 'default'}
      size="sm"
      disabled={pending}
      onClick={toggle}
      className={following ? 'border-neutral-600' : ''}
    >
      {following ? 'A seguir' : 'Seguir'}
    </Button>
  );
}
