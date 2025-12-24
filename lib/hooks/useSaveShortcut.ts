import { useEffect } from 'react';

/**
 * Listens for:
 *  • Cmd/Ctrl + S       (saveShortcut)
 *  • Plain Enter        (saveOnEnter)
 *  • Cmd/Ctrl + Enter   (saveOnCmdEnter)
 *
 * @param formRef        A ref to an HTMLFormElement
 * @param saveShortcut   Enable Cmd/Ctrl+S           (default: true)
 * @param saveOnEnter    Enable plain Enter          (default: false)
 * @param saveOnCmdEnter Enable Cmd/Ctrl + Enter     (default: false)
 */
export const useSaveShortcut = ({
  formRef,
  saveShortcut = true,
  saveOnEnter = false,
  saveOnCmdEnter = false,
}: {
  formRef: React.RefObject<HTMLFormElement | null>;
  saveShortcut?: boolean;
  saveOnEnter?: boolean;
  saveOnCmdEnter?: boolean;
}) => {
  useEffect(() => {
    const isMac = navigator.userAgent.toUpperCase().includes('MAC');

    const handleKeyDown = (e: KeyboardEvent) => {
      const modHeld = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      // Cmd/Ctrl + S
      if (saveShortcut && modHeld && key === 's') {
        e.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }

      // Plain Enter
      if (saveOnEnter && !modHeld && key === 'enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
        return;
      }

      // Cmd/Ctrl + Enter
      if (saveOnCmdEnter && modHeld && key === 'enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formRef, saveShortcut, saveOnEnter, saveOnCmdEnter]);
};
