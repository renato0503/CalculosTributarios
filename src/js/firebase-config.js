import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDfbNOxMUV-zcfgjCizK-AvuGg0-ZuLx8s",
    authDomain: "calculostributarios-2d484.firebaseapp.com",
    projectId: "calculostributarios-2d484",
    storageBucket: "calculostributarios-2d484.firebasestorage.app",
    messagingSenderId: "673649444272",
    appId: "1:673649444272:web:7e503a56b6214095840275",
    measurementId: "G-WLPW1XS1DY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig };