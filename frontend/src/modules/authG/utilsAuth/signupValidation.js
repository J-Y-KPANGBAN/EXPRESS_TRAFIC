// frontend/src/modules/authG/utilsAuth/signupValidation.js - MISE À JOUR
export const validateField = (name, value, formData) => {
  switch (name) {
    case 'date_naissance':
      if (!value) return 'La date de naissance est obligatoire';
      
      // ✅ VALIDATION FORMAT jj/mm/yyyy
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        return 'Format invalide. Utilisez jj/mm/aaaa';
      }
      
      const [day, month, year] = value.split('/').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Vérifier si la date est valide
      if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1 || birthDate.getFullYear() !== year) {
        return 'Date de naissance invalide';
      } else if (age < 18) {
        return 'Vous devez avoir au moins 18 ans';
      } else if (age > 120) {
        return 'Date de naissance invalide';
      }
      break;
      
    // ... autres validations existantes
    default:
      return '';
  }
  return '';
};

export const validateForm = (formData, acceptedTerms) => {
  const newErrors = {};

  // Validation des champs obligatoires
  if (!formData.nom?.trim()) newErrors.nom = 'Le nom est obligatoire';
  if (!formData.prenom?.trim()) newErrors.prenom = 'Le prénom est obligatoire';
  if (!formData.email?.trim()) newErrors.email = 'L\'email est obligatoire';
  if (!formData.mot_de_passe) newErrors.mot_de_passe = 'Le mot de passe est obligatoire';
  if (!formData.telephone?.trim()) newErrors.telephone = 'Le téléphone est obligatoire';
  if (!formData.country?.trim()) newErrors.country = 'Le pays est obligatoire';
  if (!formData.ville?.trim()) newErrors.ville = 'La ville est obligatoire';
  if (!formData.adresse_postale?.trim()) newErrors.adresse_postale = 'L\'adresse est obligatoire';
  if (!formData.date_naissance) newErrors.date_naissance = 'La date de naissance est obligatoire';

  // Validation email
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Format d\'email invalide';
  }

  // Validation mot de passe
  if (formData.mot_de_passe && formData.mot_de_passe.length < 8) {
    newErrors.mot_de_passe = 'Minimum 8 caractères';
  }

  if (formData.mot_de_passe && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.mot_de_passe)) {
    newErrors.mot_de_passe = 'Doit contenir majuscule, minuscule et chiffre';
  }

  // Validation confirmation mot de passe
  if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
    newErrors.confirm_mot_de_passe = 'Les mots de passe ne correspondent pas';
  }

  // ✅ VALIDATION DATE jj/mm/yyyy
  if (formData.date_naissance) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.date_naissance)) {
      newErrors.date_naissance = 'Format invalide. Utilisez jj/mm/aaaa';
    } else {
      const [day, month, year] = formData.date_naissance.split('/').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1 || birthDate.getFullYear() !== year) {
        newErrors.date_naissance = 'Date de naissance invalide';
      } else if (age < 18) {
        newErrors.date_naissance = 'Vous devez avoir au moins 18 ans';
      } else if (age > 120) {
        newErrors.date_naissance = 'Date de naissance invalide';
      }
    }
  }

  // Validation conditions
  if (!acceptedTerms) {
    newErrors.acceptedTerms = 'Vous devez accepter les conditions d\'utilisation';
  }

  return newErrors;
};