import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAe8Rwy_oOq8F4pLharn_cfj2gQc3RLTEg",
  authDomain: "mon-acupunctrice-hub.firebaseapp.com",
  projectId: "mon-acupunctrice-hub",
  storageBucket: "mon-acupunctrice-hub.firebasestorage.app",
  messagingSenderId: "431888629563",
  appId: "1:431888629563:web:f129e44615e5194faf411e"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const IDEAS = [
  { title: "L'acupuncture, ça fait-tu mal?", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok","youtube"], notes: "Mythe #1 — accroche forte, sujet viral" },
  { title: "L'acupuncture c'est juste pour la douleur — FAUX", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok"], notes: "Série mythes vs réalités" },
  { title: "Est-ce que les aiguilles sont réutilisées?", category: "acupuncture-pour-tous", platforms: ["instagram"], notes: "FAQ hygiène et confiance" },
  { title: "Combien de séances avant de voir des résultats?", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok"], notes: "Question très fréquente" },
  { title: "C'est quoi le Qi? — version simple", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok","youtube"], notes: "Concept fondamental" },
  { title: "La langue en acupuncture — on regarde vraiment ça!", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok"], notes: "Accroche forte, surprenant" },
  { title: "Pourquoi on prend le pouls des deux côtés?", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok"], notes: "" },
  { title: "Une journée dans ma clinique", category: "acupuncture-pour-tous", platforms: ["instagram","tiktok"], notes: "Behind the scenes" },
  { title: "Pourquoi j'ai choisi l'acupuncture comme carrière", category: "acupuncture-pour-tous", platforms: ["instagram","youtube"], notes: "Storytelling" },
  { title: "L'acupuncture sociale — accessible à tous", category: "acupuncture-pour-tous", platforms: ["instagram","facebook"], notes: "Article blog mars 2025" },
  { title: "Nausées de grossesse — 3 solutions naturelles", category: "grossesse", platforms: ["instagram","tiktok","youtube"], notes: "Article blog jan. 2026" },
  { title: "Bébé en siège à 36 semaines? On peut agir", category: "grossesse", platforms: ["instagram","tiktok"], notes: "Article blog jan. 2025" },
  { title: "Préparer son accouchement naturellement", category: "grossesse", platforms: ["instagram","tiktok"], notes: "Article blog jan. 2025" },
  { title: "Douleurs lombaires pendant la grossesse", category: "grossesse", platforms: ["instagram","tiktok"], notes: "" },
  { title: "Anxiété pendant la grossesse — une approche douce", category: "grossesse", platforms: ["instagram","tiktok"], notes: "" },
  { title: "Les trimestres en acupuncture — ce qu'on traite à chaque étape", category: "grossesse", platforms: ["instagram","youtube"], notes: "Format éducatif" },
  { title: "Préparer son corps à la conception", category: "fertilité", platforms: ["instagram","tiktok","youtube"], notes: "Article blog mars 2025" },
  { title: "Acupuncture et FIV — est-ce que ça aide vraiment?", category: "fertilité", platforms: ["instagram","tiktok","youtube"], notes: "Très recherché" },
  { title: "Préparer son corps 3 mois avant de concevoir", category: "fertilité", platforms: ["instagram","tiktok"], notes: "" },
  { title: "Acupuncture pour les cycles irréguliers", category: "fertilité", platforms: ["instagram"], notes: "" },
  { title: "Ce que la MTC dit sur la fertilité masculine", category: "fertilité", platforms: ["instagram","youtube"], notes: "Angle peu couvert" },
  { title: "Fatigue post-natale — t'es pas obligée d'endurer", category: "post-partum", platforms: ["instagram","tiktok","youtube"], notes: "Article blog mai 2025" },
  { title: "Baby blues et post-partum — ce que l'acupuncture peut faire", category: "post-partum", platforms: ["instagram","facebook"], notes: "Article blog avr. 2025" },
  { title: "La période des 40 jours en MTC — c'est quoi?", category: "post-partum", platforms: ["instagram","tiktok","youtube"], notes: "Concept MTC différenciant" },
  { title: "Allaitement difficile — l'acupuncture peut aider?", category: "post-partum", platforms: ["instagram","tiktok"], notes: "" },
  { title: "Récupérer après une césarienne", category: "post-partum", platforms: ["instagram"], notes: "" },
  { title: "Coliques du nourrisson — l'acupuncture peut aider", category: "enfant", platforms: ["instagram","tiktok"], notes: "Article blog juil. 2025" },
  { title: "Stress et anxiété chez l'enfant", category: "enfant", platforms: ["instagram","tiktok"], notes: "Article blog juin 2025" },
  { title: "Soulager son enfant sans médicaments", category: "enfant", platforms: ["instagram"], notes: "Article blog avr. 2025" },
  { title: "À quel âge peut-on amener son enfant en acupuncture?", category: "enfant", platforms: ["instagram","tiktok"], notes: "FAQ clinique" },
  { title: "Acupuncture sans aiguilles pour les bébés", category: "enfant", platforms: ["instagram","tiktok","youtube"], notes: "Très rassurant pour les parents" },
  { title: "L'eczéma chez l'enfant et la MTC", category: "enfant", platforms: ["instagram"], notes: "" },
  { title: "Acupuncture et système immunitaire", category: "santé-générale", platforms: ["instagram","facebook"], notes: "Article blog oct. 2025" },
  { title: "Préparer son immunité pour l'automne", category: "santé-générale", platforms: ["instagram","facebook"], notes: "Saisonnier — automne" },
  { title: "Allergies saisonnières et acupuncture", category: "santé-générale", platforms: ["instagram","tiktok"], notes: "Saisonnier — printemps" },
  { title: "Blues hivernal et énergie — ce que l'acupuncture peut faire", category: "santé-générale", platforms: ["instagram"], notes: "Saisonnier — hiver" },
  { title: "Détox de printemps selon la MTC", category: "santé-générale", platforms: ["instagram","tiktok"], notes: "Saisonnier — très populaire" },
]

async function seed() {
  console.log('Seeding ' + IDEAS.length + ' idées...')
  let count = 0
  for (const idea of IDEAS) {
    await addDoc(collection(db, 'content_items'), {
      ...idea,
      status: 'idée',
      scheduledDate: null,
      blogPostUrl: '',
      caption: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    count++
    process.stdout.write('\r' + count + '/' + IDEAS.length)
  }
  console.log('\nSeed terminé — ' + count + ' idées ajoutées!')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
