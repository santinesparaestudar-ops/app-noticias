// Dados de exemplo só para visualizar o layout — não usa Firebase.
// Assim que o Firebase real estiver configurado, use index.html + app.js.
const NOTICIAS_DEMO = [
  {
    titulo: 'Governo anuncia novo pacote de investimentos em infraestrutura',
    resumo: 'Medida prevê recursos para rodovias, saneamento e energia em todo o país, com previsão de início das obras ainda este ano.',
    link: 'https://g1.globo.com',
    imagem: 'https://picsum.photos/seed/noticia1/640/360',
    fonte: 'G1',
    publicadoEm: new Date(Date.now() - 1000 * 60 * 12),
  },
  {
    titulo: 'Seleção brasileira divulga convocados para as próximas partidas',
    resumo: 'Técnico aposta em jovens promessas e mantém base de jogadores que disputaram a última competição continental.',
    link: 'https://cnnbrasil.com.br',
    imagem: 'https://picsum.photos/seed/noticia2/640/360',
    fonte: 'CNN Brasil',
    publicadoEm: new Date(Date.now() - 1000 * 60 * 47),
  },
  {
    titulo: 'Pesquisa aponta avanço da vacinação infantil em todas as regiões',
    resumo: 'Dados do Ministério da Saúde mostram recuperação da cobertura vacinal após anos de queda registrados na pandemia.',
    link: 'https://agenciabrasil.ebc.com.br',
    imagem: 'https://picsum.photos/seed/noticia3/640/360',
    fonte: 'Agência Brasil',
    publicadoEm: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    titulo: 'Bolsas internacionais fecham em alta após dados de inflação',
    resumo: 'Mercados reagiram positivamente a indicadores que ficaram abaixo do esperado por analistas nos Estados Unidos e na Europa.',
    link: 'https://bbc.com/portuguese',
    imagem: 'https://picsum.photos/seed/noticia4/640/360',
    fonte: 'BBC Brasil',
    publicadoEm: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    titulo: 'Cientistas brasileiros identificam nova espécie na Amazônia',
    resumo: 'Descoberta foi feita durante expedição em área de floresta preservada e já foi registrada em publicação internacional.',
    link: 'https://g1.globo.com',
    imagem: 'https://picsum.photos/seed/noticia5/640/360',
    fonte: 'G1',
    publicadoEm: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

const lista = document.getElementById('lista-noticias');
const btnNotificar = document.getElementById('btn-notificar');

function formatarData(data) {
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderizar(noticias) {
  if (noticias.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhuma notícia ainda.</p>';
    return;
  }
  lista.innerHTML = noticias.map(n => `
    <article class="card">
      ${n.imagem ? `<img src="${n.imagem}" alt="" loading="lazy">` : ''}
      <div class="conteudo">
        <span class="fonte">${n.fonte}</span>
        <h2>${n.titulo}</h2>
        <p>${n.resumo || ''}</p>
        <div class="rodape">
          <span class="data">${formatarData(n.publicadoEm)}</span>
          <a href="${n.link}" target="_blank" rel="noopener noreferrer">Leia a matéria completa →</a>
        </div>
      </div>
    </article>
  `).join('');
}

setTimeout(() => renderizar(NOTICIAS_DEMO), 400);

btnNotificar.addEventListener('click', () => {
  alert('Isso é a demo — para notificações reais, primeiro configure o Firebase (veja o README.md).');
});
