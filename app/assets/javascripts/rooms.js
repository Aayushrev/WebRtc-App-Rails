document.addEventListener('DOMContentLoaded', () => {
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  
  let localStream;
  let peerConnection;
  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  const roomId = window.location.pathname.split('/').pop();

  const socket = new WebSocket(`ws://${window.location.host}/cable`);

  socket.onopen = () => {
    console.log('Connected to WebSocket');
  };

  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localVideo.srcObject = stream;
      localStream = stream;

      const offerOptions = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      };

      peerConnection = new RTCPeerConnection(configuration);
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.send(JSON.stringify({ room: roomId, candidate: event.candidate }));
        }
      };

      peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
      };

      peerConnection.createOffer(offerOptions)
        .then(offer => {
          return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
          socket.send(JSON.stringify({ room: roomId, offer: peerConnection.localDescription }));
        });
    });
  
  socket.onmessage = event => {
    const data = JSON.parse(event.data);

    if (data.answer) {
      const answer = new RTCSessionDescription(data.answer);
      peerConnection.setRemoteDescription(answer);
    } else if (data.offer) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
          socket.send(JSON.stringify({ room: roomId, answer: peerConnection.localDescription }));
        });
    } else if (data.candidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };
});






// document.addEventListener('DOMContentLoaded', () => {
//   // Selecting the HTML video elements for local and remote video streams
//   const localVideo = document.getElementById('localVideo');
//   const remoteVideo = document.getElementById('remoteVideo');

//   // Variables to hold the local media stream and the peer connection object
//   let localStream;
//   let peerConnection;

//   // STUN server configuration to facilitate NAT traversal (necessary for peer-to-peer connections)
//   const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

//   // Extract the room ID from the current URL (the last part of the path)
//   const roomId = window.location.pathname.split('/').pop();

//   // Establishing a WebSocket connection to the Rails backend (via Action Cable)
//   const socket = new WebSocket(`ws://${window.location.host}/cable`);

//   // Event handler for when the WebSocket connection is successfully established
//   socket.onopen = () => {
//     console.log('Connected to WebSocket');
//   };

//   // Request access to the user's media devices (camera and microphone)
//   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//     .then(stream => {
//       // Once the user grants permission, set the local video stream and display it in the localVideo element
//       localVideo.srcObject = stream;
//       localStream = stream;

//       // Define the offer options to enable both audio and video
//       const offerOptions = {
//         offerToReceiveAudio: 1,
//         offerToReceiveVideo: 1
//       };

//       // Create a new RTCPeerConnection object using the STUN server configuration
//       peerConnection = new RTCPeerConnection(configuration);

//       // Add each track (audio and video) from the local stream to the peer connection
//       localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

//       // Handle ICE (Interactive Connectivity Establishment) candidates for the connection
//       peerConnection.onicecandidate = event => {
//         if (event.candidate) {
//           // Send the ICE candidate to the WebSocket for signaling
//           socket.send(JSON.stringify({ room: roomId, candidate: event.candidate }));
//         }
//       };

//       // When the remote stream is received, display it in the remoteVideo element
//       peerConnection.ontrack = event => {
//         remoteVideo.srcObject = event.streams[0];
//       };

//       // Create an offer to initiate the WebRTC connection
//       peerConnection.createOffer(offerOptions)
//         .then(offer => {
//           // Set the local description (offer) for the peer connection
//           return peerConnection.setLocalDescription(offer);
//         })
//         .then(() => {
//           // Send the offer to the signaling server via WebSocket
//           socket.send(JSON.stringify({ room: roomId, offer: peerConnection.localDescription }));
//         });
//     });

//   // Listen for incoming messages (offers, answers, and ICE candidates) from the WebSocket
//   socket.onmessage = event => {
//     const data = JSON.parse(event.data);

//     // If we receive an answer from the remote peer, set it as the remote description
//     if (data.answer) {
//       const answer = new RTCSessionDescription(data.answer);
//       peerConnection.setRemoteDescription(answer);

//     // If we receive an offer (from a remote peer), handle it and send an answer
//     } else if (data.offer) {
//       peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
//         .then(() => peerConnection.createAnswer())
//         .then(answer => peerConnection.setLocalDescription(answer))
//         .then(() => {
//           socket.send(JSON.stringify({ room: roomId, answer: peerConnection.localDescription }));
//         });

//     // If we receive an ICE candidate, add it to the peer connection
//     } else if (data.candidate) {
//       peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
//     }
//   };
// });
