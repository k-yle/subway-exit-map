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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- bug in the rule, see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/pull/940
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
