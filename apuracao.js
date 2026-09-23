document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('apuracao-container');
    const charts = {}; // Para guardar a referência dos gráficos e atualizar em tempo real

    try {
        // Carregar categorias
        const snapshotCategorias = await db.collection("categorias").orderBy("criadoEm").get();
        const categorias = [];
        snapshotCategorias.forEach(doc => {
            categorias.push({ id: doc.id, ...doc.data() });
        });

        if (categorias.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Nenhuma categoria cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = '';

        // Carregar candidatos agrupados por categoria
        const snapshotCandidatos = await db.collection("candidatos").get();
        const candidatosPorCategoria = {};
        snapshotCandidatos.forEach(doc => {
            const c = doc.data();
            if (!candidatosPorCategoria[c.categoriaId]) {
                candidatosPorCategoria[c.categoriaId] = [];
            }
            c.id = doc.id;
            candidatosPorCategoria[c.categoriaId].push(c);
        });

        // Criar uma seção para cada categoria
        categorias.forEach(cat => {
            const section = document.createElement('section');
            section.className = 'admin-section';
            section.style.marginBottom = '2rem';
            
            section.innerHTML = `
                <h2>Apuração: ${cat.titulo}</h2>
                <div style="position: relative; height:40vh; width:100%">
                    <canvas id="chart-${cat.id}"></canvas>
                </div>
                <div id="resumo-${cat.id}" style="margin-top: 1rem; font-weight: bold; color: var(--text-muted);">
                    Total de votos: 0
                </div>
            `;
            container.appendChild(section);

            const ctx = document.getElementById(`chart-${cat.id}`).getContext('2d');
            const candidatos = candidatosPorCategoria[cat.id] || [];
            
            // Adicionar Brancos e Nulos na contagem
            const labels = candidatos.map(c => `${c.numero} - ${c.nome}`);
            labels.push('Branco', 'Nulo');

            charts[cat.id] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Votos',
                        data: new Array(labels.length).fill(0),
                        backgroundColor: '#2563eb',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }
                    }
                }
            });

            // Guardar IDs para facilitar a atualização
            charts[cat.id].candidatosMap = candidatos.reduce((acc, c, index) => {
                acc[c.numero] = index; // Posição no gráfico pelo número
                return acc;
            }, {});
            charts[cat.id].idxBranco = labels.length - 2;
            charts[cat.id].idxNulo = labels.length - 1;
        });

        // Escutar votos em tempo real
        db.collection("votos").onSnapshot((snapshot) => {
            // Zerar os dados dos gráficos
            Object.values(charts).forEach(chart => {
                chart.data.datasets[0].data.fill(0);
                chart.totalVotos = 0;
            });

            snapshot.forEach((doc) => {
                const voto = doc.data(); // { categoriaId, numero }
                const chart = charts[voto.categoriaId];
                
                if (chart) {
                    chart.totalVotos++;
                    if (voto.numero === 'branco') {
                        chart.data.datasets[0].data[chart.idxBranco]++;
                    } else if (chart.candidatosMap[voto.numero] !== undefined) {
                        chart.data.datasets[0].data[chart.candidatosMap[voto.numero]]++;
                    } else {
                        // Nulo
                        chart.data.datasets[0].data[chart.idxNulo]++;
                    }
                }
            });

            // Atualizar gráficos e resumos
            Object.keys(charts).forEach(catId => {
                charts[catId].update();
                document.getElementById(`resumo-${catId}`).innerText = `Total de votos: ${charts[catId].totalVotos}`;
            });
        });

    } catch (error) {
        console.error("Erro ao carregar apuração", error);
        container.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar a apuração. Verifique o console.</p>';
    }
});
