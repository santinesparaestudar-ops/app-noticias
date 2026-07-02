const admin = require('firebase-admin');
const Parser = require('rss-parser');
const crypto = require('crypto');

// Adicione ou remova fontes aqui. Use só feeds RSS oficiais.
const FEEDS = [
  { nome: 'G1', url: 'https://g1.globo.com/rss/g1/' },
  { nome: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss.xml' },
  { nome: 'BBC Brasil', url: 'https://feeds.bbci.co.uk/portuguese/rss.xml' },
  { nome: 'CNN Brasil', url: 'https://www.cnnbrasil.com.br/feed/' },
];

// Quantos títulos aparecem no corpo da notificação (não limita quantas notícias são salvas).
const MAX_TITULOS_NA_NOTIFICACAO = 5;

function idParaLink(link) {
  return crypto.createHash('sha1').update(link).digest('hex');
}

function ehErroJaExiste(err) {
  return err.code === 6 || /ALREADY_EXISTS/i.test(err.message || '');
}

async function main() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();
  const parser = new Parser();

  const novas = [];

  for (const feed of FEEDS) {
    let resultado;
    try {
      resultado = await parser.parseURL(feed.url);
    } catch (err) {
      console.error(`Falha ao ler feed ${feed.nome}:`, err.message);
      continue;
    }

    for (const item of resultado.items) {
      const link = item.link;
      if (!link) continue;
      const ref = db.collection('noticias').doc(idParaLink(link));

      try {
        await ref.create({
          titulo: item.title || '(sem título)',
          resumo: (item.contentSnippet || item.summary || '').slice(0, 300),
          link,
          imagem: item.enclosure?.url || null,
          fonte: feed.nome,
          publicadoEm: item.isoDate ? new Date(item.isoDate) : admin.firestore.FieldValue.serverTimestamp(),
          criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        });
        novas.push({ titulo: item.title });
      } catch (err) {
        if (!ehErroJaExiste(err)) {
          console.error(`Erro ao salvar "${item.title}":`, err.message);
        }
      }
    }
  }

  console.log(`${novas.length} notícia(s) nova(s) encontrada(s).`);

  await inscreverTokensPendentes(db);

  if (novas.length > 0) {
    await enviarNotificacao(novas);
  }
}

async function inscreverTokensPendentes(db) {
  const snap = await db.collection('push_tokens').where('inscrito', '==', false).get();
  if (snap.empty) return;

  const tokens = snap.docs.map(d => d.id);
  await admin.messaging().subscribeToTopic(tokens, 'noticias');

  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { inscrito: true }));
  await batch.commit();

  console.log(`${tokens.length} novo(s) dispositivo(s) inscrito(s) para notificações.`);
}

async function enviarNotificacao(novas) {
  const destaques = novas.slice(0, MAX_TITULOS_NA_NOTIFICACAO);
  const titulo = novas.length === 1 ? 'Nova notícia' : `${novas.length} novas notícias`;
  const corpo = destaques.map(n => `• ${n.titulo}`).join('\n');

  await admin.messaging().send({
    topic: 'noticias',
    notification: { title: titulo, body: corpo },
    webpush: { fcmOptions: { link: '/' } },
  });

  console.log('Notificação push enviada.');
}

main().catch(err => {
  console.error('Erro fatal no robô:', err);
  process.exit(1);
});
