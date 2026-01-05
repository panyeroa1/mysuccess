'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import TranslatorControlBarButtons from './TranslatorControlBarButtons';

export default function TranslatorControlBarPortal() {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const findTarget = () => {
      const element = document.querySelector('.lk-control-bar');
      setTarget(element as HTMLElement | null);
    };

    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(<TranslatorControlBarButtons />, target);
}
