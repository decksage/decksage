'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { voteRoadmapFeedback, unvoteRoadmapFeedback } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function RoadmapVoteButton({
  feedbackId,
  initialCount,
  initialVoted,
  canVote,
}: {
  feedbackId: string;
  initialCount: number;
  initialVoted: boolean;
  canVote: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    if (!canVote) {
      toast.message('Faça login para votar.');
      return;
    }
    startTransition(async () => {
      if (voted) {
        const r = await unvoteRoadmapFeedback(feedbackId);
        if (r.success) {
          setVoted(false);
          setCount((c) => Math.max(0, c - 1));
        } else toast.error(r.message);
      } else {
        const r = await voteRoadmapFeedback(feedbackId);
        if (r.success) {
          setVoted(true);
          setCount((c) => c + 1);
        } else toast.error(r.message);
      }
    });
  };

  return (
    <Button
      type="button"
      variant={voted ? 'default' : 'outline'}
      size="sm"
      disabled={pending}
      onClick={toggle}
      className={voted ? '' : 'border-white/15'}
    >
      <ThumbsUp className="h-4 w-4 mr-1" />
      {count}
    </Button>
  );
}
