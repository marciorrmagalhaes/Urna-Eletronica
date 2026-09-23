// Configuração do Firebase
// Substitua as chaves abaixo pelas chaves do seu projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCvHQiF8AgYvk8Sz1sPWPAinSfpjaWnqg4",
    authDomain: "urna-eletronica-19dc7.firebaseapp.com",
    projectId: "urna-eletronica-19dc7"
};

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
