const { ipcRenderer } = require('electron');

const video = document.getElementById('video');
const videoContainer = document.getElementById('video-container');
const message = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
const sourceList = document.getElementById('source-list');

let mediaRecorder;
let recordedBlobs;
let selectedSource;

// Event listeners
videoSelectBtn.addEventListener('click', getVideoSources);

startBtn.addEventListener('click', () => {
  if (selectedSource) {
    startRecording(selectedSource);
  } else {
    console.log('Please select a source first');
  }
});

stopBtn.addEventListener('click', stopRecording);

// Function to get video sources
function getVideoSources() {
  ipcRenderer.send('get-desktop-capturer');
}

// Handle video sources received from main process
ipcRenderer.on('desktop-capturer', (event, sources) => {
  sourceList.innerHTML = ''; // Clear previous list
  sources.forEach(source => {
    const sourceItem = document.createElement('li');
    sourceItem.textContent = source.name;
    sourceItem.addEventListener('click', () => {
      selectedSource = source;
      console.log('Selected source:', source.name);
      startPreview(source); // Start preview of the selected source
    });
    sourceList.appendChild(sourceItem);
  });
});

// Function to start preview of the selected video source
function startPreview(source) {
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      },
    },
  })
  .then(stream => {
    video.srcObject = stream;
    video.style.display = 'block';

    // Handle the play promise
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Preview started');
      })
      .catch(error => {
        console.error('Error starting preview:', error);
      });
    }
  })
  .catch(error => {
    console.error('Error starting preview:', error);
  });
}

// Function to start recording
function startRecording(source) {
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      },
    },
  })
  .then(stream => {
    // Stop any existing tracks before starting a new one
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

    video.srcObject = stream;
    video.style.display = 'block';
    message.style.display = 'none';

    // Handle the play promise
    let playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Recording started');
      })
      .catch(error => {
        console.error('Error starting recording:', error);
      });
    }

    recordedBlobs = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedBlobs, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'recorded-video.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      // Clear the video and display success message
      video.srcObject = null;
      video.style.display = 'none';
      message.textContent = 'Video saved successfully!';
      message.style.display = 'block';

      // Disable stop button after recording stops
      stopBtn.disabled = true;
    };

    mediaRecorder.start();
    console.log('Recording started');

    // Enable stop button when recording starts
    stopBtn.disabled = false;
  })
  .catch(error => {
    console.error('Error starting recording:', error);
  });
}

// Function to stop recording
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Recording stopped');
  } else {
    console.log('No active recording to stop');
  }
}