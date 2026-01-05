'use client';

import * as React from 'react';
import {
  ControlBar,
  ControlBarProps,
  usePersistentUserChoices,
} from '@livekit/components-react';
import TranslatorCustomControls from '@/lib/translator-plugin/TranslatorCustomControls';

export function CustomControlBar(props: ControlBarProps) {
  // We want to hide the default microphone button because we are replacing it
  // with the Translator's "Speak" button which handles the mic + translation logic.
  // The ControlBar component allows passing 'controls' to customize visibility.
  
  // We merge user props with our overrides
  const visibleControls = {
    ...props.controls,
    microphone: false, // Hide native mic
  };

  return (
    <div className="lk-control-bar">
      {/* 
        We render the standard ControlBar but with mic hidden.
        Note: ControlBar renders a div with class lk-control-bar. 
        We wrap it or just use it. If we use it, it might double wrap if we're not careful.
        Actually, ControlBar is the container. We can't easily inject INSIDE it unless we use
        the 'variation' prop (minimal/verbose) or if it supports children.
        Looking at standard LiveKit components, ControlBar usually renders a fixed set of buttons.
        For custom buttons *alongside*, it's often better to render them as siblings if layout permits,
        or we have to reimplement ControlBar.
        
        However, simplicity first: The user wants them in the "same area".
        A common pattern is:
        <div className="lk-control-bar">
           <TranslatorCustomControls />
           <ControlBar controls={{ microphone: false }} />
        </div>
        
        But this creates two bars. 
        The best approach without reimplementing the whole ControlBar (which entails handling all track toggles)
        is to see if we can render the ControlBar and then our custom buttons in a flex container that looks like one bar.
      */}
      
      <ControlBar 
        {...props} 
        controls={visibleControls}
        style={{ display: 'contents' }} // flattened to allow flex parent to control layout
      />
      
      {/* Insert Translator Controls */}
      <TranslatorCustomControls />
    </div>
  );
}
