// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const formCategoria = document.getElementById('form-categoria');
    const formCandidato = document.getElementById('form-candidato');
    const listaCategorias = document.getElementById('lista-categorias');
    const selectCategoria = document.getElementById('select-categoria');
    const listaCandidatos = document.getElementById('lista-candidatos');

    // Carregar Categorias em Tempo Real
    db.collection("categorias").orderBy("criadoEm").onSnapshot((snapshot) => {
        listaCategorias.innerHTML = '';
        selectCategoria.innerHTML = '<option value="" disabled selected>Escolha uma categoria primeiro...</option>';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Adicionar na lista visual
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${data.titulo} (${data.digitos} dígitos)</span>
                <button class="btn-delete" onclick="deletarCategoria('${doc.id}')">Excluir</button>
            `;
            listaCategorias.appendChild(li);

            // Adicionar no select do formulário de candidatos
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = data.titulo;
            selectCategoria.appendChild(option);
        });
    });

    // Adicionar Nova Categoria
    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('titulo-categoria').value;
        const digitos = parseInt(document.getElementById('digitos-categoria').value);

        try {
            await db.collection("categorias").add({
                titulo: titulo,
                digitos: digitos,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            formCategoria.reset();
            alert("Categoria salva com sucesso!");
        } catch (error) {
            console.error("Erro ao adicionar categoria: ", error);
            alert("Erro ao salvar. Verifique o console.");
        }
    });

    // Carregar Candidatos em Tempo Real
    db.collection("candidatos").orderBy("criadoEm").onSnapshot((snapshot) => {
        listaCandidatos.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${data.numero}</strong> - ${data.nome} (${data.partido})</span>
                <button class="btn-delete" onclick="deletarCandidato('${doc.id}')">Excluir</button>
            `;
            listaCandidatos.appendChild(li);
        });
    });

    // Adicionar Novo Candidato
    formCandidato.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoriaId = selectCategoria.value;
        const numero = document.getElementById('numero-candidato').value;
        const nome = document.getElementById('nome-candidato').value;
        const departamento = document.getElementById('departamento-candidato').value;
        const imagem = document.getElementById('imagem-candidato').value;

        if (!categoriaId) {
            alert("Selecione uma categoria!");
            return;
        }

        try {
            await db.collection("candidatos").add({
                categoriaId: categoriaId,
                numero: numero,
                nome: nome,
                partido: departamento || "Sem Equipe",
                fotos: [
                    { url: imagem, legenda: "Candidato", small: false }
                ],
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            formCandidato.reset();
            alert("Candidato salvo com sucesso!");
        } catch (error) {
            console.error("Erro ao adicionar candidato: ", error);
            alert("Erro ao salvar. Verifique o console.");
        }
    });
});

// Funções Globais de Exclusão
window.deletarCategoria = async (id) => {
    if(confirm("Tem certeza que deseja excluir esta categoria?")) {
        await db.collection("categorias").doc(id).delete();
    }
};

window.deletarCandidato = async (id) => {
    if(confirm("Tem certeza que deseja excluir este candidato/projeto?")) {
        await db.collection("candidatos").doc(id).delete();
    }
};
