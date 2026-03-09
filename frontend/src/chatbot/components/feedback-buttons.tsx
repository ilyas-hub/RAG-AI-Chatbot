/**
 * Thumbs up/down feedback buttons
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useFeedback } from '../api/use-feedback';

interface FeedbackButtonsProps {
  messageId: string;
  initialIsHelpful?: boolean | null;
}

export function FeedbackButtons({ messageId, initialIsHelpful }: FeedbackButtonsProps) {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(initialIsHelpful ?? null);
  const feedback = useFeedback();

  const handleFeedback = (value: boolean) => {
    if (isHelpful === value) return;
    setIsHelpful(value);
    feedback.mutate({ messageId, isHelpful: value });
  };

  return (
    <div className="flex items-center gap-0.5 mt-1 ml-1">
      <button
        type="button"
        aria-label="Mark as helpful"
        className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isHelpful === true
            ? 'text-green-500'
            : 'text-muted-foreground/40 hover:text-green-500 hover:bg-green-50'
        }`}
        onClick={() => handleFeedback(true)}
        disabled={feedback.isPending}
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        aria-label="Mark as not helpful"
        className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isHelpful === false
            ? 'text-red-500'
            : 'text-muted-foreground/40 hover:text-red-500 hover:bg-red-50'
        }`}
        onClick={() => handleFeedback(false)}
        disabled={feedback.isPending}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}
