// Login con la misma cuenta de la intranet (proyecto Firebase "intranatstone").
// Esta configuración es pública por diseño: va en el navegador, igual que en la intranet.
// La seguridad la pone el Apps Script, que verifica cada token con Google.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA00y8ajl1ccpRwo8dRjmEbAj5rw1bT9DY",
  authDomain: "intranatstone.firebaseapp.com",
  projectId: "intranatstone",
  storageBucket: "intranatstone.appspot.com",
  messagingSenderId: "605932277231",
  appId: "1:605932277231:web:c6dfd6fb7a5869e413fa1a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
