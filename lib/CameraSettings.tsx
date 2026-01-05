import React from 'react';
import {
  MediaDeviceMenu,
  TrackReference,
  TrackToggle,
  useLocalParticipant,
  VideoTrack,
} from '@livekit/components-react';
import { BackgroundBlur, VirtualBackground } from '@livekit/track-processors';
import { isLocalTrack, LocalTrackPublication, Track } from 'livekit-client';
import Desk from '../public/background-images/desk_background.png';
import Nature from '../public/background-images/nature_background.png';

import styles from '../styles/CameraSettings.module.css';

// Background image paths
const BACKGROUND_IMAGES = [
  { name: 'Desk', path: Desk },
  { name: 'Nature', path: Nature },
];

// Background options
type BackgroundType = 'none' | 'blur' | 'image';

export function CameraSettings() {
  const { cameraTrack, localParticipant } = useLocalParticipant();
  const [backgroundType, setBackgroundType] = React.useState<BackgroundType>(
    (cameraTrack as LocalTrackPublication)?.track?.getProcessor()?.name === 'background-blur'
      ? 'blur'
      : (cameraTrack as LocalTrackPublication)?.track?.getProcessor()?.name === 'virtual-background'
        ? 'image'
        : 'none',
  );

  const [virtualBackgroundImagePath, setVirtualBackgroundImagePath] = React.useState<string | null>(
    null,
  );

  const camTrackRef: TrackReference | undefined = React.useMemo(() => {
    return cameraTrack
      ? { participant: localParticipant, publication: cameraTrack, source: Track.Source.Camera }
      : undefined;
  }, [localParticipant, cameraTrack]);

  const selectBackground = (type: BackgroundType, imagePath?: string) => {
    setBackgroundType(type);
    if (type === 'image' && imagePath) {
      setVirtualBackgroundImagePath(imagePath);
    } else if (type !== 'image') {
      setVirtualBackgroundImagePath(null);
    }
  };

  React.useEffect(() => {
    if (isLocalTrack(cameraTrack?.track)) {
      if (backgroundType === 'blur') {
        cameraTrack.track?.setProcessor(BackgroundBlur());
      } else if (backgroundType === 'image' && virtualBackgroundImagePath) {
        cameraTrack.track?.setProcessor(VirtualBackground(virtualBackgroundImagePath));
      } else {
        cameraTrack.track?.stopProcessor();
      }
    }
  }, [cameraTrack, backgroundType, virtualBackgroundImagePath]);

  return (
    <div className={styles.settingsContainer}>
      {camTrackRef && (
        <VideoTrack
          className={styles.videoPreview}
          trackRef={camTrackRef}
        />
      )}

      <section className="lk-button-group">
        <TrackToggle source={Track.Source.Camera}>Camera</TrackToggle>
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="videoinput" />
        </div>
      </section>

      <div className={styles.effectsSection}>
        <div className={styles.effectsTitle}>Background Effects</div>
        <div className={styles.effectsGrid}>
          <button
            onClick={() => selectBackground('none')}
            className={`${styles.effectButton} lk-button ${
              backgroundType === 'none' ? styles.effectButtonActive : ''
            }`}
            aria-pressed={backgroundType === 'none'}
          >
            None
          </button>

          <button
            onClick={() => selectBackground('blur')}
            className={`${styles.effectButton} ${styles.blurButton} lk-button ${
              backgroundType === 'blur' ? styles.effectButtonActive : ''
            }`}
            aria-pressed={backgroundType === 'blur'}
          >
            <div className={styles.blurOverlay} />
            <span className={styles.effectLabel}>Blur</span>
          </button>

          {BACKGROUND_IMAGES.map((image) => (
            <button
              key={image.path.src}
              onClick={() => selectBackground('image', image.path.src)}
              className={`${styles.effectButton} ${styles.imageButton} lk-button ${
                backgroundType === 'image' && virtualBackgroundImagePath === image.path.src
                  ? styles.effectButtonActive
                  : ''
              } ${image.name === 'Desk' ? styles.bgDesk : ''} ${image.name === 'Nature' ? styles.bgNature : ''}`}
              aria-pressed={
                backgroundType === 'image' && virtualBackgroundImagePath === image.path.src
              }
            >
              <span className={styles.effectLabel}>{image.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
