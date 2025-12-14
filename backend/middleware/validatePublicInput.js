exports.validateSignup = [
  body('nom').trim().isLength({ min: 2, max: 50 }).escape(),
  body('prenom').trim().isLength({ min: 2, max: 50 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('mot_de_passe').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('telephone').custom(isValidPhone),
  body('date_naissance').isDate(),
  body('conditions_acceptees').isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données d'inscription invalides", // ← CORRIGÉ
        errors: errors.array()
      });
    }
    next();
  }
];