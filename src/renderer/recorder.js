// ── Hidden Recorder Window ──────────────────────────────────────────
// This window handles getUserMedia + MediaRecorder for screen recording.
// Runs in a hidden, non-transparent BrowserWindow so desktop capture
// does NOT hide the transparent overlay window on Windows.

let mediaRecorder = null;

const QUALITY_PRESETS = {
  ultra:  { fps: 60, bitrate: 30_000_000 },
  max:    { fps: 60, bitrate: 16_000_000 },
  high:   { fps: 60, bitrate: 10_000_000 },
  medium: { fps: 30, bitrate: 5_000_000 },
  low:    { fps: 30, bitrate: 2_500_000 },
};

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

window.kairozun.onStartRecording(async ({ sourceId, width, height, duration, quality }) => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') return;

  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;

  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: width,
          maxWidth: width,
          minHeight: height,
          maxHeight: height,
          maxFrameRate: preset.fps,
        },
      },
    });

    let combinedStream = videoStream;
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          },
        },
        video: false,
      });
      const tracks = [...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()];
      combinedStream = new MediaStream(tracks);
    } catch { /* audio capture not available */ }

    let mimeType = 'video/webm;codecs=h264';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: preset.bitrate,
    });

    window.kairozun.startRecordingFile();

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        e.data.arrayBuffer().then(buf => {
          window.kairozun.sendRecordingChunk(new Uint8Array(buf));
        });
      }
    };

    mediaRecorder.onerror = () => {
      stopRecording();
    };

    mediaRecorder.onstop = () => {
      combinedStream.getTracks().forEach(t => t.stop());
      mediaRecorder = null;
      setTimeout(() => {
        window.kairozun.endRecordingFile();
        window.kairozun.recordingState(false);
      }, 50);
    };

    mediaRecorder.start(4000);
    window.kairozun.recordingState(true);

    setTimeout(() => {
      stopRecording();
    }, duration * 1000);
  } catch (err) {
    console.error('[Recorder] Failed to start capture:', err);
    window.kairozun.recordingState(false);
  }
});

window.kairozun.onStopRecording(() => {
  stopRecording();
});
