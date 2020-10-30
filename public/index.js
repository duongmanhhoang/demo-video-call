const codeRoom = window.location.pathname.slice(6);
let isAlreadyCalling = false;
let getCalled = false;
const existingCalls = [];
const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();
const socket = io.connect(window.origin);

function handleError(err) {
    console.error('Error', err);
}

function updateUserList(sockectIds) {
    const activeUserContainer = document.getElementById('active-user-container');

    sockectIds.forEach(socketId => {
        const userExist = document.getElementById(socketId);

        if (!userExist) {
            const userContainer = createUserItemContainer(socketId);
            activeUserContainer.appendChild(userContainer);
        }
    });
}

function createUserItemContainer(socketId) {
    const userContainer = document.createElement('div');
    const userName = document.createElement('p');

    userContainer.setAttribute('class', 'active-user');
    userContainer.setAttribute('id', socketId);
    userName.setAttribute('class', 'username');
    userName.innerHTML = `Socket: ${socketId}`;

    userContainer.appendChild(userName);

    userContainer.addEventListener('click', () => {
        unselectUsersFromList();
        userContainer.setAttribute('class', 'active-user', 'active-user--selected');
        const talkingWithInfo = document.getElementById('talking-with-info');
        talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
        callUser(socketId);
    });

    return userContainer;
}

function unselectUsersFromList() {
    const alreadySelectedUser = document.querySelectorAll(
        '.active-user.active-user--selected'
    );

    alreadySelectedUser.forEach(el => {
        el.setAttribute('class', 'active-user');
    });
}

async function callUser(socketId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    socket.emit(`call-user-${codeRoom}`, {
        offer,
        to: socketId
    });
}

// Socket
// socket.on(`add-users-${codeRoom}`, ({ users }) => {
//     console.log(users);
//     updateUserList(users);
// });

// socket.on(`call-made-${codeRoom}`, async data => {
//     console.log(data);
//     if (getCalled) {
//         const confirmed = confirm(
//             `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
//         );

//         if (!confirmed) {
//             socket.emit(`reject-call-${codeRoom}`, {
//                 from: data.socket
//             });

//             return;
//         }
//     }
//     console.log(data);

//     await peerConnection.setRemoteDescription(
//         new RTCSessionDescription(data.offer)
//     );
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

//     socket.emit(`make-answer-${codeRoom}`, {
//         answer,
//         to: data.socket
//     });
//     getCalled = true;
// });

// socket.on(`answer-made-${codeRoom}`, async data => {
//     await peerConnection.setRemoteDescription(
//         new RTCSessionDescription(data.answer)
//     );

//     if (!isAlreadyCalling) {
//         callUser(data.socket);
//         isAlreadyCalling = true;
//     }
// });

// socket.on(`call-rejected-${codeRoom}`, data => {
//     alert(`User: "Socket: ${data.socket}" rejected your call.`);
//     unselectUsersFromList();
// });

peerConnection.ontrack = function ({ streams: [stream] }) {
    const remoteVideo = document.getElementById('remote-video');
    if (remoteVideo) {
        remoteVideo.srcObject = stream;
    }
};


navigator.getUserMedia({ video: true, audio: true },
    stream => {
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    },
    error => handleError(err)
);
