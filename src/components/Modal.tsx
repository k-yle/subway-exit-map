import { type PropsWithChildren, useEffect, useRef } from 'react';

export const Modal: React.FC<
  {
    isOpen: boolean;
    onClose(): void;
  } & PropsWithChildren
> = ({ isOpen, onClose, children }) => {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.[isOpen ? 'showModal' : 'close']();
  }, [isOpen]);

  return (
    <dialog
      ref={dialog}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <button type="button" onClick={onClose}>
        Close
      </button>
      {children}
    </dialog>
  );
};
