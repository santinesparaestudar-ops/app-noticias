# App de Notícias — Custo Zero

Agregador de notícias (RSS) com push notification, hospedado 100% em planos gratuitos:
**Firebase (Spark, sem cartão)** para site + banco + notificações, **GitHub Actions** (grátis) como robô que busca notícias a cada 30 min.

Nenhum servidor pago, nenhuma Cloud Function (que exigiria plano Blaze) — toda a lógica de "backend" roda dentro do GitHub Actions usando a Admin SDK do Firebase.

## Estrutura

```
app-noticias/
  public/                    -> site (Firebase Hosting)
    index.html, style.css, app.js
    firebase-config.js       -> credenciais do Firebase (cole aqui)
    firebase-config-sw.js    -> MESMAS credenciais, versão p/ service worker
    firebase-messaging-sw.js -> recebe notificações em segundo plano
    manifest.json            -> deixa o site instalável (PWA)
    icons/                   -> você precisa adicionar icon-192.png e icon-512.png
  robo/
    buscar-noticias.js       -> lê os RSS, salva no Firestore, dispara push
  .github/workflows/buscar-noticias.yml  -> agenda o robô de 30 em 30 min
  firestore.rules
  firebase.json / .firebaserc
```

## Passo a passo (faça nesta ordem)

### 1. Criar o projeto Firebase
1. Acesse https://console.firebase.google.com → **Criar projeto** → escolha um nome → pode desativar o Google Analytics (opcional).
2. Confirme que o plano é **Spark (gratuito)** — não peça upgrade para Blaze, não é necessário.

### 2. Ativar os produtos que vamos usar
No menu lateral do console:
- **Firestore Database** → Criar banco de dados → modo produção → escolha uma região (ex: `southamerica-east1`).
- **Cloud Messaging** → não precisa "ativar" nada, mas anote a aba **"Configuração da Web"**.

### 3. Registrar o app Web e pegar as credenciais
1. Configurações do projeto (engrenagem) → aba **Geral** → "Seus apps" → ícone `</>` (Web) → dê um nome e registre.
2. Copie o objeto `firebaseConfig` mostrado e cole em **dois arquivos**:
   - [public/firebase-config.js](public/firebase-config.js) (dentro de `export const firebaseConfig = {...}`)
   - [public/firebase-config-sw.js](public/firebase-config-sw.js) (dentro de `self.firebaseConfig = {...}`)

### 4. Gerar a VAPID key (necessária para push no navegador)
1. Configurações do projeto → **Cloud Messaging** → aba **"Configuração da Web"** → "Certificados push da Web" → **Gerar par de chaves**.
2. Copie a chave e cole em `vapidKey` no [public/firebase-config.js](public/firebase-config.js).

### 5. Gerar a chave de serviço (para o robô no GitHub Actions)
1. Configurações do projeto → aba **Contas de serviço** → **Gerar nova chave privada** → baixa um `.json`.
2. **Não coloque esse arquivo dentro da pasta do projeto nem no Git.** Vamos colar o conteúdo dele direto num "Secret" do GitHub no passo 7.

### 6. Ajustar o `.firebaserc` e publicar o site
```powershell
npm install -g firebase-tools
firebase login
```
Edite [.firebaserc](.firebaserc) e troque `SEU-PROJECT-ID-AQUI` pelo ID real do seu projeto (aparece nas Configurações do projeto).

Adicione os ícones em `public/icons/icon-192.png` e `public/icons/icon-512.png` (qualquer gerador de favicon/ícone PWA grátis, ex: realfavicongenerator.net, serve).

Depois, dentro da pasta `app-noticias`:
```powershell
firebase deploy --only hosting,firestore:rules
```
Isso publica o site e sobe as regras do Firestore. Vai te dar uma URL tipo `https://SEU-PROJETO.web.app` — já dá pra testar (mas ainda sem notícias, porque o robô não rodou).

### 7. Subir o projeto no GitHub e configurar o robô
1. Crie um repositório no GitHub e suba esta pasta (`git init`, `git add`, `git commit`, `git push`).
2. No repositório → **Settings → Secrets and variables → Actions → New repository secret**:
   - Nome: `FIREBASE_SERVICE_ACCOUNT`
   - Valor: cole o **conteúdo inteiro** do `.json` baixado no passo 5.
3. Vá em **Actions** → habilite os workflows (se pedir) → rode manualmente o workflow **"Buscar Notícias"** clicando em **Run workflow** (não precisa esperar os 30 min na primeira vez).

Depois disso ele roda sozinho a cada 30 minutos, para sempre, de graça.

### 8. Testar
1. Abra a URL do site (`https://SEU-PROJETO.web.app`) — as notícias devem aparecer depois do robô rodar.
2. Clique em **"Ativar notificações"**, aceite a permissão do navegador.
3. Rode o workflow manualmente de novo (ou espere alguma notícia nova sair) para ver o push chegar.

## Adicionar/remover fontes de notícia

Edite a lista `FEEDS` em [robo/buscar-noticias.js](robo/buscar-noticias.js). Use sempre feeds RSS **oficiais** dos veículos — o app só guarda título, resumo e link, e todo card leva à matéria original na fonte (nunca copiamos o texto completo).

## Por que isso é realmente custo zero

| Serviço | Limite grátis | Uso deste app |
|---|---|---|
| Firestore | 50 mil leituras / 20 mil escritas por dia | Bem abaixo disso num app pequeno/médio |
| Firebase Hosting | 10 GB armazenamento, 360 MB/dia de tráfego | Site estático leve |
| Firebase Cloud Messaging | Ilimitado | Push notifications |
| GitHub Actions | 2.000 min/mês (repo privado) ou ilimitado (repo público) | ~48 execuções/dia × poucos segundos cada |

Nenhum desses exige cartão de crédito cadastrado. Se o app crescer muito além disso, aí sim vale revisar — mas para um MVP está longe do limite.
