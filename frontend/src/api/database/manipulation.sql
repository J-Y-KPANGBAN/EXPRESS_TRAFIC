show databases;
use transport_platform;
show tables;
SELECT * FROM signup;

DESCRIBE signup;
SELECT * FROM moyens_de_paiement_pris_en_charge;

DESCRIBE moyens_de_paiement_pris_en_charge;


ALTER TABLE Reservations
MODIFY COLUMN etat_reservation VARCHAR(20);
UPDATE Reservations
SET etat_reservation = 'en_attente'
WHERE etat_reservation = 'en attente';
ALTER TABLE Reservations
MODIFY COLUMN etat_reservation ENUM('en_attente','confirmee','annulee','en_cours') DEFAULT 'en_attente';
DESCRIBE moyens_de_paiement_pris_en_charge;

ALTER TABLE Reservations 
ADD COLUMN qr_code_data TEXT,
ADD COLUMN ticket_downloaded TINYINT(1) DEFAULT 0,
ADD COLUMN email_sent TINYINT(1) DEFAULT 0,
ADD COLUMN email_sent_at TIMESTAMP NULL;


INSERT INTO signup (
    nom, prenom, email, mot_de_passe, telephone, ville, 
    adresse_postale, conditions_acceptees, type_utilisateur
) VALUES (
    'Admin', 'System', 'admin@test.com', 
    -- Le mot de passe sera hashé par bcrypt, utilisez un mot de passe simple pour tester
    'admin123', 
    '+33123456789', 'Paris', '123 Admin Street', 1, 'admin');

DELETE FROM signup WHERE id IN (5, 6);

-- Démarrer une transaction pour sécurité
START TRANSACTION;

-- Supprimer les réservations des utilisateurs 5 et 6
DELETE FROM reservations WHERE utilisateur_id IN (5, 6);

-- Supprimer les utilisateurs
DELETE FROM signup WHERE id IN (5, 6);

-- Vérifier que ça a fonctionné
SELECT * FROM signup WHERE id IN (5, 6);
SELECT * FROM reservations WHERE utilisateur_id IN (5, 6);

-- Si tout est bon, valider
COMMIT;

-- Si problème, annuler avec:
-- ROLLBACK;