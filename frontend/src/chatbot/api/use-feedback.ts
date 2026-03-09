/**
 * Hook to submit feedback on chatbot messages
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SubmitFeedbackInput, ApiResponse } from '../types';

export function useFeedback() {
  return useMutation({
    mutationFn: async (input: SubmitFeedbackInput) => {
      const response = await apiClient<ApiResponse<{ message: string }>>(
        '/chatbot/feedback',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      );
      return response.data;
    },
  });
}
