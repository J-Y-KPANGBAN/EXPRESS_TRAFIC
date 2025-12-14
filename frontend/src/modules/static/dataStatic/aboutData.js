// aboutData.js
export const aboutSections = {
  header: {
    title: "À propos de TransportPlatform",
    subtitle: "Votre partenaire de confiance pour tous vos déplacements"
  },
  
  mission: {
    title: "Notre Mission",
    content: "TransportPlatform a été créé avec une vision simple : rendre les déplacements en bus accessibles, confortables et économiques pour tous. Nous croyons que voyager devrait être une expérience agréable, sans stress ni complications."
  },
  
  values: {
    title: "Nos Valeurs",
    items: [
      {
        icon: "🚀",
        title: "Innovation",
        description: "Nous utilisons les dernières technologies pour améliorer constamment votre expérience de voyage."
      },
      {
        icon: "🤝",
        title: "Confiance",
        description: "La sécurité et la satisfaction de nos clients sont au cœur de nos préoccupations."
      },
      {
        icon: "🌍",
        title: "Durabilité",
        description: "Nous nous engageons pour un tourisme responsable et respectueux de l'environnement."
      },
      {
        icon: "⭐",
        title: "Qualité",
        description: "Des services de haute qualité à des prix accessibles pour tous."
      }
    ]
  },
  
  team: {
    title: "Notre Équipe",
    content: "Une équipe passionnée de professionnels du transport et de la technologie travaille chaque jour pour vous offrir le meilleur service possible."
  }
};

export const detailedAboutData = {
  title: "À propos de nous",
  lead: "Nous sommes une entreprise technologique africaine dédiée à la gestion numérique et intelligente du transport de voyageurs en Afrique de l'Ouest.",
  
  sections: [
    {
      id: "who-we-are",
      title: "Qui sommes-nous ?",
      content: "Nous concevons une plateforme innovante qui connecte les voyageurs et les transporteurs de bus, et qui propose des outils pour planifier, suivre et optimiser les trajets en temps réel. Notre mission : transformer la mobilité locale via des solutions digitales simples, sécurisées et accessibles."
    },
    {
      id: "vision",
      title: "Notre vision",
      content: "À l'ère du numérique et de l'intelligence artificielle, nous voulons faire du transport un service prédictible, efficace et humain. Nous visons à devenir le hub de mobilité intelligente de référence en Afrique de l'Ouest, rassemblant voyageurs, opérateurs et autorités."
    },
    {
      id: "mission",
      title: "Notre mission",
      type: "list",
      items: [
        "Digitaliser et automatiser la billetterie et la gestion opérationnelle des transporteurs.",
        "Exploiter l'IA et la data pour optimiser la planification des lignes et la gestion des flux.",
        "Mettre en relation directe voyageurs et transporteurs via une interface fluide et sécurisée.",
        "Aider les opérateurs à piloter leurs activités : ventes, maintenance, performance des lignes.",
        "Réduire les temps d'attente et améliorer l'expérience passager."
      ]
    },
    {
      id: "presence",
      title: "Notre présence en Afrique de l'Ouest",
      content: "Basés en Afrique de l'Ouest, nous opérons et développons notre réseau dans plusieurs pays de la sous-région afin d'accompagner la transition digitale du transport.",
      note: "Exemples : Sénégal, Côte d'Ivoire, Burkina Faso, Mali, Niger, Togo, Bénin, Guinée, Ghana, Nigeria."
    },
    {
      id: "innovation",
      title: "Innovation, IA et data au service du transport",
      className: "innovation-section",
      content: "Nous intégrons des solutions d'intelligence artificielle et d'analyse de données pour :",
      type: "list",
      items: [
        "Optimiser les itinéraires et la répartition des véhicules (optimisation du trafic).",
        "Prédire les pics de demande et adapter l'offre en temps réel.",
        "Réduire les coûts d'exploitation et améliorer la rentabilité des lignes.",
        "Améliorer la précision des réservations et la satisfaction client.",
        "Renforcer la sécurité grâce au suivi intelligent des trajets."
      ],
      additionalContent: "Notre plateforme apprend et s'adapte continuellement : la donnée guide nos décisions pour offrir une mobilité plus fluide, personnalisée et durable."
    },
    {
      id: "philosophy",
      title: "Notre philosophie",
      className: "philosophy-section",
      type: "quote",
      content: "« À l'ère de l'intelligence artificielle, la mobilité doit devenir plus intelligente, plus prévisible et plus humaine. Ensemble, mettons la donnée et la technologie au service du transport africain. »"
    }
  ],
  
  footer: {
    content: "Vous souhaitez intégrer nos services, en savoir plus sur nos solutions IA/data, ou rejoindre notre réseau de transporteurs ?",
    link: {
      text: "Contactez-nous",
      to: "/contact"
    }
  }
};

// Données pour le formulaire de transport
export const transportFormData = {
  title: "Devenez Partenaire Transporteur",
  description: "Rejoignez notre réseau de transporteurs et bénéficiez de nos solutions digitales innovantes.",
  fields: [
    {
      name: "company",
      label: "Nom de l'entreprise",
      type: "text",
      required: true,
      placeholder: "Entrez le nom de votre entreprise"
    },
    {
      name: "contact",
      label: "Personne à contacter",
      type: "text",
      required: true,
      placeholder: "Nom et prénom du responsable"
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "email@entreprise.com"
    },
    {
      name: "phone",
      label: "Téléphone",
      type: "tel",
      required: true,
      placeholder: "+221 XX XXX XX XX"
    },
    {
      name: "country",
      label: "Pays d'opération",
      type: "select",
      required: true,
      options: [
        "Sénégal", "Côte d'Ivoire", "Burkina Faso", "Mali", "Niger",
        "Togo", "Bénin", "Guinée", "Ghana", "Nigeria", "Autre"
      ]
    },
    {
      name: "fleetSize",
      label: "Taille de la flotte",
      type: "number",
      required: true,
      placeholder: "Nombre de véhicules"
    },
    {
      name: "message",
      label: "Message",
      type: "textarea",
      required: false,
      placeholder: "Parlez-nous de vos besoins et objectifs..."
    }
  ]
};