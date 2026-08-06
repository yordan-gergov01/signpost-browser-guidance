import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';

export type DeleteAccountDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteAccountDialog({ onClose, onConfirm }: DeleteAccountDialogProps) {
  return (
    <Dialog
      title="Delete account"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            data-testid="confirm-delete-account"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Yes, delete everything
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">
        This permanently deletes the workspace and all of its data.
      </p>
    </Dialog>
  );
}
