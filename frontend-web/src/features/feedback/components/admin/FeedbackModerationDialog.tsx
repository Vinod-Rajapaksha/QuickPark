import { useState} from 'react';
import type {FormEvent,} from 'react';
import  Modal  from '../../../../components/common/Modal/Modal';
import Button from '../../../../components/common/Button/Button';
import type { Feedback } from '../../types/feedbackTypes';

interface FeedbackModerationDialogProps {
  feedback: Feedback | null;

  isOpen: boolean;

  isLoading: boolean;

  onClose: () => void;

  onReply: (
    feedbackId: string,
    message: string
  ) => Promise<void>;

  onApprove: (
    feedbackId: string
  ) => Promise<void>;
}

export const FeedbackModerationDialog = ({
  feedback,
  isOpen,
  isLoading,
  onClose,
  onReply,
  onApprove,
}: FeedbackModerationDialogProps) => {
  const [message, setMessage] = useState('');

   if (!feedback) {
    return null;
  }

  const handleReply = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    await onReply(
      feedback.id,
      trimmed
    );

    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Moderate Feedback"
    >
      <div className="space-y-6">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-1 text-sm font-semibold text-slate-900">
            {feedback.userName}
          </p>

          <p className="text-sm leading-6 text-slate-600">
            {feedback.comment ||
              'No comment provided.'}
          </p>
        </div>

        {feedback.type === 'SYSTEM' &&
          feedback.status ===
            'PENDING_APPROVAL' && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <h4 className="font-semibold text-emerald-900">
                Waiting for approval
              </h4>

              <p className="mt-1 text-sm text-emerald-700">
                Approving this feedback will make
                it visible on the public landing
                page.
              </p>

              <div className="mt-4">
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    await onApprove(
                      feedback.id
                    );

                    onClose();
                  }}
                >
                  {isLoading
                    ? 'Approving...'
                    : 'Approve Feedback'}
                </Button>
              </div>
            </div>
          )}

        <form
          onSubmit={handleReply}
          className="space-y-4"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Admin Reply
            </label>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
                }
              placeholder="Write a reply..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {message.length}/1000
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isLoading ||
                !message.trim()
              }
            >
              {isLoading
                ? 'Sending...'
                : 'Send Reply'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};