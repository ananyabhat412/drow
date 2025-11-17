const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const beep = document.getElementById("beep");

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

function playBeep() {
    beep.play();
}

// EAR function for JS
function eye_aspect_ratio(landmarks, eye) {
    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    const A = dist(landmarks[eye[1]], landmarks[eye[5]]);
    const B = dist(landmarks[eye[2]], landmarks[eye[4]]);
    const C = dist(landmarks[eye[0]], landmarks[eye[3]]);
    
    return (A + B) / (2.0 * C);
}

// MAIN DETECTION
function onResults(res) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);

    if (!res.multiFaceLandmarks) {
        document.getElementById("status").innerText = "Status: No Face";
        return;
    }

    const lm = res.multiFaceLandmarks[0];

    const leftEAR = eye_aspect_ratio(lm, LEFT_EYE);
    const rightEAR = eye_aspect_ratio(lm, RIGHT_EYE);
    const EAR = (leftEAR + rightEAR) / 2;

    document.getElementById("ear").innerText = "EAR: " + EAR.toFixed(3);

    if (EAR < 0.21) {
        document.getElementById("status").innerText = "Status: 🚨 Drowsy!";
        playBeep();
    } else {
        document.getElementById("status").innerText = "Status: Awake 😃";
    }
}

// Mediapipe setup
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

// Use webcam
const cam = new Camera(video, {
    onFrame: async () => {
        await faceMesh.send({ image: video });
    },
    width: 700,
    height: 500
});

cam.start();
