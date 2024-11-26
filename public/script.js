const socket = io();
let myStream;
let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const myVideo = document.getElementById('myVideo');
const userVideo = document.getElementById('userVideo');
const callToInput = document.getElementById('callTo');
const callBtn = document.getElementById('callBtn');
const answerBtn = document.getElementById('answerBtn');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myStream = stream;
    myVideo.srcObject = stream;
  });

callBtn.addEventListener('click', () => {
  const to = callToInput.value;
  if (!to) return alert('Please enter a socket ID to call.');

  peerConnection = new RTCPeerConnection(config);
  myStream.getTracks().forEach((track) => peerConnection.addTrack(track, myStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('call-user', {
        to,
        signal: peerConnection.localDescription,
      });
    }
  };

  peerConnection.ontrack = (event) => {
    userVideo.srcObject = event.streams[0];
  };

  peerConnection.createOffer().then((offer) => {
    peerConnection.setLocalDescription(offer);
    socket.emit('call-user', { to, signal: offer });
  });
});

socket.on('incoming-call', ({ from, signal }) => {
  answerBtn.hidden = false;
  answerBtn.onclick = () => {
    peerConnection = new RTCPeerConnection(config);
    myStream.getTracks().forEach((track) => peerConnection.addTrack(track, myStream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('answer-call', {
          to: from,
          signal: peerConnection.localDescription,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      userVideo.srcObject = event.streams[0];
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    peerConnection.createAnswer().then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit('answer-call', { to: from, signal: answer });
    });
  };
});

socket.on('call-answered', ({ signal }) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
});
