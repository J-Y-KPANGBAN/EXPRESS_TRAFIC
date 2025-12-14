// faqData.js
export const categories = {
  all: "Toutes les questions",
  reservation: "Réservation",
  payment: "Paiement",
  baggage: "Bagages",
  trip: "Trajet & Horaires",
  technical: "Technique & Site",
  security: "Sécurité & IA",
  customer: "Service Client"
};

export const allFAQs = [
  // 🔹 Réservation
  {
    id: 1,
    question: "Comment réserver un trajet ?",
    answer: "Pour réserver un trajet, rendez-vous sur la page 'Trajets', sélectionnez votre ville de départ, ville d'arrivée et la date de voyage. Choisissez ensuite le trajet qui vous convient et suivez les étapes de réservation.",
    category: "reservation"
  },
  {
    id: 2,
    question: "Puis-je modifier ma réservation ?",
    answer: "Oui, vous pouvez modifier votre réservation jusqu'à 24 heures avant le départ. Connectez-vous à votre compte, allez dans 'Mes réservations' et cliquez sur 'Modifier'.",
    category: "reservation"
  },
  {
    id: 3,
    question: "Quelle est la politique d'annulation ?",
    answer: "Vous pouvez annuler votre réservation jusqu'à 48 heures avant le départ pour un remboursement complet. Entre 24 et 48 heures, 50% du montant est remboursé. Moins de 24 heures, aucun remboursement n'est possible.",
    category: "reservation"
  },
  {
    id: 4,
    question: "Comment créer un compte ?",
    answer: "Cliquez sur 'Inscription' en haut à droite de la page, remplissez le formulaire avec vos informations personnelles et validez votre email. Votre compte sera activé immédiatement.",
    category: "reservation"
  },
  {
    id: 5,
    question: "Comment savoir si ma réservation est confirmée ?",
    answer: "Vous recevez automatiquement un e-mail de confirmation avec les détails du trajet et votre code de billet.",
    category: "reservation"
  },
  {
    id: 6,
    question: "Puis-je réserver pour une autre personne ?",
    answer: "Oui, il suffit d'indiquer le nom du voyageur lors de la réservation.",
    category: "reservation"
  },
  {
    id: 7,
    question: "Dois-je imprimer mon billet ?",
    answer: "Non, le billet numérique affiché sur votre téléphone est accepté à l'embarquement.",
    category: "reservation"
  },

  // 🔹 Paiement
  {
    id: 8,
    question: "Quels sont les modes de paiement acceptés ?",
    answer: "Nous acceptons les cartes bancaires (Visa, Mastercard), les paiements par mobile money, PayPal et les cartes de crédit classiques. Tous les paiements sont sécurisés.",
    category: "payment"
  },
  {
    id: 9,
    question: "Puis-je payer en plusieurs fois ?",
    answer: "Non, le paiement doit être effectué en une seule fois au moment de la réservation.",
    category: "payment"
  },
  {
    id: 10,
    question: "Le site est-il sécurisé ?",
    answer: "Oui, toutes les transactions sont protégées par un certificat SSL et un cryptage 256 bits.",
    category: "payment"
  },
  {
    id: 11,
    question: "Puis-je obtenir une facture ?",
    answer: "Oui, une facture est envoyée automatiquement par e-mail après chaque paiement validé.",
    category: "payment"
  },

  // 🔹 Bagages
  {
    id: 12,
    question: "Combien de bagages puis-je emporter ?",
    answer: "Chaque passager peut transporter un bagage principal et un bagage à main gratuitement.",
    category: "baggage"
  },
  {
    id: 13,
    question: "Les animaux sont-ils acceptés ?",
    answer: "Uniquement dans certaines lignes et sous conditions (petits animaux dans des cages homologuées).",
    category: "baggage"
  },
  {
    id: 14,
    question: "Que faire si mon bagage est perdu ?",
    answer: "Contactez immédiatement le service client ou le bureau du transporteur sur place.",
    category: "baggage"
  },

  // 🔹 Trajet & Horaires
  {
    id: 15,
    question: "Comment connaître les horaires de départ ?",
    answer: "Tous les horaires sont affichés en ligne et mis à jour en temps réel.",
    category: "trip"
  },
  {
    id: 16,
    question: "Puis-je choisir mon siège ?",
    answer: "Oui, la plupart des lignes offrent la sélection du siège au moment de la réservation.",
    category: "trip"
  },
  {
    id: 17,
    question: "Les bus sont-ils climatisés ?",
    answer: "Oui, la majorité de nos véhicules disposent de la climatisation.",
    category: "trip"
  },
  {
    id: 18,
    question: "Y a-t-il des arrêts pendant le trajet ?",
    answer: "Oui, selon la distance, des pauses sont prévues toutes les 2 à 3 heures.",
    category: "trip"
  },

  // 🔹 Technique & Site
  {
    id: 19,
    question: "Que faire en cas de problème technique ?",
    answer: "Si vous rencontrez un problème technique, contactez notre service client par email à support@transportplatform.com ou par téléphone au +33 1 23 45 67 89.",
    category: "technical"
  },
  {
    id: 20,
    question: "Je n'arrive pas à me connecter à mon compte.",
    answer: "Vérifiez vos identifiants ou cliquez sur 'Mot de passe oublié' pour le réinitialiser.",
    category: "technical"
  },
  {
    id: 21,
    question: "L'application mobile existe-t-elle ?",
    answer: "Oui, une version Android est disponible sur Play Store, et bientôt iOS.",
    category: "technical"
  },

  // 🔹 Sécurité & IA
  {
    id: 22,
    question: "Comment assurez-vous la sécurité des voyageurs ?",
    answer: "Nos transporteurs sont vérifiés, et chaque trajet est tracé par GPS pour plus de sûreté.",
    category: "security"
  },
  {
    id: 23,
    question: "Utilisez-vous l'intelligence artificielle ?",
    answer: "Oui, notre système IA optimise les itinéraires et prédit le trafic en temps réel.",
    category: "security"
  },

  // 🔹 Service Client
  {
    id: 24,
    question: "Quels sont les horaires du service client ?",
    answer: "Du lundi au samedi, de 8h à 20h.",
    category: "customer"
  },
  {
    id: 25,
    question: "Quel est le délai de réponse par e-mail ?",
    answer: "Généralement sous 24 à 72h ouvrées.",
    category: "customer"
  }
];

export const getCategoryIcon = (category) => {
  const icons = {
    reservation: "📅",
    payment: "💳",
    baggage: "🎒",
    trip: "🚌",
    technical: "🔧",
    security: "🛡️",
    customer: "👨‍💼"
  };
  return icons[category] || "❓";
};

export const getCategoryColorClass = (category) => {
  const colors = {
    reservation: "category-reservation",
    payment: "category-payment",
    baggage: "category-baggage",
    trip: "category-trip",
    technical: "category-technical",
    security: "category-security",
    customer: "category-customer"
  };
  return colors[category] || "category-technical";
};
// faqData.js - Ajouter cette section
export const searchSynonyms = {
  'securite': ['sécurité', 'securite', 'securit', 'sécurite', 'securité', 'secur'],
  'securité': ['sécurité', 'securite', 'securit', 'sécurite', 'securité', 'secur'],
  'reservation': ['réservation', 'reservation', 'reserv', 'réserv', 'book', 'booking'],
  'paiement': ['paiement', 'payment', 'payement', 'paiemnt'],
  'bagage': ['bagage', 'bagages', 'luggage', 'valise'],
  'annulation': ['annulation', 'cancel', 'cancellation', 'annul'],
  'remboursement': ['remboursement', 'refund', 'reimbursement', 'rembours'],
  'technique': ['technique', 'technical', 'tech', 'probleme'],
  'client': ['client', 'customer', 'service', 'support'],
  'voyage': ['voyage', 'travel', 'trip', 'trajet'],
  'horaires': ['horaires', 'schedule', 'time', 'heure'],
  'billetterie': ['billetterie', 'ticket', 'billet', 'ticketing']
};

export const keywordMapping = {
  'secur': 'sécurité',
  'securit': 'sécurité',
  'securite': 'sécurité',
  'sécurite': 'sécurité',
  'securité': 'sécurité',
  'reserv': 'réservation',
  'réserv': 'réservation',
  'book': 'réservation',
  'booking': 'réservation',
  'pay': 'paiement',
  'payment': 'paiement',
  'payement': 'paiement',
  'paiemnt': 'paiement',
  'bag': 'bagage',
  'luggage': 'bagage',
  'cancel': 'annulation',
  'cancellation': 'annulation',
  'annul': 'annulation',
  'refund': 'remboursement',
  'reimbursement': 'remboursement',
  'rembours': 'remboursement',
  'tech': 'technique',
  'technical': 'technique',
  'probleme': 'technique',
  'problem': 'technique',
  'customer': 'client',
  'service': 'client',
  'support': 'client',
  'travel': 'voyage',
  'trip': 'voyage',
  'trajet': 'voyage',
  'schedule': 'horaires',
  'time': 'horaires',
  'heure': 'horaires',
  'ticket': 'billetterie',
  'billet': 'billetterie',
  'ticketing': 'billetterie'
};