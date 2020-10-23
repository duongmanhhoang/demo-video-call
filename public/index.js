const socket = io.connect(window.origin);

let answersFrom = {}, offer;

const peerConnection = window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.msRTCPeerConnection;
// console.log(navigator.mediaDevices.getUserMedia({ video: true }).then(data => {
//     console.log(data);
// })
//     .catch(err => {
//         console.log(err, 99);
//     }));

const sessionDescription = window.RTCSessionDescription ||
    window.mozRTCSessionDescription ||
    window.webkitRTCSessionDescription ||
    window.msRTCSessionDescription;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

const pc = new peerConnection({
    iceServers: [{
        url: "stun:stun.services.mozilla.com",
        username: "somename",
        credential: "somecredentials"
    }]
});

pc.onaddstream = function (obj) {
    const vid = document.createElement('video');
    vid.setAttribute('class', 'video-small');
    vid.setAttribute('autoplay', 'autoplay');
    vid.setAttribute('id', 'video-small');
    vid.setAttribute('id', 'vid-mock');
    vid.setAttribute("src", 'https://woolyss.com/f/spring-vp9-vorbis.webm');
    vid.setAttribute("crossorigin", "anonymous");
    vid.setAttribute("controls", "");
    document.getElementById('users-container').appendChild(vid);
    vid.srcObject = obj.stream;
}

console.log(pc);

socket.on('offer-made', function (data) {
    offer = data.offer;

    pc.setRemoteDescription(new sessionDescription(data.offer), function () {
        pc.createAnswer(function (answer) {
            pc.setLocalDescription(new sessionDescription(answer), function () {
                console.log('MAKE ANSWER');
                socket.emit('make-answer', {
                    answer: answer,
                    to: data.socket
                });
            }, error);
        }, error);
    }, error);

});

socket.on('answer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.answer), function () {
        document.getElementById(data.socket).setAttribute('class', 'active');
        if (!answersFrom[data.socket]) {
            createOffer(data.socket);
            answersFrom[data.socket] = true;
        }
    }, error);
});

navigator.getUserMedia({ video: true, audio: true }, function (stream) {
    var video = document.querySelector('video');
    video.srcObject = stream;
    pc.addStream(stream);
}, error);

socket.on('remove-user', function (id) {
    const div = document.getElementById(id);
    document.getElementById('users').removeChild(div);
});

function createOffer(id) {
    pc.createOffer(function (offer) {
        pc.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit('make-offer', {
                offer: offer,
                to: id
            });
        }, error);
    }, error);
}

function error(err) {
    console.error('Error', err);
}
