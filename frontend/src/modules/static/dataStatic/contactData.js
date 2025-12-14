// contactData.js
export const contactFormConfig = {
  initialFormData: {
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    sujet: '',
    sousSujet: '',
    message: '',
    indicatif: '+33'
  },

  sujetOptions: [
    'Réservation',
    'Annulation',
    'Remboursement',
    'Problème technique',
    'Information',
    'Partenaire',
    'Autre'
  ],

  sousSujetOptions: {
    'Réservation': ['Problème de paiement', 'Modification réservation', 'Confirmation', 'Autre'],
    'Annulation': ['Demande remboursement', 'Problème annulation', 'Autre'],
    'Remboursement': ['Suivi remboursement', 'Problème remboursement', 'Délai', 'Autre'],
    'Problème technique': ['Site web', 'Application mobile', 'Compte utilisateur', 'Autre'],
    'Information': ['Horaires', 'Tarifs', 'Bagages', 'Animaux', 'Autre'],
    'Partenaire': ['Devenir partenaire', 'Information partenariat', 'Autre'],
    'Autre': ['Suggestion', 'Réclamation', 'Autre']
  },

  transportSujets: {
    "Bus - Horaires": ["Retard", "Annulation", "Changement d'horaire", "Service exceptionnel"],
    "Bus - Tarifs": ["Réduction", "Carte d'abonnement", "Billet étudiant", "Offres promotionnelles"],
    "Bus - Réservation": ["Réservation en ligne", "Réservation au guichet", "Modification de réservation", "Annulation de réservation"],
    "Bus - Bagages": ["Perte de bagage", "Objet oublié", "Transport spécial", "Limitation de poids"],
    "Car - Itinéraires": ["Changement d'itinéraire", "Itinéraire incorrect", "Information sur trajets", "Temps de trajet"],
    "Car - Retard": ["Retard supérieur à 30 min", "Retard supérieur à 1h", "Retard supérieur à 2h", "Annulation partielle"],
    "Car - Remboursement": ["Annulation voyage", "Erreur de paiement", "Retard important", "Problème de remboursement"],
    "Car - Service à bord": ["Confort siège", "Climatisation", "Propreté", "Wifi / divertissement"],
    "Billetterie": ["Billet perdu", "Erreur de billet", "Billet non reçu", "Demande d'impression"],
    "Remboursement général": ["Annulation", "Retard supérieur à 2h", "Problème de paiement", "Autre remboursement"],
    "Réclamation": ["Comportement du personnel", "Problème technique", "Service client non réactif", "Autre réclamation"],
    "Informations voyage": ["Conditions générales", "Documents nécessaires", "Assurance voyage", "FAQ voyage"],
    "Accessibilité": ["Accès handicapé", "Assistance fauteuil roulant", "Ascenseur / rampe", "Service spécial"],
    "Programme fidélité": ["Points non crédités", "Récompenses", "Carte fidélité perdue", "Modification compte fidélité"],
    "Évènements spéciaux": ["Fêtes", "Vacances", "Journées exceptionnelles", "Horaires spéciaux"],
    "Sécurité": ["Incident à bord", "Perte de biens", "Comportement suspect", "Évacuation"],
    "Support technique": ["Application mobile", "Site web", "Paiement en ligne", "Erreur système"],
    "Informations trafic": ["Grève", "Travaux", "Accident", "Bouchons / déviation"],
    "Objets trouvés": ["Objet perdu dans bus", "Objet perdu dans car", "Signalement trouvé", "Reprise objet perdu"],
    "Autres demandes": ["Suggestions", "Autres services", "Contact général", "Remarques diverses"]
  }
};

export const contactInfo = {
  title: "Autres moyens de contact",
  methods: [
    {
      icon: "📞",
      title: "Téléphone",
      details: "+33 1 23 45 67 89",
      description: "Lun-Ven: 8h-20h, Sam: 9h-18h"
    },
    {
      icon: "✉️",
      title: "Email",
      details: "contact@transportplatform.com",
      description: "Réponse sous 24h"
    },
    {
      icon: "📍",
      title: "Adresse",
      details: "123 Avenue des Champs, 75008 Paris, France",
      description: "Siège social"
    }
  ]
};

export const successMessages = {
  contact: "Message envoyé avec succès! Nous vous répondrons dans les plus brefs délais.",
  transport: "Message envoyé ! Vous recevrez un email de confirmation."
};

export const errorMessages = {
  required: "Veuillez remplir tous les champs obligatoires !",
  email: "Email invalide !",
  server: "Erreur serveur !",
  generic: "Erreur lors de l'envoi du message"
};