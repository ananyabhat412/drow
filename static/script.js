const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const beep = document.getElementById("beep");
const statusLabel = document.getElementById("status");
const earLabel = document.getElementById("ear");

let lastBeepTime = 0; 
const BEEP_INTERVAL = 2000; // 2 seconds

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

function playBeep() {
    const now = Date.now();
    if (now - lastBeepTime > BEEP_INTERVAL) {
        beep.currentTime = 0;
        beep.play();
        lastBeepTime = now;
    }
}

function eye_aspect_ratio(landmarks, eye) {
    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    const A = dist(landmarks[eye[1]], landmarks[eye[5]]);
    const B = dist(landmarks[eye[2]], landmarks[eye[4]]);
    const C = dist(landmarks[eye[0]], landmarks[eye[3]]);

    return (A + B) / (2.0 * C);
}

function onResults(res) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

    if (!res.multiFaceLandmarks) {
        statusLabel.innerText = "No Face Detected";
        statusLabel.className = "status-pill drowsy";
        earLabel.innerText = "EAR: --";
        return;
    }

    const lm = res.multiFaceLandmarks[0];

    const leftEAR = eye_aspect_ratio(lm, LEFT_EYE);
    const rightEAR = eye_aspect_ratio(lm, RIGHT_EYE);
    const EAR = (leftEAR + rightEAR) / 2;

    earLabel.innerText = "EAR: " + EAR.toFixed(3);

    if (EAR < 0.21) {
        statusLabel.innerText = "🚨 Drowsy!";
        statusLabel.className = "status-pill drowsy";
        playBeep();
    } else {
        statusLabel.innerText = "Awake 😃";
        statusLabel.className = "status-pill awake";
    }
}

const faceMesh = new FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const cam = new Camera(video, {
    onFrame: async () => {
        await faceMesh.send({ image: video });
    },
    width: 720,
    height: 500
});

cam.start();
