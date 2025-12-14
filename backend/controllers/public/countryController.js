//backend/controllers/public/countryController.js
const db = require("../../config/db");
const logger = require("../../utils/logger");


exports.getCountries = async (req, res) => {
  try {
    logger.info("🌍 Chargement de la liste des pays...");

    const [countries] = await db.query(
      "SELECT id, name, code FROM countries ORDER BY name"
    );

    if (!countries || countries.length === 0) {
      logger.warning("⚠️ Aucun pays trouvé en base.");
    }

    logger.success(`🌐 ${countries.length} pays chargés.`);

    return res.json({
      success: true,
      data: countries,
    });
  } catch (error) {
    logger.error("❌ Erreur getCountries: " + error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des pays.",
    });
  }
};
