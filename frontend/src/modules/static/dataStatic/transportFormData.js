export const transportFormData = {
  title: "Formulaire Transport",
  description: "Veuillez remplir ce formulaire pour nous contacter.",

  fields: [
    { name: "firstName", label: "Prénom", required: true, type: "text" },
    { name: "lastName", label: "Nom", required: true, type: "text" },
    { name: "email", label: "Email", required: true, type: "email" },
    { name: "telephone", label: "Téléphone", required: false, type: "tel" },
    { name: "sujet", label: "Sujet", required: true, type: "select",
      options: Object.keys({
        "Bus - Horaires": [],
        "Bus - Tarifs": [],
        "Bus - Réservation": [],
        "Bus - Bagages": [],
        "Car - Itinéraires": [],
        "Car - Retard": [],
        "Car - Remboursement": [],
        "Car - Service à bord": [],
        "Billetterie": [],
        "Remboursement général": [],
        "Réclamation": [],
        "Informations voyage": [],
        "Accessibilité": [],
        "Programme fidélité": [],
        "Évènements spéciaux": [],
        "Sécurité": [],
        "Support technique": [],
        "Informations trafic": [],
        "Objets trouvés": [],
        "Autres demandes": []
      })
    },
    { name: "sousSujet", label: "Sous-sujet", required: true, type: "select", options: [] },
    { name: "message", label: "Message", required: true, type: "textarea" }
  ]
};
