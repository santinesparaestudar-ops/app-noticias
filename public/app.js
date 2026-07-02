import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, limit, onSnapshot,
  doc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";
import { firebaseConfig, vapidKey } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lista = document.getElementById('lista-noticias');
const btnNotificar = document.getElementById('btn-notificar');

function formatarData(timestamp) {
  if (!timestamp) return '';
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderizar(noticias) {
  if (noticias.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhuma notícia ainda. O robô roda a cada 30 min.</p>';
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

const q = query(collection(db, 'noticias'), orderBy('publicadoEm', 'desc'), limit(30));
onSnapshot(q, snap => {
  const noticias = snap.docs.map(d => d.data());
  renderizar(noticias);
}, err => {
  console.error('Erro ao carregar notícias:', err);
  lista.innerHTML = '<p class="carregando">Erro ao carregar. Confira o firebase-config.js.</p>';
});

async function ativarNotificacoes() {
  try {
    if (!(await isSupported())) {
      alert('Este navegador não suporta notificações push.');
      return;
    }
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') {
      alert('Permissão negada. Você pode reativar nas configurações do navegador.');
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (!token) {
      alert('Não foi possível gerar o token de notificação.');
      return;
    }

    await setDoc(doc(db, 'push_tokens', token), {
      inscrito: false,
      criadoEm: serverTimestamp(),
    });

    onMessage(messaging, payload => {
      new Notification(payload.notification.title, { body: payload.notification.body });
    });

    btnNotificar.textContent = 'Notificações ativadas ✓';
    btnNotificar.disabled = true;
  } catch (err) {
    console.error('Erro ao ativar notificações:', err);
    alert('Erro ao ativar notificações. Veja o console do navegador.');
  }
}

btnNotificar.addEventListener('click', ativarNotificacoes);
