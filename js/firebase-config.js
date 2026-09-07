/* SIRATKIDS — Firebase initialization
   Compat SDK (firebase-app/auth/firestore-compat) loaded via <script> tags
   in each page's <head> before this file. No build tools required. */
(function () {
    "use strict";

    if (window.__fbApp) { return; }

    var FIREBASE_CONFIG = {
        apiKey: "AIzaSyA_WwoyNrtbjl4vSgVRPr9Ao73pHDyQG6w",
        authDomain: "siratkids-25743.firebaseapp.com",
        projectId: "siratkids-25743",
        storageBucket: "siratkids-25743.firebasestorage.app",
        messagingSenderId: "295523483558",
        appId: "1:295523483558:web:e1f7fda7f8bcf34e841967"
    };

    try {
        /* firebase global is provided by firebase-app-compat.js */
        var app = firebase.initializeApp(FIREBASE_CONFIG);
        window.__fbApp = app;
        window.__fbAuth = firebase.auth(app);
        window.__fbDB = firebase.firestore(app);
        try { window.__fbDB.settings({ merge: true }); } catch (e) {}
    } catch (e) {
        window.__fbApp = null;
        window.__fbAuth = null;
        window.__fbDB = null;
        window.__fbInitError = e;
    }
})();