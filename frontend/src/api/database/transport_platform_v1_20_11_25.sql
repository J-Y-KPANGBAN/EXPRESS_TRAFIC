-- ===========================================================================
-- TRANSPORT PLATFORM - STRUCTURE COMPLÈTE V2.1 (SANS DONNÉES DE TEST)
-- ===========================================================================

DROP DATABASE IF EXISTS transport_platformv1;
CREATE DATABASE transport_platform_v1
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE transport_platform_v1;



-- ===========================================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS PAR SÉCURITÉ
-- ===========================================================================

DROP VIEW IF EXISTS v_user_with_profile;
DROP VIEW IF EXISTS v_trajet_complet;
DROP VIEW IF EXISTS v_reservation_details;

DROP TRIGGER IF EXISTS trg_signup_generate_numbers;
DROP TRIGGER IF EXISTS trg_signup_require_terms;
DROP TRIGGER IF EXISTS trg_after_reservation_insert;
DROP TRIGGER IF EXISTS trg_before_reservation_insert;

-- on supprime les tables dans l'ordre inverse des dépendances

DROP TABLE IF EXISTS service_fees;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS user_journey;
DROP TABLE IF EXISTS logs_actions;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS sms_codes;
DROP TABLE IF EXISTS user_tokens;
DROP TABLE IF EXISTS system_settings;

DROP TABLE IF EXISTS Politiques_de_remboursement;
DROP TABLE IF EXISTS Avis;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Reductions;
DROP TABLE IF EXISTS Paiements;
DROP TABLE IF EXISTS Reservations;
DROP TABLE IF EXISTS Moyens_de_paiement_pris_en_charge;
DROP TABLE IF EXISTS Arrets;
DROP TABLE IF EXISTS Trajets;
DROP TABLE IF EXISTS Bus;
DROP TABLE IF EXISTS Chauffeurs;
DROP TABLE IF EXISTS Societes;
DROP TABLE IF EXISTS login;
DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS contact;
DROP TABLE IF EXISTS signup;
DROP TABLE IF EXISTS phone_codes;
DROP TABLE IF EXISTS countries;

-- ===========================================================================
-- 2. TABLES DE RÉFÉRENCE PAYS / INDICATIFS
-- ===========================================================================

-- Table: countries (liste des pays pour les formulaires)
CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL,         -- ISO code (FR, BE, etc.)
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: phone_codes (indicatifs téléphoniques)
CREATE TABLE phone_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    country_name VARCHAR(150) NOT NULL,
    iso_code VARCHAR(5) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    region VARCHAR(100),
    UNIQUE KEY uk_country_name (country_name),
    UNIQUE KEY uk_iso_code (iso_code),
    INDEX idx_phone_code (phone_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 3. UTILISATEURS / PROFIL / LOGIN / CONTACT
-- ===========================================================================

-- Table: signup (utilisateurs)
CREATE TABLE signup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_client VARCHAR(50) UNIQUE,
    numero_compte VARCHAR(50) UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    phone_code VARCHAR(10),                     -- nouvel indicatif (ex: +33)
    country VARCHAR(100) DEFAULT 'France',
    code_postal VARCHAR(10),
    ville VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    adresse_postale VARCHAR(255),
    date_naissance DATE,
    conditions_acceptees TINYINT(1) NOT NULL DEFAULT 0,
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type_utilisateur ENUM('client','admin','conducteur') DEFAULT 'client',
    photo_profil VARCHAR(255),
    statut ENUM('actif','inactif','suspendu') DEFAULT 'actif',
    derniere_connexion TIMESTAMP NULL,

    CHECK (CHAR_LENGTH(mot_de_passe) >= 6),
    CHECK (nom <> ''),
    CHECK (prenom <> ''),
    CHECK (ville <> ''),

    INDEX idx_email (email),
    INDEX idx_type_utilisateur (type_utilisateur),
    INDEX idx_ville (ville),
    INDEX idx_date_inscription (date_inscription)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: profile
CREATE TABLE profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    photo_url VARCHAR(255),
    bio TEXT,
    preferences JSON,
    notifications_actives TINYINT(1) DEFAULT 1,
    langue_preferee ENUM('fr','en','es') DEFAULT 'fr',
    date_derniere_modif TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: login (historique connexions)
CREATE TABLE login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    email VARCHAR(150) NOT NULL,
    date_connexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adresse_ip VARCHAR(45),
    user_agent TEXT,
    statut ENUM('réussi','échoué') DEFAULT 'réussi',
    code_erreur VARCHAR(50),

    FOREIGN KEY (user_id) REFERENCES signup(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_date_connexion (date_connexion),
    INDEX idx_user_id (user_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: contact (formulaire de contact public)
CREATE TABLE contact (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    indicatif VARCHAR(5),
    telephone VARCHAR(20),
    sujet VARCHAR(100) NOT NULL,
    sousSujet VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    statut ENUM('nouveau','lu','repondu','resolu') DEFAULT 'nouveau',
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP NULL,

    INDEX idx_email (email),
    INDEX idx_sujet (sujet),
    INDEX idx_date_envoi (date_envoi),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 4. SOCIÉTÉS / CHAUFFEURS / BUS / TRAJETS / ARRETS
-- ===========================================================================

-- Table: Societes
CREATE TABLE Societes (
  id VARCHAR(7) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  contact VARCHAR(15),
  email VARCHAR(255) UNIQUE,
  site_web VARCHAR(255),
  date_creation DATE,
  etat ENUM('actif','inactif') DEFAULT 'actif',
  description TEXT,
  logo_url VARCHAR(255),

  INDEX idx_nom (nom),
  INDEX idx_etat (etat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Chauffeurs
CREATE TABLE Chauffeurs (
  id VARCHAR(7) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  numero_de_telephone VARCHAR(15) NOT NULL,
  email VARCHAR(255) UNIQUE,
  numero_permis VARCHAR(50) UNIQUE,
  date_embauche DATE,
  date_naissance DATE,
  adresse TEXT,
  statut ENUM('actif','inactif','congé') DEFAULT 'actif',
  photo_url VARCHAR(255),

  INDEX idx_nom_prenom (nom, prenom),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Bus
CREATE TABLE Bus (
  id VARCHAR(7) PRIMARY KEY,
  numero_immatriculation VARCHAR(50) UNIQUE NOT NULL,
  capacite INT NOT NULL CHECK (capacite > 0),
  type_bus ENUM('standard','premium','luxe') DEFAULT 'standard',
  chauffeur_id VARCHAR(7),
  societe_id VARCHAR(7),
  equipements JSON,
  annee_fabrication YEAR,
  couleur VARCHAR(50),
  statut ENUM('actif','maintenance','hors_service') DEFAULT 'actif',
  date_mise_service DATE,
  kilometrage DECIMAL(10,2) DEFAULT 0,

  FOREIGN KEY (chauffeur_id) REFERENCES Chauffeurs(id),
  FOREIGN KEY (societe_id) REFERENCES Societes(id),

  INDEX idx_immatriculation (numero_immatriculation),
  INDEX idx_type_bus (type_bus),
  INDEX idx_statut (statut),
  INDEX idx_societe (societe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Trajets
CREATE TABLE Trajets (
  id VARCHAR(7) PRIMARY KEY,
  ville_depart VARCHAR(255) NOT NULL,
  ville_arrivee VARCHAR(255) NOT NULL,
  date_depart DATE NOT NULL,
  heure_depart TIME NOT NULL,
  duree TIME NOT NULL,
  prix DECIMAL(10,2) NOT NULL CHECK (prix >= 0),
  bus_id VARCHAR(7),
  places_disponibles INT DEFAULT 0,
  places_total INT NOT NULL,
  etat_trajet ENUM('actif','annule','termine','complet') DEFAULT 'actif',
  description TEXT,
  conditions_annulation TEXT,

  FOREIGN KEY (bus_id) REFERENCES Bus(id),

  INDEX idx_ville_depart (ville_depart),
  INDEX idx_ville_arrivee (ville_arrivee),
  INDEX idx_date_depart (date_depart),
  INDEX idx_etat_trajet (etat_trajet),
  INDEX idx_bus (bus_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Arrets
CREATE TABLE Arrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id VARCHAR(7) NOT NULL,
  nom_arret VARCHAR(255) NOT NULL,
  ordre INT NOT NULL,
  heure_arrivee TIME NOT NULL,
  heure_depart TIME NOT NULL,
  prix_arret DECIMAL(10,2),
  adresse_arret TEXT,

  FOREIGN KEY (trajet_id) REFERENCES Trajets(id) ON DELETE CASCADE,
  INDEX idx_trajet_id (trajet_id),
  INDEX idx_ordre (ordre),
  UNIQUE KEY uk_trajet_ordre (trajet_id, ordre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 5. PAIEMENTS / RÉSERVATIONS / REMBOURSEMENT / AVIS / NOTIFS / RÉDUCTIONS
-- ===========================================================================

-- Table: Moyens de paiement
CREATE TABLE Moyens_de_paiement_pris_en_charge (
  id VARCHAR(7) PRIMARY KEY,
  methode ENUM('Mobile Money','Visa','Mastercard','PayPal','Carte bancaire') NOT NULL,
  description TEXT,
  etat ENUM('actif','inactif') DEFAULT 'actif',
  frais_pourcentage DECIMAL(5,2) DEFAULT 0,
  configuration JSON,
  date_activation DATE,

  INDEX idx_methode (methode),
  INDEX idx_etat (etat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Reservations
CREATE TABLE Reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  trajet_id VARCHAR(7) NOT NULL,
  siege_numero INT NOT NULL,
  etat_reservation ENUM('en_attente','confirmee','annulee','en_cours') DEFAULT 'en_attente',
  moyen_paiement VARCHAR(7),
  date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  frais_reservation DECIMAL(10,2) DEFAULT 0.00,
  montant_societe DECIMAL(10,2) DEFAULT 0.00,
  montant_total DECIMAL(10,2) NOT NULL,
  code_reservation VARCHAR(20) UNIQUE,
  passagers JSON,
  informations_speciales TEXT,
  qr_code_data TEXT,
  ticket_downloaded TINYINT(1) DEFAULT 0,
  email_sent TINYINT(1) DEFAULT 0,
  email_sent_at TIMESTAMP NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES signup(id),
  FOREIGN KEY (trajet_id) REFERENCES Trajets(id),
  FOREIGN KEY (moyen_paiement) REFERENCES Moyens_de_paiement_pris_en_charge(id),

  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_trajet_id (trajet_id),
  INDEX idx_etat_reservation (etat_reservation),
  INDEX idx_date_reservation (date_reservation),
  INDEX idx_code_reservation (code_reservation),
  UNIQUE KEY uk_trajet_siege (trajet_id, siege_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Paiements
CREATE TABLE Paiements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  methode ENUM('carte','mobile_money','paypal','especes') NOT NULL,
  etat_paiement ENUM('reussi','echoue','en_attente','rembourse') DEFAULT 'en_attente',
  date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_transaction VARCHAR(100) UNIQUE,
  details_transaction JSON,
  date_remboursement TIMESTAMP NULL,
  motif_remboursement TEXT,

  FOREIGN KEY (reservation_id) REFERENCES Reservations(id),

  INDEX idx_reservation_id (reservation_id),
  INDEX idx_etat_paiement (etat_paiement),
  INDEX idx_date_paiement (date_paiement),
  INDEX idx_reference (reference_transaction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Politiques de remboursement
CREATE TABLE Politiques_de_remboursement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id VARCHAR(7) NOT NULL,
  pourcentage_remboursement DECIMAL(5,2) NOT NULL CHECK (pourcentage_remboursement >= 0 AND pourcentage_remboursement <= 100),
  description_condition TEXT NOT NULL,
  delai_heures INT NOT NULL,
  frais_annulation DECIMAL(10,2) DEFAULT 0,
  actif TINYINT(1) DEFAULT 1,

  FOREIGN KEY (trajet_id) REFERENCES Trajets(id),

  INDEX idx_trajet_id (trajet_id),
  INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Avis
CREATE TABLE Avis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  trajet_id VARCHAR(7) NOT NULL,
  note INT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('en_attente','approuve','rejete') DEFAULT 'en_attente',
  type_avis ENUM('trajet','chauffeur','bus','societe'),
  reponse_gerant TEXT,
  date_reponse TIMESTAMP NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES signup(id),
  FOREIGN KEY (trajet_id) REFERENCES Trajets(id),

  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_trajet_id (trajet_id),
  INDEX idx_note (note),
  INDEX idx_date (date),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Notifications
CREATE TABLE Notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  type_notification ENUM('reservation','annulation','paiement','rappel','promotion','systeme') NOT NULL,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  statut ENUM('lu','non_lu') DEFAULT 'non_lu',
  date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_lecture TIMESTAMP NULL,
  lien_action VARCHAR(255),
  priorite ENUM('basse','normale','haute') DEFAULT 'normale',

  FOREIGN KEY (utilisateur_id) REFERENCES signup(id),

  INDEX idx_utilisateur_id (utilisateur_id),
  INDEX idx_type_notification (type_notification),
  INDEX idx_statut (statut),
  INDEX idx_date_envoi (date_envoi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: Reductions
CREATE TABLE Reductions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  pourcentage DECIMAL(5,2) CHECK (pourcentage >= 0 AND pourcentage <= 100),
  montant_fixe DECIMAL(10,2),
  type_reduction ENUM('pourcentage','montant_fixe') NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  conditions JSON,
  utilisations_max INT DEFAULT 1,
  utilisations_actuelles INT DEFAULT 0,
  statut ENUM('actif','inactif','epuise') DEFAULT 'actif',

  INDEX idx_code (code),
  INDEX idx_date_debut (date_debut),
  INDEX idx_date_fin (date_fin),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 6. TABLES SPÉCIFIQUES FONCTIONNALITÉS : PANIER, FRAIS, SÉCURITÉ, MAILS
-- ===========================================================================

-- Table: carts (panier multi-réservations)
CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EUR',
    status ENUM('en_cours','valide','expire','annule') DEFAULT 'en_cours',
    source ENUM('web','mobile','admin') DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    metadata JSON,

    FOREIGN KEY (user_id) REFERENCES signup(id),
    INDEX idx_cart_user (user_id),
    INDEX idx_cart_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: cart_items (détails panier)
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    trajet_id VARCHAR(7) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    seat_numbers JSON,       -- liste des sièges réservés
    passenger_info JSON,     -- infos passagers

    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES Trajets(id) ON DELETE CASCADE,

    INDEX idx_ci_cart (cart_id),
    INDEX idx_ci_trajet (trajet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: service_fees (frais de service dynamiques)
CREATE TABLE service_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fee_type ENUM('pourcentage','fixe') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    apply_on ENUM('billet','panier','transaction','siege') DEFAULT 'transaction',
    context ENUM('standard','haute_saison','promotion','paiement_mobile','carte_bancaire','international') DEFAULT 'standard',
    active TINYINT(1) DEFAULT 1,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sessions (sessions utilisateurs pour déconnexion auto, 2FA, etc.)
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1,

  FOREIGN KEY (user_id) REFERENCES signup(id),

  INDEX idx_sess_user (user_id),
  INDEX idx_sess_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: user_tokens (validation email, reset mdp, 2FA)
CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('email_validation','password_reset','2fa','magic_login') NOT NULL,
    expire_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id),
    INDEX idx_ut_user (user_id),
    INDEX idx_ut_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sms_codes (validation par SMS)
CREATE TABLE sms_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(20),
    code VARCHAR(10) NOT NULL,
    channel ENUM('login','signup','2fa') DEFAULT 'login',
    expire_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id),

    INDEX idx_sms_user (user_id),
    INDEX idx_sms_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: logs_actions (actions admin + clients)
CREATE TABLE logs_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    role ENUM('client','admin','conducteur','systeme') DEFAULT 'client',
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id),

    INDEX idx_la_user (user_id),
    INDEX idx_la_role (role),
    INDEX idx_la_action (action),
    INDEX idx_la_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: system_settings (paramètres globaux, maintenance, sécurité)
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maintenance_mode TINYINT(1) DEFAULT 0,
    maintenance_message TEXT,
    maintenance_since TIMESTAMP NULL,
    default_language VARCHAR(5) DEFAULT 'fr',
    session_timeout_minutes INT DEFAULT 10,
    password_expiry_months INT DEFAULT 6,
    inactivity_warning_months INT DEFAULT 6,
    inactivity_deletion_months INT DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: email_templates (modèles d’emails)
CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content LONGTEXT NOT NULL,
    variables JSON,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: email_logs (logs envoi emails)
CREATE TABLE email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    template_id INT,
    to_email VARCHAR(255),
    status ENUM('envoye','echoue') DEFAULT 'envoye',
    error_message TEXT,
    meta JSON,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id),
    FOREIGN KEY (template_id) REFERENCES email_templates(id),

    INDEX idx_el_user (user_id),
    INDEX idx_el_template (template_id),
    INDEX idx_el_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: user_journey (parcours utilisateur)
CREATE TABLE user_journey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(255),
    step ENUM(
        'visite_site','recherche_trajet','vue_trajet','ajout_panier',
        'selection_siege','connexion','paiement','reservation_confirmee',
        'abandon_panier'
    ),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES signup(id),

    INDEX idx_uj_user (user_id),
    INDEX idx_uj_session (session_id),
    INDEX idx_uj_step (step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 7. TRIGGERS
-- ===========================================================================

DELIMITER $$

-- Génération automatique numero_client / numero_compte
CREATE TRIGGER trg_signup_generate_numbers
BEFORE INSERT ON signup
FOR EACH ROW
BEGIN
    IF NEW.numero_client IS NULL OR NEW.numero_client = '' THEN
        SET NEW.numero_client = CONCAT('CLT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND()*9999),4,'0'));
    END IF;

    IF NEW.numero_compte IS NULL OR NEW.numero_compte = '' THEN
        SET NEW.numero_compte = CONCAT('CPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND()*9999),4,'0'));
    END IF;
END$$

-- Oblige l’acceptation des CGU
CREATE TRIGGER trg_signup_require_terms
BEFORE INSERT ON signup
FOR EACH ROW
BEGIN
    IF NEW.conditions_acceptees = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Les CGU doivent être acceptées.';
    END IF;
END$$

-- Décrémente places_disponibles après réservation
CREATE TRIGGER trg_after_reservation_insert
AFTER INSERT ON Reservations
FOR EACH ROW
BEGIN
    UPDATE Trajets
    SET places_disponibles = places_disponibles - 1
    WHERE id = NEW.trajet_id AND etat_trajet = 'actif';
END$$

-- Génère code réservation si absent
CREATE TRIGGER trg_before_reservation_insert
BEFORE INSERT ON Reservations
FOR EACH ROW
BEGIN
    IF NEW.code_reservation IS NULL OR NEW.code_reservation = '' THEN
        SET NEW.code_reservation = CONCAT('RES-', UPPER(SUBSTRING(MD5(RAND()),1,8)));
    END IF;
END$$

DELIMITER ;

-- ===========================================================================
-- 8. VUES
-- ===========================================================================

CREATE VIEW v_user_with_profile AS
SELECT
    s.id,
    s.numero_client,
    s.numero_compte,
    s.nom,
    s.prenom,
    s.email,
    s.telephone,
    s.phone_code,
    s.country,
    s.code_postal,
    s.ville,
    s.region,
    s.adresse_postale,
    s.date_naissance,
    s.date_inscription,
    s.type_utilisateur,
    s.photo_profil,
    s.statut AS user_statut,
    s.derniere_connexion,
    p.photo_url,
    p.bio,
    p.preferences,
    p.notifications_actives,
    p.langue_preferee,
    TIMESTAMPDIFF(YEAR, s.date_naissance, CURDATE()) AS age
FROM signup s
LEFT JOIN profile p ON s.id = p.user_id;

CREATE VIEW v_trajet_complet AS
SELECT
    t.*,
    b.numero_immatriculation,
    b.type_bus,
    b.capacite,
    b.equipements,
    c.nom AS chauffeur_nom,
    c.prenom AS chauffeur_prenom,
    s.nom AS societe_nom,
    s.contact AS societe_contact,
    TIMEDIFF(TIME(t.heure_depart), TIME(NOW())) AS temps_restant
FROM Trajets t
LEFT JOIN Bus b ON t.bus_id = b.id
LEFT JOIN Chauffeurs c ON b.chauffeur_id = c.id
LEFT JOIN Societes s ON b.societe_id = s.id;

CREATE VIEW v_reservation_details AS
SELECT
    r.id,
    r.code_reservation,
    r.etat_reservation,
    r.date_reservation,
    r.siege_numero,
    r.montant_total,
    u.nom AS user_nom,
    u.prenom AS user_prenom,
    u.email AS user_email,
    t.ville_depart,
    t.ville_arrivee,
    t.date_depart,
    t.heure_depart,
    b.numero_immatriculation,
    s.nom AS societe_nom,
    m.methode AS moyen_paiement,
    p.etat_paiement,
    p.reference_transaction
FROM Reservations r
JOIN signup u ON r.utilisateur_id = u.id
JOIN Trajets t ON r.trajet_id = t.id
LEFT JOIN Bus b ON t.bus_id = b.id
LEFT JOIN Societes s ON b.societe_id = s.id
LEFT JOIN Moyens_de_paiement_pris_en_charge m ON r.moyen_paiement = m.id
LEFT JOIN Paiements p ON r.id = p.reservation_id;

-- ===========================================================================
-- FIN DU FICHIER STRUCTURE (V2.1)
-- ===========================================================================


SELECT * FROM signup;
DESCRIBE signup;
-- Réinitialiser le mot de passe pour kpangbanyvrdg@gmail.com (format $2b$ compatible Node.js)
UPDATE signup SET mot_de_passe = '$2b$12$DJVeaBrFUb402W/KOiRReudhSzsW38n7FVs7WQb/7aNrjkgrNLEW.' 
WHERE email = 'kpangbanyvrdg@gmail.com';

-- Réinitialiser le mot de passe pour admin@expresstrafic.com (format $2b$ compatible Node.js)
UPDATE signup SET mot_de_passe = '$2b$12$j3ufBt5.OkgJhBMR8CEJ..ngDDdsef4Tdnqx0R/kxYlp3FdqanY2W'
WHERE email = 'admin@expresstrafic.com';

select * from signup;
-- AJOUTER LA COLONNE MANQUANTE
ALTER TABLE signup ADD COLUMN tentatives_echec INT DEFAULT 0;
ALTER TABLE signup ADD COLUMN bloque_jusqua DATETIME NULL;
ALTER TABLE signup ADD COLUMN date_derniere_tentative DATETIME NULL;

SELECT DATABASE();
 show databases;
 DESCRIBE signup;
-- Créer la table tokens manquante
CREATE TABLE IF NOT EXISTS tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  type ENUM('password_reset', 'email_verification') NOT NULL,
  used TINYINT(1) DEFAULT 0,
  used_at DATETIME NULL,
  expire_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES signup(id)
);


--  ********debloquage des comptes----
-- Exécutez IMMÉDIATEMENT en base de données
UPDATE signup 
SET statut = 'actif', tentatives_echec = 0, bloque_jusqua = NULL 
WHERE email = 'kpangbanyvrdg@gmail.com';
Desc reservations;


-- modification 
-- Ajouter les colonnes manquantes pour gérer les arrêts et prix calculé
ALTER TABLE Reservations 
ADD COLUMN arret_depart VARCHAR(255) NULL,
ADD COLUMN arret_arrivee VARCHAR(255) NULL,
ADD COLUMN prix_calcule DECIMAL(10,2) NULL AFTER montant_total;

-- Optionnel : Ajouter un champ pour le moyen de paiement (si nécessaire)
ALTER TABLE Reservations 
MODIFY COLUMN moyen_paiement VARCHAR(50) NOT NULL;


-- SHOW CREATE TABLE Paiements;
-- SHOW CREATE TABLE Reservations;
-- SHOW CREATE TABLE signup;
-- modification du champs 
ALTER TABLE Reservations ADD COLUMN expires_at DATETIME NULL;
SELECT * FROM Moyens_de_paiement_pris_en_charge;

-- Ajouter la colonne ticket_pdf_url dans Reservations
ALTER TABLE Reservations 
ADD COLUMN ticket_pdf_url VARCHAR(500) NULL AFTER qr_code_data;

-- Ajouter la colonne ticket_url dans Paiements (si non existante)
ALTER TABLE Paiements 
ADD COLUMN ticket_url VARCHAR(500) NULL AFTER details_transaction;

-- Ajouter la colonne expires_at dans Reservations
ALTER TABLE Reservations 
ADD COLUMN expires_at DATETIME NULL AFTER date_reservation;

-- Ajouter la colonne provider dans Paiements pour Mobile Money
ALTER TABLE Paiements 
ADD COLUMN provider VARCHAR(50) NULL AFTER methode;