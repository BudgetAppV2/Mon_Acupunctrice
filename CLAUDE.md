# Mon Acupunctrice Hub — CLAUDE.md

## Contexte du projet
Hub de gestion de contenu pour Judith Dufour-Savard (@Mon_acupunctrice), acupunctrice à Rosemont, Montréal.

## Stack technique
- **Frontend :** React + Tailwind CSS (Vite)
- **Base de données :** Firebase Firestore
- **Hébergement :** Render (comme judith-factures.onrender.com)
- **IA :** Claude API (génération de captions — Phase 2)

## Structure du projet
```
hub/
  src/
    components/
      Calendar/        — Vue calendrier mensuelle
      ContentCard/     — Carte de contenu (sujet, statut, plateforme)
      IdeaBank/        — Banque d'idées non planifiées
    pages/
      CalendarPage.jsx
      IdeasPage.jsx
    firebase.js        — Config Firebase
    App.jsx
  public/
  index.html
```

## Modèle de données Firestore

### Collection `content_items`
```json
{
  "id": "auto",
  "title": "Titre du sujet",
  "category": "grossesse | fertilité | post-partum | enfant | acupuncture-pour-tous | santé-générale",
  "status": "idée | à-filmer | filmé | monté | schedulé | publié",
  "platforms": ["instagram", "tiktok", "youtube", "facebook", "pinterest"],
  "scheduledDate": "2026-04-15",
  "blogPostUrl": "https://acupuncturejudith.ca/post/...",
  "caption": "...",
  "notes": "...",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Règles importantes
- Interface en français
- Palette de couleurs douce (tons naturels, beige, vert sauge) — cohérent avec la marque de Judith
- Mobile-friendly (Judith utilisera sur téléphone aussi)
- Statuts codés par couleur dans le calendrier
