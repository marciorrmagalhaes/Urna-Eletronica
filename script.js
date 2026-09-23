// script.js - Lógica Principal da Urna conectada ao Firebase
let categorias = [];
let candidatos = [];
let etapaAtual = 0;
let numeroVotado = '';
let votoBranco = false;

// Elementos da tela
let seuVotoPara = document.querySelector('.d-1-1 span');
let cargo = document.querySelector('.d-1-2 span');
let descricao = document.querySelector('.d-1-4');
let aviso = document.querySelector('.d-2');
let lateral = document.querySelector('.d-1-right');
let numeros = document.querySelector('.d-1-3');

// Configuração de Som (Arquivos MP3 Originais)
let audioTecla = new Audio('SOM/se1.mp3');
let audioConfirma = new Audio('SOM/se2.mp3');

function tocarSomTecla() {
    audioTecla.currentTime = 0; // Reinicia o áudio se já estiver tocando
    audioTecla.play().catch(e => console.log('Áudio não iniciado: ', e));
}

function tocarSomFim() {
    audioConfirma.currentTime = 0;
    audioConfirma.play().catch(e => console.log('Áudio não iniciado: ', e));
}


// Buscar dados do Firebase ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Carregar categorias
        const catSnap = await db.collection('categorias').orderBy('criadoEm').get();
        catSnap.forEach(doc => {
            categorias.push({ id: doc.id, ...doc.data() });
        });

        // Carregar candidatos
        const candSnap = await db.collection('candidatos').get();
        candSnap.forEach(doc => {
            candidatos.push({ id: doc.id, ...doc.data() });
        });

        if (categorias.length > 0) {
            comecarEtapa();
        } else {
            cargo.innerHTML = "Nenhuma categoria cadastrada";
            numeros.innerHTML = "";
            aviso.style.display = 'none';
        }
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
        cargo.innerHTML = "Erro de conexão";
    }
});

function comecarEtapa() {
    let etapa = categorias[etapaAtual];
    let numeroHtml = '';
    numeroVotado = '';
    votoBranco = false;

    for (let i = 0; i < etapa.digitos; i++) {
        if (i === 0) {
            numeroHtml += '<div class="numero pisca"></div>';
        } else {
            numeroHtml += '<div class="numero"></div>';
        }
    }

    seuVotoPara.style.display = 'none';
    cargo.innerHTML = etapa.titulo;
    descricao.innerHTML = '';
    aviso.style.display = 'none';
    lateral.innerHTML = '';
    numeros.innerHTML = numeroHtml;
}

function atualizaInterface() {
    let etapa = categorias[etapaAtual];
    
    // Busca o candidato correspondente à categoria atual e número digitado
    let candidato = candidatos.find(c => c.categoriaId === etapa.id && c.numero === numeroVotado);

    seuVotoPara.style.display = 'block';
    aviso.style.display = 'block';

    if (candidato) {
        descricao.innerHTML = `Nome: ${candidato.nome}<br/>Departamento/Equipe: ${candidato.partido}`;
        let fotosHtml = '';
        for (let i in candidato.fotos) {
            fotosHtml += `<div class="d-1-image"><img src="${candidato.fotos[i].url}" alt="" />${candidato.fotos[i].legenda}</div>`;
        }
        lateral.innerHTML = fotosHtml;
    } else {
        descricao.innerHTML = '<div class="aviso--grande pisca">VOTO NULO</div>';
    }
}

function clicou(n) {
    tocarSomTecla();
    let elNumero = document.querySelector('.numero.pisca');
    if (elNumero !== null) {
        elNumero.innerHTML = n;
        numeroVotado = `${numeroVotado}${n}`;

        elNumero.classList.remove('pisca');
        if (elNumero.nextElementSibling !== null) {
            elNumero.nextElementSibling.classList.add('pisca');
        } else {
            atualizaInterface();
        }
    }
}

function branco() {
    tocarSomTecla();
    numeroVotado = '';
    votoBranco = true;
    seuVotoPara.style.display = 'block';
    aviso.style.display = 'block';
    numeros.innerHTML = '';
    descricao.innerHTML = '<div class="aviso--grande pisca">VOTO EM BRANCO</div>';
    lateral.innerHTML = '';
}

function corrige() {
    tocarSomTecla();
    comecarEtapa();
}

async function confirma() {
    let etapa = categorias[etapaAtual];
    let votoConfirmado = false;

    if (votoBranco === true) {
        votoConfirmado = true;
        // Salvar voto em branco no Firebase
        await db.collection("votos").add({
            categoriaId: etapa.id,
            numero: 'branco',
            dataHora: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else if (numeroVotado.length === etapa.digitos) {
        votoConfirmado = true;
        // Salvar voto digitado (seja candidato válido ou nulo)
        await db.collection("votos").add({
            categoriaId: etapa.id,
            numero: numeroVotado,
            dataHora: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    if (votoConfirmado) {
        tocarSomFim();
        etapaAtual++;
        if (categorias[etapaAtual] !== undefined) {
            // Aguarda o som acabar antes de ir para o próximo
            setTimeout(() => {
                comecarEtapa();
            }, 2000);
        } else {
            document.querySelector('.tela').innerHTML = '<div class="aviso--gigante pisca">FIM</div>';
            // Voltar ao início após 4 segundos
            setTimeout(() => {
                etapaAtual = 0;
                document.querySelector('.tela').innerHTML = `
                    <div class="d-1">
                        <div class="d-1-left">
                            <div class="d-1-1"><span>SEU VOTO PARA:</span></div>
                            <div class="d-1-2"><span>Carregando...</span></div>
                            <div class="d-1-3"></div>
                            <div class="d-1-4"></div>
                        </div>
                        <div class="d-1-right"></div>
                    </div>
                    <div class="d-2"></div>
                `;
                // Recarregar referências
                seuVotoPara = document.querySelector('.d-1-1 span');
                cargo = document.querySelector('.d-1-2 span');
                descricao = document.querySelector('.d-1-4');
                aviso = document.querySelector('.d-2');
                lateral = document.querySelector('.d-1-right');
                numeros = document.querySelector('.d-1-3');
                
                comecarEtapa();
            }, 4000);
        }
    }
}
