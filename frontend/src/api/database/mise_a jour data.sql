-- ===========================================================================
-- CORRECTIONS SQL POUR EXPRESS TRAFIC
-- ===========================================================================
USE transport_platform_v1;

-- ===========================================================================
-- 1. AJOUTER LES COLONNES MANQUANTES (AVEC VÉRIFICATION)
-- ===========================================================================

-- Vérifier et ajouter ticket_pdf_url dans Reservations
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND column_name = 'ticket_pdf_url');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE Reservations ADD COLUMN ticket_pdf_url VARCHAR(500) NULL AFTER qr_code_data',
    'SELECT "Column ticket_pdf_url already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter ticket_url dans Paiements
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Paiements' 
AND column_name = 'ticket_url');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE Paiements ADD COLUMN ticket_url VARCHAR(500) NULL AFTER details_transaction',
    'SELECT "Column ticket_url already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter provider dans Paiements
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Paiements' 
AND column_name = 'provider');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE Paiements ADD COLUMN provider VARCHAR(50) NULL AFTER methode',
    'SELECT "Column provider already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier si expires_at existe dans Reservations
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND column_name = 'expires_at');

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE Reservations ADD COLUMN expires_at DATETIME NULL AFTER date_reservation',
    'SELECT "Column expires_at already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- 2. CORRIGER LA CONTRAINTE D'UNICITÉ DES SIÈGES
-- ===========================================================================

-- Supprimer l'ancienne contrainte UNIQUE problématique
SET @constraint_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND constraint_name = 'uk_trajet_siege');

SET @sql = IF(@constraint_exists > 0, 
    'ALTER TABLE Reservations DROP INDEX uk_trajet_siege',
    'SELECT "Constraint uk_trajet_siege does not exist" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Créer un index non unique pour la performance (pas de contrainte UNIQUE)
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND index_name = 'idx_trajet_siege');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_trajet_siege ON Reservations (trajet_id, siege_numero)',
    'SELECT "Index idx_trajet_siege already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- 3. CRÉER LA TABLE POUR GÉRER LES FICHIERS PDF
-- ===========================================================================
CREATE TABLE IF NOT EXISTS pdf_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT 0,
    reservation_id INT,
    payment_id INT,
    type ENUM('ticket', 'invoice', 'receipt') DEFAULT 'ticket',
    compressed TINYINT(1) DEFAULT 0,
    original_size INT DEFAULT 0,
    compressed_size INT DEFAULT 0,
    storage_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    
    INDEX idx_reservation (reservation_id),
    INDEX idx_payment (payment_id),
    INDEX idx_type (type),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE SET NULL,
    FOREIGN KEY (payment_id) REFERENCES Paiements(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 4. AJOUTER LES INDEX POUR LES PERFORMANCES
-- ===========================================================================

-- Index pour les recherches de trajets
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Trajets' 
AND index_name = 'idx_trajet_dates');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_trajet_dates ON Trajets (ville_depart, ville_arrivee, date_depart, etat_trajet)',
    'SELECT "Index idx_trajet_dates already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour les réservations utilisateur
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND index_name = 'idx_reservation_user_dates');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_reservation_user_dates ON Reservations (utilisateur_id, date_reservation, etat_reservation)',
    'SELECT "Index idx_reservation_user_dates already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour les paiements
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Paiements' 
AND index_name = 'idx_payment_status_dates');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_payment_status_dates ON Paiements (etat_paiement, date_paiement, reservation_id)',
    'SELECT "Index idx_payment_status_dates already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour vérifier les sièges disponibles
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND index_name = 'idx_trajet_seat_status');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_trajet_seat_status ON Reservations (trajet_id, siege_numero, etat_reservation, expires_at)',
    'SELECT "Index idx_trajet_seat_status already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index pour expires_at
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations' 
AND index_name = 'idx_expires_at');

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_expires_at ON Reservations (expires_at)',
    'SELECT "Index idx_expires_at already exists" AS Message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- 5. METTRE À JOUR LES DONNÉES EXISTANTES
-- ===========================================================================

-- Mettre à jour les réservations en attente avec une date d'expiration
UPDATE Reservations 
SET expires_at = DATE_ADD(date_reservation, INTERVAL 10 MINUTE)
WHERE expires_at IS NULL AND etat_reservation = 'en_attente';

-- Mettre à jour les providers des paiements existants
UPDATE Paiements 
SET provider = CASE 
    WHEN methode = 'mobile_money' THEN 'orange'
    WHEN methode = 'carte' THEN 'stripe'
    WHEN methode = 'paypal' THEN 'paypal'
    ELSE NULL
END
WHERE provider IS NULL;

-- Créer des URLs de ticket pour les réservations confirmées
UPDATE Reservations r
LEFT JOIN Paiements p ON r.id = p.reservation_id
SET 
    r.ticket_pdf_url = CONCAT('/tickets/', r.code_reservation, '.pdf'),
    p.ticket_url = CONCAT('/tickets/', r.code_reservation, '.pdf')
WHERE r.etat_reservation = 'confirmee'
AND r.ticket_pdf_url IS NULL;

-- ===========================================================================
-- 6. CRÉER LA PROCÉDURE DE NETTOYAGE AUTOMATIQUE
-- ===========================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_cleanup_database$$

CREATE PROCEDURE sp_cleanup_database()
BEGIN
    -- 1. Supprimer les réservations en attente expirées
    DELETE FROM Reservations 
    WHERE etat_reservation = 'en_attente'
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- 2. Supprimer les sessions expirées
    DELETE FROM sessions 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- 3. Supprimer les tokens expirés
    DELETE FROM user_tokens 
    WHERE expire_at IS NOT NULL 
    AND expire_at < NOW();
    
    -- 4. Supprimer les codes SMS expirés
    DELETE FROM sms_codes 
    WHERE expire_at IS NOT NULL 
    AND expire_at < NOW();
    
    -- 5. Supprimer les paniers expirés
    DELETE FROM carts 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
    AND status = 'en_cours';
    
    -- 6. Supprimer les fichiers PDF expirés
    DELETE FROM pdf_files 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- 7. Nettoyer les logs anciens (garder 90 jours)
    DELETE FROM logs_actions 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- 8. Nettoyer les logs email anciens (garder 60 jours)
    DELETE FROM email_logs 
    WHERE sent_at < DATE_SUB(NOW(), INTERVAL 60 DAY);
    
    SELECT 'Nettoyage terminé' AS result, ROW_COUNT() AS 'rows_deleted';
END$$

DELIMITER ;

-- ===========================================================================
-- 7. CRÉER UN ÉVÉNEMENT POUR LE NETTOYAGE QUOTIDIEN (OPTIONNEL)
-- ===========================================================================
-- Décommenter si vous avez les privilèges nécessaires
/*
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS daily_cleanup;

CREATE EVENT daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
CALL sp_cleanup_database();
*/

-- ===========================================================================
-- 8. VÉRIFIER LA STRUCTURE CORRIGÉE
-- ===========================================================================
SELECT 'Vérification de la structure' AS check_title;

-- Vérifier les colonnes de Reservations
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations'
AND COLUMN_NAME IN ('ticket_pdf_url', 'expires_at')
ORDER BY ORDINAL_POSITION;

-- Vérifier les colonnes de Paiements
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'Paiements'
AND COLUMN_NAME IN ('ticket_url', 'provider')
ORDER BY ORDINAL_POSITION;

-- Vérifier les index de Reservations
SELECT INDEX_NAME, COLUMN_NAME, INDEX_TYPE, NON_UNIQUE
FROM information_schema.statistics
WHERE table_schema = DATABASE() 
AND table_name = 'Reservations'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ===========================================================================
-- 9. EXÉCUTER UN TEST DE NETTOYAGE
-- ===========================================================================
CALL sp_cleanup_database();

SELECT 'Corrections terminées avec succès!' AS final_message;

-- ***************************teste


-- 1. MODIFIER L'ENUM POUR AJOUTER 'expiree'
ALTER TABLE Reservations 
MODIFY COLUMN etat_reservation ENUM('en_attente','confirmee','annulee','en_cours','expiree','termine') DEFAULT 'en_attente';

-- 2. AJOUTER LES COLONNES MANQUANTES (SI NON EXISTANTES)
ALTER TABLE Reservations 

ADD COLUMN  expires_at DATETIME NULL AFTER date_reservation;

ALTER TABLE Paiements 
ADD COLUMN  ticket_url VARCHAR(500) NULL AFTER details_transaction,
ADD COLUMN provider VARCHAR(50) NULL AFTER methode;

-- 3. METTRE À JOUR LES DONNÉES EXISTANTES
UPDATE Reservations 
SET expires_at = DATE_ADD(date_reservation, INTERVAL 10 MINUTE)
WHERE expires_at IS NULL AND etat_reservation = 'en_attente';

UPDATE Paiements 
SET provider = CASE 
    WHEN methode = 'mobile_money' THEN 'orange'
    WHEN methode = 'carte' THEN 'stripe'
    WHEN methode = 'paypal' THEN 'paypal'
    ELSE provider
END
WHERE provider IS NULL;

-- 4. VÉRIFICATION
SELECT '✅ Structure corrigée avec succès!' AS message;
SHOW COLUMNS FROM Reservations LIKE 'etat_reservation';

-- Exécutez dans MySQL pour vérifier
SHOW TABLES LIKE 'user_tokens';
CREATE TABLE user_otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  phone_code VARCHAR(5) DEFAULT '+33',
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_otp (phone, phone_code),
  INDEX idx_expires_at (expires_at)
);
-- Dans MySQL
SELECT * FROM user_tokens WHERE type = 'password_reset' ORDER BY id DESC LIMIT 1;
-- Exécutez dans MySQL
SELECT * FROM user_tokens WHERE type = 'password_reset' ORDER BY id DESC;
ALTER TABLE user_tokens 
ADD COLUMN used_at TIMESTAMP NULL DEFAULT NULL AFTER used;
-- Dans MySQL
DESCRIBE user_tokens;
-- DOUBLE AUTHENTIFICATION  
ALTER TABLE signup 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verified_at TIMESTAMP NULL;

-- Table pour logs de sécurité------04/12/25 AT 01:27h
CREATE TABLE IF NOT EXISTS security_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL,
  identifier VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_identifier (identifier),
  INDEX idx_created_at (created_at)
);

-- Table pour OTPs
CREATE TABLE IF NOT EXISTS user_otps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  otp VARCHAR(10) NOT NULL,
  type ENUM('verification', 'password_reset', '2fa_backup') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES signup(id),
  INDEX idx_otp (otp),
  INDEX idx_expires_at (expires_at)
);

-- Table pour changements d'email
CREATE TABLE IF NOT EXISTS email_change_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  old_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  confirmed TINYINT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES signup(id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

select * from Reservations;