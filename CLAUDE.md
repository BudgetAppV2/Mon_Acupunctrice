# Mon Acupunctrice Hub — CLAUDE.md

## Contexte du projet
Hub de gestion de contenu pour Judith Dufour-Savard (@Mon_acupunctrice), acupunctrice à Rosemont, Montréal. L'objectif est de professionnaliser et automatiser sa présence sur les réseaux sociaux.

## Stack technique
- **Frontend :** React + Tailwind CSS (Vite)
- **Base de données :** Firebase Firestore (`northamerica-northeast1`)
- **Stockage vidéo :** Firebase Storage
- **Cloud Functions :** Firebase Functions v2 (Node.js 20, TypeScript)
- **IA :** Claude API via Cloud Function `generateCaption`
- **Hébergement :** Render (`mon-acupunctrice-hub.onrender.com`)
- **Repo :** github.com/BudgetAppV2/Mon_Acupunctrice

## Structure du projet
```
Mon_Acupunctrice/
├── VISION.md              # Vision du projet
├── ROADMAP.md             # Roadmap des phases
├── CONTENU.md             # Banque de contenu & cadre déontologique OAQ
├── PHASE3_SETUP_META.md   # Guide setup Meta Developer (Benoit)
├── hub/                   # Frontend React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── components/
│   │   │   ├── ContentCard.jsx
│   │   │   ├── ItemPanel.jsx      # Panneau latéral (upload vidéo + captions IA)
│   │   │   └── NewContentModal.jsx
│   │   ├── hooks/
│   │   │   └── useContentItems.js  # CRUD Firestore content_items
│   │   └── pages/
│   │       ├── BlitzPage.jsx
│   │       ├── CalendarPage.jsx
│   │       └── IdeasPage.jsx
│   └── package.json
└── functions/              # Cloud Functions Firebase
    ├── src/
    │   └── index.ts        # generateCaption (deployed)
    ├── package.json
    └── tsconfig.json
```

## Modèle de données Firestore

### Collection `content_items`
```json
{
  "id": "auto",
  "title": "Titre du sujet",
  "category": "grossesse | fertilité | post-partum | enfant | acupuncture-pour-tous | santé-générale",
  "status": "idée | à-filmer | filmé | monté | prêt | publié",
  "platforms": ["instagram", "tiktok", "youtube", "facebook", "pinterest"],
  "scheduledDate": "Timestamp | null",
  "videoUrl": "Firebase Storage URL | null",
  "caption": "texte généré | null",
  "notes": "notes libres",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## État d'avancement
- Phase 1 (MVP + Blitz + Render) ✅ Complété
- Phase 2 (Upload vidéo + Captions IA) ✅ Complété
- Phase 3 (Distribution multi-plateforme) 🔨 En cours

## Firebase
- Projet : `mon-acupunctrice-hub`
- CLI auth : `barchambault@grandsballets.com` (faire `firebase login:use barchambault@grandsballets.com`)
- Secrets existants : `ANTHROPIC_API_KEY`
- Deploy : `cd functions && firebase deploy --only functions --project mon-acupunctrice-hub`

---

## Phase 3 — Distribution multi-plateforme (INSTRUCTIONS COURANTES)

### Architecture cible

```
Hub (React)
  │
  │ httpsCallable('publishToInstagram')
  ▼
Cloud Function publishToInstagram
  │
  │ 1. Récupère videoUrl de Firebase Storage
  │ 2. POST /{ig-user-id}/media (container Reels)
  │ 3. Poll container status → FINISHED
  │ 4. POST /{ig-user-id}/media_publish
  │ 5. Met à jour Firestore (publishedDates.instagram)
  ▼
Instagram Reels publié ✅
```

### Phase 3a — Cloud Function `publishToInstagram`

**Fichier :** `functions/src/instagram.ts`

**Secrets Firebase nécessaires** (Benoit les configure via PHASE3_SETUP_META.md) :
- `META_APP_ID`
- `META_APP_SECRET` 
- `META_USER_TOKEN` (long-lived, 60 jours)
- `META_IG_ACCOUNT_ID`

**Flow de publication d'un Reel Instagram via Graph API :**

1. **Créer un container Reel**
```
POST https://graph.instagram.com/v25.0/{ig-account-id}/media
  media_type=REELS
  video_url={URL publique de la vidéo}
  caption={caption text}
  access_token={long-lived-token}
→ Retourne: { id: container_id }
```

2. **Attendre que le container soit prêt** (polling)
```
GET https://graph.instagram.com/v25.0/{container_id}?fields=status_code
  → status_code: IN_PROGRESS | FINISHED | ERROR
  Polling toutes les 5 secondes, max 60 secondes
```

3. **Publier le container**
```
POST https://graph.instagram.com/v25.0/{ig-account-id}/media_publish
  creation_id={container_id}
  access_token={long-lived-token}
→ Retourne: { id: media_id }
```

4. **Mettre à jour Firestore**
```typescript
await admin.firestore().doc(`content_items/${itemId}`).update({
  'publishedDates.instagram': admin.firestore.FieldValue.serverTimestamp(),
  'instagramMediaId': mediaId,
  status: 'publié',
})
```

**IMPORTANT — URL de la vidéo :**
La vidéo est dans Firebase Storage. L'URL doit être publiquement accessible pour que Meta puisse la télécharger. Utiliser `getDownloadURL()` de Firebase Storage (les URLs avec token sont publiques).

**Signature de la Cloud Function :**
```typescript
export const publishToInstagram = onCall(
  {
    secrets: [metaUserToken, metaIgAccountId],
    timeoutSeconds: 120,  // Le polling peut prendre du temps
    memory: '256MiB',
    cors: true,
  },
  async (request) => {
    const { itemId } = request.data
    // 1. Lire l'item de Firestore
    // 2. Vérifier que videoUrl et caption existent
    // 3. Créer container → poll → publish
    // 4. Mettre à jour Firestore
    return { success: true, mediaId }
  }
)
```

### Phase 3b — UI de publication dans ItemPanel.jsx

Ajouter un bouton "📤 Publier sur Instagram" dans `ItemPanel.jsx` :
- Visible seulement si `item.status === 'prêt'` ET `item.videoUrl` ET `item.caption`
- Affiche un spinner pendant la publication
- Affiche "✅ Publié sur Instagram" avec la date après publication
- Le bouton appelle `httpsCallable(functions, 'publishToInstagram')({ itemId: item.id })`

### Règles de code
- Interface en français
- Palette douce : tons naturels, beige, vert sauge (classes Tailwind existantes : sage-*, sand-*)
- Mobile-first
- Tout le code frontend en JSX, backend en TypeScript
- Les secrets ne doivent JAMAIS être dans le code client
# Tue Mar 17 21:09:06 EDT 2026
