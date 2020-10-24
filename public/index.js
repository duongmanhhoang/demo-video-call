// const socket = io.connect(window.origin);

// let answersFrom = {}, offer;

// const peerConnection = window.RTCPeerConnection ||
//     window.mozRTCPeerConnection ||
//     window.webkitRTCPeerConnection ||
//     window.msRTCPeerConnection;
// // console.log(navigator.mediaDevices.getUserMedia({ video: true }).then(data => {
// //     console.log(data);
// // })
// //     .catch(err => {
// //         console.log(err, 99);
// //     }));

// const sessionDescription = window.RTCSessionDescription ||
//     window.mozRTCSessionDescription ||
//     window.webkitRTCSessionDescription ||
//     window.msRTCSessionDescription;

// navigator.getUserMedia = navigator.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia ||
//     navigator.msGetUserMedia;

// const pc = new peerConnection({
//     iceServers: [{
//         url: "stun:stun.services.mozilla.com",
//         username: "somename",
//         credential: "somecredentials"
//     }]
// });

// pc.onaddstream = function (obj) {
//     const vid = document.createElement('video');
//     vid.setAttribute('class', 'video-small');
//     vid.setAttribute('autoplay', 'autoplay');
//     vid.setAttribute('id', 'video-small');
//     vid.setAttribute('id', 'vid-mock');
//     vid.setAttribute("src", 'https://woolyss.com/f/spring-vp9-vorbis.webm');
//     vid.setAttribute("crossorigin", "anonymous");
//     vid.setAttribute("controls", "");
//     document.getElementById('users-container').appendChild(vid);
//     vid.srcObject = obj.stream;
// }

// socket.on('offer-made', function (data) {
//     offer = data.offer;

//     pc.setRemoteDescription(new sessionDescription(data.offer), function () {
//         pc.createAnswer(function (answer) {
//             pc.setLocalDescription(new sessionDescription(answer), function () {
//                 console.log('MAKE ANSWER');
//                 socket.emit('make-answer', {
//                     answer: answer,
//                     to: data.socket
//                 });
//             }, error);
//         }, error);
//     }, error);

// });

// socket.on('answer-made', function (data) {
//     pc.setRemoteDescription(new sessionDescription(data.answer), function () {
//         document.getElementById(data.socket).setAttribute('class', 'active');
//         if (!answersFrom[data.socket]) {
//             createOffer(data.socket);
//             answersFrom[data.socket] = true;
//         }
//     }, error);
// });

// navigator.getUserMedia({ video: true, audio: true }, function (stream) {
//     var video = document.querySelector('video');
//     video.srcObject = stream;
//     pc.addStream(stream);
// }, error);

// socket.on('remove-user', function (id) {
//     const div = document.getElementById(id);
//     document.getElementById('users').removeChild(div);
// });

// function createOffer(id) {
//     pc.createOffer(function (offer) {
//         pc.setLocalDescription(new sessionDescription(offer), function () {
//             socket.emit('make-offer', {
//                 offer: offer,
//                 to: id
//             });
//         }, error);
//     }, error);
// }

// function error(err) {
//     console.error('Error', err);
// }

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

    socket.emit('call-user', {
        offer,
        to: socketId
    });
}

// Socket
socket.on('add-users', ({ users }) => {
    updateUserList(users);
});

socket.on('call-made', async data => {
    console.log(data);
    if (getCalled) {
        const confirmed = confirm(
            `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
        );

        if (!confirmed) {
            socket.emit('reject-call', {
                from: data.socket
            });

            return;
        }
    }
    console.log(data);

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

    socket.emit('make-answer', {
        answer,
        to: data.socket
    });
    getCalled = true;
});

socket.on('answer-made', async data => {
    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
    );

    if (!isAlreadyCalling) {
        callUser(data.socket);
        isAlreadyCalling = true;
    }
});

socket.on('call-rejected', data => {
    alert(`User: "Socket: ${data.socket}" rejected your call.`);
    unselectUsersFromList();
});

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
