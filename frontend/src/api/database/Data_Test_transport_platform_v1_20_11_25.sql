-- ===========================================================================
-- DATA.sql – DONNÉES DE TEST POUR TRANSPORT PLATFORM V2.1
-- A exécuter APRÈS le fichier de structure
-- Base : transport_platformv1
-- ===========================================================================

show tables;
USE transport_platform_v1;

-- ===========================================================================
-- 1. TABLE COUNTRIES (PAYS + INDICATIF)
-- ===========================================================================

INSERT INTO countries (name, code) VALUES
('Afghanistan', '+93'),
('Afrique du Sud', '+27'),
('Albanie', '+355'),
('Algérie', '+213'),
('Allemagne', '+49'),
('Andorre', '+376'),
('Angola', '+244'),
('Antigua-et-Barbuda', '+1-268'),
('Arabie Saoudite', '+966'),
('Argentine', '+54'),
('Arménie', '+374'),
('Australie', '+61'),
('Autriche', '+43'),
('Azerbaïdjan', '+994'),
('Bahamas', '+1-242'),
('Bahreïn', '+973'),
('Bangladesh', '+880'),
('Barbade', '+1-246'),
('Belgique', '+32'),
('Belize', '+501'),
('Bénin', '+229'),
('Bhoutan', '+975'),
('Biélorussie', '+375'),
('Birmanie (Myanmar)', '+95'),
('Bolivie', '+591'),
('Bosnie-Herzégovine', '+387'),
('Botswana', '+267'),
('Brésil', '+55'),
('Brunei', '+673'),
('Bulgarie', '+359'),
('Burkina Faso', '+226'),
('Burundi', '+257'),
('Cambodge', '+855'),
('Cameroun', '+237'),
('Canada', '+1'),
('Cap-Vert', '+238'),
('Chili', '+56'),
('Chine', '+86'),
('Chypre', '+357'),
('Colombie', '+57'),
('Comores', '+269'),
('Congo', '+242'),
('Corée du Sud', '+82'),
('Costa Rica', '+506'),
('Croatie', '+385'),
('Cuba', '+53'),
('Côte d''Ivoire', '+225'),
('Danemark', '+45'),
('Djibouti', '+253'),
('Dominique', '+1-767'),
('Égypte', '+20'),
('Émirats arabes unis', '+971'),
('Équateur', '+593'),
('Érythrée', '+291'),
('Espagne', '+34'),
('Estonie', '+372'),
('États-Unis', '+1'),
('Éthiopie', '+251'),
('Fidji', '+679'),
('Finlande', '+358'),
('France', '+33'),
('Gabon', '+241'),
('Gambie', '+220'),
('Géorgie', '+995'),
('Ghana', '+233'),
('Grèce', '+30'),
('Grenade', '+1-473'),
('Guatemala', '+502'),
('Guinée', '+224'),
('Guinée-Bissau', '+245'),
('Guinée équatoriale', '+240'),
('Guyana', '+592'),
('Haïti', '+509'),
('Honduras', '+504'),
('Hongrie', '+36'),
('Îles Cook', '+682'),
('Îles Marshall', '+692'),
('Inde', '+91'),
('Indonésie', '+62'),
('Irak', '+964'),
('Iran', '+98'),
('Irlande', '+353'),
('Islande', '+354'),
('Israël', '+972'),
('Italie', '+39'),
('Jamaïque', '+1-876'),
('Japon', '+81'),
('Jordanie', '+962'),
('Kazakhstan', '+7'),
('Kenya', '+254'),
('Kirghizistan', '+996'),
('Kiribati', '+686'),
('Koweït', '+965'),
('Laos', '+856'),
('Lesotho', '+266'),
('Lettonie', '+371'),
('Liban', '+961'),
('Liberia', '+231'),
('Libye', '+218'),
('Liechtenstein', '+423'),
('Lituanie', '+370'),
('Luxembourg', '+352'),
('Macédoine du Nord', '+389'),
('Madagascar', '+261'),
('Malaisie', '+60'),
('Malawi', '+265'),
('Maldives', '+960'),
('Mali', '+223'),
('Malte', '+356'),
('Maroc', '+212'),
('Maurice', '+230'),
('Mauritanie', '+222'),
('Mexique', '+52'),
('Micronésie', '+691'),
('Moldavie', '+373'),
('Monaco', '+377'),
('Mongolie', '+976'),
('Monténégro', '+382'),
('Mozambique', '+258'),
('Namibie', '+264'),
('Nauru', '+674'),
('Népal', '+977'),
('Nicaragua', '+505'),
('Niger', '+227'),
('Nigéria', '+234'),
('Norvège', '+47'),
('Nouvelle-Zélande', '+64'),
('Oman', '+968'),
('Ouganda', '+256'),
('Ouzbékistan', '+998'),
('Pakistan', '+92'),
('Palaos', '+680'),
('Panama', '+507'),
('Papouasie-Nouvelle-Guinée', '+675'),
('Paraguay', '+595'),
('Pays-Bas', '+31'),
('Pérou', '+51'),
('Philippines', '+63'),
('Pologne', '+48'),
('Portugal', '+351'),
('Qatar', '+974'),
('République centrafricaine', '+236'),
('République démocratique du Congo', '+243'),
('République dominicaine', '+1-809'),
('Roumanie', '+40'),
('Royaume-Uni', '+44'),
('Russie', '+7'),
('Rwanda', '+250'),
('Saint-Kitts-et-Nevis', '+1-869'),
('Saint-Marin', '+378'),
('Saint-Vincent-et-les-Grenadines', '+1-784'),
('Sainte-Lucie', '+1-758'),
('Salvador', '+503'),
('Samoa', '+685'),
('Sao Tomé-et-Principe', '+239'),
('Sénégal', '+221'),
('Serbie', '+381'),
('Seychelles', '+248'),
('Sierra Leone', '+232'),
('Singapour', '+65'),
('Slovaquie', '+421'),
('Slovénie', '+386'),
('Somalie', '+252'),
('Soudan', '+249'),
('Soudan du Sud', '+211'),
('Sri Lanka', '+94'),
('Suède', '+46'),
('Suisse', '+41'),
('Suriname', '+597'),
('Syrie', '+963'),
('Tadjikistan', '+992'),
('Tanzanie', '+255'),
('Tchad', '+235'),
('Thaïlande', '+66'),
('Timor oriental', '+670'),
('Togo', '+228'),
('Tonga', '+676'),
('Trinité-et-Tobago', '+1-868'),
('Tunisie', '+216'),
('Turkménistan', '+993'),
('Turquie', '+90'),
('Tuvalu', '+688'),
('Ukraine', '+380'),
('Uruguay', '+598'),
('Vanuatu', '+678'),
('Vatican', '+379'),
('Venezuela', '+58'),
('Viêt Nam', '+84'),
('Zambie', '+260'),
('Zimbabwe', '+263');

-- ===========================================================================
-- 2. PHONE_CODES (ÉCHANTILLON – PEUT ÊTRE ÉTENDU)
-- ===========================================================================

INSERT INTO phone_codes (country_name, iso_code, phone_code, region) VALUES
('France', 'FR', '+33', 'Europe'),
('Belgique', 'BE', '+32', 'Europe'),
('Suisse', 'CH', '+41', 'Europe'),
('Luxembourg', 'LU', '+352', 'Europe'),
('Canada', 'CA', '+1', 'Amérique du Nord'),
('Côte d''Ivoire', 'CI', '+225', 'Afrique'),
('Cameroun', 'CM', '+237', 'Afrique'),
('Gabon', 'GA', '+241', 'Afrique'),
('Sénégal', 'SN', '+221', 'Afrique'),
('Maroc', 'MA', '+212', 'Afrique');

-- ===========================================================================
-- 3. UTILISATEURS (signup)
-- ===========================================================================

INSERT INTO signup (id, numero_client, numero_compte, nom, prenom, email, mot_de_passe, telephone, phone_code, country, code_postal, ville, region, adresse_postale, date_naissance, conditions_acceptees, type_utilisateur)
VALUES
(1, 'CLT-20241201-0001', 'CPT-20241201-0001', 'Martin', 'Sophie', 'sophie.martin@email.com', '$2y$10$hashedpassword1', '123456789', '+33', 'France', '75001', 'Paris', 'Île-de-France', '15 Rue de la République', '1990-05-15', 1, 'client'),
(2, 'CLT-20241201-0002', 'CPT-20241201-0002', 'Dubois', 'Pierre', 'pierre.dubois@email.com', '$2y$10$hashedpassword2', '123456790', '+33', 'France', '69001', 'Lyon', 'Auvergne-Rhône-Alpes', '22 Avenue des Tilleuls', '1985-08-22', 1, 'client'),
(3, 'CLT-20241201-0003', 'CPT-20241201-0003', 'Bernard', 'Marie', 'marie.bernard@email.com', '$2y$10$hashedpassword3', '123456791', '+33', 'France', '13001', 'Marseille', 'Provence-Alpes-Côte d''Azur', '8 Boulevard Maritime', '1992-12-03', 1, 'client'),
(4, 'CLT-20241201-0004', 'CPT-20241201-0004', 'Moreau', 'Thomas', 'thomas.moreau@email.com', '$2y$10$hashedpassword4', '123456792', '+33', 'France', '33000', 'Bordeaux', 'Nouvelle-Aquitaine', '45 Rue Sainte-Catherine', '1988-03-18', 1, 'client'),
(5, 'CLT-20241201-0005', 'CPT-20241201-0005', 'Admin', 'System', 'admin@transport.com', '$2y$10$hashedpassword5', '123456793', '+33', 'France', '75008', 'Paris', 'Île-de-France', '1 Avenue de l''Opéra', '1980-01-01', 1, 'admin');

-- ===========================================================================
-- 4. PROFILS (profile)
-- ===========================================================================

INSERT INTO profile (user_id, photo_url, bio, preferences, notifications_actives, langue_preferee)
VALUES
(1, '/photos/sophie.jpg', 'Voyageuse régulière pour le travail', '{"pref_siege":"fenetre","notif_sms":true}', 1, 'fr'),
(2, '/photos/pierre.jpg', 'Étudiant en déplacement', '{"pref_siege":"couloir","notif_email":true}', 1, 'fr'),
(3, '/photos/marie.jpg', 'Touriste passionnée', '{"pref_siege":"fenetre","notif_push":true}', 1, 'fr'),
(4, '/photos/thomas.jpg', 'Commercial en déplacement', '{"pref_siege":"couloir","notif_sms":false}', 0, 'en'),
(5, '/photos/admin.jpg', 'Administrateur système', '{"pref_siege":"indifferent","notif_email":true}', 1, 'fr');

-- ===========================================================================
-- 5. HISTORIQUE LOGIN
-- ===========================================================================

INSERT INTO login (user_id, email, adresse_ip, user_agent, statut)
VALUES
(1, 'sophie.martin@email.com', '192.168.1.100', 'Mozilla/5.0 Chrome', 'réussi'),
(2, 'pierre.dubois@email.com', '192.168.1.101', 'Mozilla/5.0 Safari', 'réussi'),
(3, 'marie.bernard@email.com', '192.168.1.102', 'Mozilla/5.0 iPhone', 'réussi'),
(4, 'thomas.moreau@email.com', '192.168.1.103', 'Mozilla/5.0 Linux', 'réussi'),
(5, 'admin@transport.com', '10.0.0.1', 'Mozilla/5.0 Windows', 'réussi');

-- ===========================================================================
-- 6. CONTACT
-- ===========================================================================

INSERT INTO contact (firstName, lastName, email, telephone, sujet, sousSujet, message, statut)
VALUES
('Alice', 'Durand', 'alice@example.com', '+33111111111', 'Réservation', 'Paiement', 'Problème de paiement', 'nouveau'),
('Bruno', 'Lefevre', 'bruno@example.com', '+33222222222', 'Service client', 'Retard', 'Bus en retard', 'repondu'),
('Céline', 'Roux', 'celine@example.com', '+33333333333', 'Information', 'Bagages', 'Infos bagages', 'resolu'),
('David', 'Simon', 'david@example.com', '+33444444444', 'Réclamation', 'Confort', 'Siège cassé', 'lu'),
('Elodie', 'Mercier', 'elodie@example.com', '+33555555555', 'Suggestion', 'Amélioration', 'Plus de trajets', 'nouveau');

-- ===========================================================================
-- 7. SOCIÉTÉS
-- ===========================================================================

INSERT INTO Societes (id, nom, adresse, contact, email, site_web, date_creation, description)
VALUES
('SOC001', 'Transport Express France', 'Paris', '+33123456789', 'contact@tef.fr', 'www.tef.fr', '2020-01-15', 'Leader interurbain'),
('SOC002', 'Bus Premium Line', 'Lyon', '+33472345678', 'info@bpl.fr', 'www.bpl.fr', '2019-03-20', 'Service luxe'),
('SOC003', 'Eco Voyageurs', 'Marseille', '+33491345678', 'contact@eco.fr', 'www.eco.fr', '2021-06-10', 'Transport écologique'),
('SOC004', 'Confort Bus', 'Bordeaux', '+33556345678', 'reservation@cb.fr', 'www.cb.fr', '2018-11-05', 'Ultra confort'),
('SOC005', 'Rapid Transit', 'Toulouse', '+33561345678', 'info@rt.fr', 'www.rt.fr', '2022-02-28', 'Transport rapide');

-- ===========================================================================
-- 8. CHAUFFEURS
-- ===========================================================================

INSERT INTO Chauffeurs (id, nom, prenom, numero_de_telephone, email, numero_permis, date_embauche, date_naissance, adresse, statut)
VALUES
('CH001', 'Dupont', 'Jean', '+33612345678', 'jean.dupont@tef.fr', 'PERMIS111', '2021-03-01', '1985-07-15', 'Paris', 'actif'),
('CH002', 'Leroy', 'Michel', '+33623456789', 'michel.leroy@bpl.fr', 'PERMIS222', '2020-05-15', '1978-11-22', 'Lyon', 'actif'),
('CH003', 'Garcia', 'Patrick', '+33634567890', 'patrick.garcia@eco.fr', 'PERMIS333', '2022-01-10', '1990-03-30', 'Marseille', 'actif'),
('CH004', 'Fournier', 'Luc', '+33645678901', 'luc.fournier@cb.fr', 'PERMIS444', '2019-08-20', '1982-09-14', 'Bordeaux', 'actif'),
('CH005', 'Morel', 'David', '+33656789012', 'david.morel@rt.fr', 'PERMIS555', '2021-11-05', '1987-12-08', 'Toulouse', 'actif');

-- ===========================================================================
-- 9. MOYENS DE PAIEMENT
-- ===========================================================================

INSERT INTO Moyens_de_paiement_pris_en_charge (id, methode, description, etat, frais_pourcentage)
VALUES
('MP001', 'Mobile Money', 'Paiement mobile', 'actif', 1.50),
('MP002', 'Visa', 'Paiement Visa', 'actif', 2.00),
('MP003', 'Mastercard', 'Paiement Mastercard', 'actif', 2.00),
('MP004', 'PayPal', 'Paiement Paypal', 'actif', 2.50),
('MP005', 'Carte bancaire', 'Paiement bancaire', 'actif', 2.00);

-- ===========================================================================
-- 10. BUS
-- ===========================================================================

INSERT INTO Bus (id, numero_immatriculation, capacite, type_bus, chauffeur_id, societe_id, equipements, annee_fabrication, couleur, statut, date_mise_service, kilometrage)
VALUES
('BUS01', 'AB-123-CD', 50, 'premium', 'CH001', 'SOC001', '["wifi","usb","toilette"]', 2022, 'Bleu', 'actif', '2022-03-01', 15000),
('BUS02', 'EF-456-GH', 45, 'luxe', 'CH002', 'SOC002', '["wifi","usb","cuir","service"]', 2023, 'Noir', 'actif', '2023-04-15', 8000),
('BUS03', 'IJ-789-KL', 60, 'standard', 'CH003', 'SOC003', '["usb","clim"]', 2021, 'Vert', 'actif', '2021-06-10', 30000),
('BUS04', 'MN-012-OP', 48, 'premium', 'CH004', 'SOC004', '["wifi","usb","bagages"]', 2022, 'Blanc', 'actif', '2022-09-05', 12000),
('BUS05', 'QR-345-ST', 52, 'standard', 'CH005', 'SOC005', '["usb","toilette"]', 2021, 'Gris', 'actif', '2021-11-20', 28000);

-- ===========================================================================
-- 11. TRAJETS (DATES EN JANVIER 2026)
-- ===========================================================================

INSERT INTO Trajets (id, ville_depart, ville_arrivee, date_depart, heure_depart, duree, prix, bus_id, places_total, places_disponibles, description, conditions_annulation)
VALUES
('TR001', 'Paris', 'Lyon', '2026-01-05', '08:00:00', '04:30:00', 45.00, 'BUS01', 50, 45, 'Trajet premium', 'Annulation 24h avant'),
('TR002', 'Lyon', 'Marseille', '2026-01-07', '14:30:00', '03:45:00', 38.50, 'BUS02', 45, 40, 'Service luxe', 'Annulation 12h avant'),
('TR003', 'Marseille', 'Nice', '2026-01-04', '09:15:00', '02:30:00', 25.00, 'BUS03', 60, 55, 'Économique', 'Annulation 6h avant'),
('TR004', 'Bordeaux', 'Toulouse', '2026-01-10', '16:45:00', '02:15:00', 22.00, 'BUS04', 48, 42, 'Confort', 'Annulation 24h avant'),
('TR005', 'Lille', 'Paris', '2026-01-12', '07:30:00', '02:45:00', 28.00, 'BUS05', 52, 48, 'Direct', 'Annulation 8h avant');

-- ===========================================================================
-- 12. ARRETS
-- ===========================================================================

INSERT INTO Arrets (trajet_id, nom_arret, ordre, heure_arrivee, heure_depart, prix_arret, adresse_arret)
VALUES
('TR001', 'Fontainebleau', 1, '09:30:00', '09:45:00', 40.00, 'Gare routière de Fontainebleau'),
('TR001', 'Dijon', 2, '11:15:00', '11:30:00', 35.00, 'Gare routière de Dijon'),
('TR002', 'Orange', 1, '16:00:00', '16:15:00', 32.00, 'Gare routière d''Orange'),
('TR003', 'Toulon', 1, '10:45:00', '11:00:00', 20.00, 'Gare routière de Toulon'),
('TR004', 'Montauban', 1, '17:45:00', '18:00:00', 18.00, 'Gare routière de Montauban');

-- ===========================================================================
-- 13. RÉSERVATIONS
-- ===========================================================================

INSERT INTO Reservations (id, utilisateur_id, trajet_id, siege_numero, etat_reservation, moyen_paiement, montant_total, code_reservation)
VALUES
(1, 1, 'TR001', 5, 'confirmee', 'MP002', 45.00, 'RES-A1B2C3D4'),
(2, 2, 'TR001', 12, 'confirmee', 'MP001', 45.00, 'RES-E5F6G7H8'),
(3, 3, 'TR002', 8, 'confirmee', 'MP003', 38.50, 'RES-I9J0K1L2'),
(4, 4, 'TR003', 15, 'confirmee', 'MP002', 25.00, 'RES-M3N4O5P6'),
(5, 1, 'TR004', 22, 'en_attente', 'MP001', 22.00, 'RES-Q7R8S9T0');

-- ===========================================================================
-- 14. PAIEMENTS
-- ===========================================================================

INSERT INTO Paiements (reservation_id, montant, methode, etat_paiement, reference_transaction)
VALUES
(1, 45.00, 'carte', 'reussi', 'TXN-111'),
(2, 45.00, 'mobile_money', 'reussi', 'TXN-222'),
(3, 38.50, 'carte', 'reussi', 'TXN-333'),
(4, 25.00, 'carte', 'reussi', 'TXN-444'),
(5, 22.00, 'mobile_money', 'en_attente', 'TXN-555');

-- ===========================================================================
-- 15. POLITIQUES DE REMBOURSEMENT
-- ===========================================================================

INSERT INTO Politiques_de_remboursement (trajet_id, pourcentage_remboursement, description_condition, delai_heures, frais_annulation)
VALUES
('TR001', 100, 'Annulation 24h avant', 24, 0),
('TR002', 80, 'Annulation 12h avant', 12, 5),
('TR003', 50, 'Annulation 6h avant', 6, 10),
('TR004', 100, 'Annulation 24h avant', 24, 0),
('TR005', 70, 'Annulation 8h avant', 8, 7.50);

-- ===========================================================================
-- 16. AVIS
-- ===========================================================================

INSERT INTO Avis (utilisateur_id, trajet_id, note, commentaire, type_avis, statut)
VALUES
(1, 'TR001', 5, 'Excellent trajet, très confortable.', 'trajet', 'approuve'),
(2, 'TR001', 4, 'Bon trajet mais léger retard.', 'trajet', 'approuve'),
(3, 'TR002', 5, 'Service luxe au top !', 'trajet', 'approuve'),
(4, 'TR003', 3, 'Correct mais peut mieux faire.', 'bus', 'approuve'),
(1, 'TR004', 4, 'Trajet agréable et chauffeur sympathique.', 'trajet', 'approuve');

-- ===========================================================================
-- 17. NOTIFICATIONS
-- ===========================================================================

INSERT INTO Notifications (utilisateur_id, type_notification, titre, message, statut)
VALUES
(1, 'reservation', 'Réservation confirmée', 'Votre voyage Paris-Lyon est confirmé.', 'lu'),
(2, 'rappel', 'Rappel voyage', 'Votre départ Lyon-Marseille est prévu demain.', 'non_lu'),
(3, 'promotion', 'Promo 20%', 'Une réduction de 20% est disponible sur vos prochains trajets.', 'non_lu'),
(4, 'paiement', 'Paiement reçu', 'Votre paiement pour Marseille-Nice a été validé.', 'lu'),
(1, 'systeme', 'Maintenance', 'Une maintenance serveur est prévue cette nuit.', 'non_lu');

-- ===========================================================================
-- 18. RÉDUCTIONS
-- ===========================================================================

INSERT INTO Reductions (code, pourcentage, type_reduction, date_debut, date_fin, utilisations_max, statut)
VALUES
('BIENVENUE20', 20, 'pourcentage', '2024-01-01', '2024-12-31', 100, 'actif'),
('ETE2024', 15, 'pourcentage', '2024-06-01', '2024-08-31', 200, 'actif'),
('FIDELITE10', 10, 'pourcentage', '2024-01-01', '2024-12-31', 1000, 'actif'),
('PREMIER5', 5, 'pourcentage', '2024-01-01', '2024-12-31', 500, 'actif'),
('SPECIAL50', 50, 'pourcentage', '2024-12-01', '2024-12-25', 50, 'actif');

-- ===========================================================================
-- 19. PANIER (carts + cart_items) – multi-trajets
-- ===========================================================================

INSERT INTO carts (id, user_id, total_amount, currency, status, source, expires_at, metadata)
VALUES
(1, 1, 83.50, 'EUR', 'en_cours', 'web', DATE_ADD(NOW(), INTERVAL 1 DAY), '{"note":"Panier test Sophie"}'),
(2, 2, 45.00, 'EUR', 'valide', 'web', DATE_ADD(NOW(), INTERVAL 1 DAY), '{"note":"Panier confirmé Pierre"}');

INSERT INTO cart_items (cart_id, trajet_id, quantity, unit_price, total_price, seat_numbers, passenger_info)
VALUES
(1, 'TR001', 1, 45.00, 45.00, '[5]', '{"passagers":[{"nom":"Martin","prenom":"Sophie"}]}'),
(1, 'TR003', 1, 25.00, 25.00, '[15]', '{"passagers":[{"nom":"Martin","prenom":"Sophie"}]}'),
(2, 'TR002', 1, 38.50, 38.50, '[8]', '{"passagers":[{"nom":"Dubois","prenom":"Pierre"}]}');

-- ===========================================================================
-- 20. FRAIS DE SERVICE (service_fees)
-- ===========================================================================

INSERT INTO service_fees (name, fee_type, value, apply_on, context, active, start_date, end_date, description)
VALUES
('Frais standard', 'pourcentage', 5.00, 'transaction', 'standard', 1, NULL, NULL, 'Frais de service standard de 5% par transaction'),
('Haute saison', 'pourcentage', 10.00, 'billet', 'haute_saison', 1, '2026-07-01', '2026-08-31', 'Frais supplémentaires en haute saison'),
('Paiement mobile', 'fixe', 1.00, 'transaction', 'paiement_mobile', 1, NULL, NULL, 'Frais fixe pour paiements mobile money');

-- ===========================================================================
-- 21. SYSTEM SETTINGS
-- ===========================================================================

INSERT INTO system_settings (id, maintenance_mode, maintenance_message, maintenance_since, default_language, session_timeout_minutes, password_expiry_months, inactivity_warning_months, inactivity_deletion_months)
VALUES
(1, 0, 'Le site est actuellement disponible.', NULL, 'fr', 10, 6, 6, 12);

-- ===========================================================================
-- 22. EMAIL TEMPLATES
-- ===========================================================================

INSERT INTO email_templates (id, name, subject, html_content, variables, active)
VALUES
(1, 'reservation_confirmation', 'Votre réservation est confirmée', 
'<h1>Confirmation de réservation</h1><p>Bonjour {{prenom}},</p><p>Votre réservation {{code_reservation}} est confirmée pour le trajet {{trajet}} le {{date_depart}} à {{heure_depart}}.</p>', 
'["prenom","code_reservation","trajet","date_depart","heure_depart"]', 1),

(2, 'payment_failed', 'Problème sur votre paiement', 
'<h1>Paiement échoué</h1><p>Bonjour {{prenom}},</p><p>Votre paiement pour la réservation {{code_reservation}} a échoué.</p><p><a href="{{lien_paiement}}">Cliquez ici pour réessayer</a></p>', 
'["prenom","code_reservation","lien_paiement"]', 1),

(3, 'departure_reminder', 'Votre voyage de demain approche', 
'<h1>Rappel de départ</h1><p>Bonjour {{prenom}},</p><p>Votre trajet {{trajet}} partira le {{date_depart}} à {{heure_depart}}.</p><p>Siège : {{siege}}, Bus : {{bus}}, Chauffeur : {{chauffeur}}</p>', 
'["prenom","trajet","date_depart","heure_depart","siege","bus","chauffeur"]', 1),

(4, 'cart_abandoned', 'Vous avez laissé vos billets en attente…', 
'<h1>Billets en attente</h1><p>Bonjour {{prenom}},</p><p>Vous avez des billets en attente dans votre panier.</p><p>{{resume_panier}}</p><p><a href="{{lien_panier}}">Finaliser ma réservation</a></p>', 
'["prenom","resume_panier","lien_panier"]', 1),

(5, 'maintenance_info', 'Maintenance planifiée du site', 
'<h1>Maintenance</h1><p>Bonjour {{prenom}},</p><p>Notre plateforme sera en maintenance le {{date_maintenance}}.</p>', 
'["prenom","date_maintenance"]', 1);

-- ===========================================================================
-- 23. EMAIL LOGS (exemples)
-- ===========================================================================

INSERT INTO email_logs (user_id, template_id, to_email, status, meta)
VALUES
(1, 1, 'sophie.martin@email.com', 'envoye', '{"code_reservation":"RES-A1B2C3D4"}'),
(2, 3, 'pierre.dubois@email.com', 'envoye', '{"trajet":"Lyon - Marseille"}');

-- ===========================================================================
-- 24. SMS CODES (validation SMS)
-- ===========================================================================

INSERT INTO sms_codes (user_id, phone, code, channel, expire_at, used)
VALUES
(1, '+33123456789', '123456', 'signup', DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0),
(2, '+33123456790', '654321', 'login', DATE_ADD(NOW(), INTERVAL 10 MINUTE), 1);

-- ===========================================================================
-- 25. USER TOKENS (validation email / reset mdp)
-- ===========================================================================

INSERT INTO user_tokens (user_id, token, type, expire_at, used)
VALUES
(1, 'TOKEN-VALID-EMAIL-USER1', 'email_validation', DATE_ADD(NOW(), INTERVAL 1 DAY), 0),
(2, 'TOKEN-RESET-MDP-USER2', 'password_reset', DATE_ADD(NOW(), INTERVAL 1 DAY), 0);

-- ===========================================================================
-- 26. SESSIONS (exemples)
-- ===========================================================================

INSERT INTO sessions (user_id, token, ip_address, user_agent, created_at, expires_at, is_active)
VALUES
(1, 'SESSION-TOKEN-USER1', '192.168.1.100', 'Mozilla/5.0 Chrome', NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE), 1),
(5, 'SESSION-TOKEN-ADMIN', '10.0.0.1', 'Mozilla/5.0 Windows', NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE), 1);

-- ===========================================================================
-- 27. LOGS ACTIONS (ADMIN + CLIENT)
-- ===========================================================================

INSERT INTO logs_actions (user_id, role, action, target_type, target_id, ip_address, user_agent, details)
VALUES
(5, 'admin', 'CREATION_TRAJET', 'Trajets', 'TR006', '10.0.0.1', 'Mozilla/5.0 Windows', '{"description":"Création d''un nouveau trajet"}'),
(1, 'client', 'RESERVATION', 'Reservations', '1', '192.168.1.100', 'Mozilla/5.0 Chrome', '{"code_reservation":"RES-A1B2C3D4"}');

-- ===========================================================================
-- 28. USER JOURNEY (parcours utilisateur)
-- ===========================================================================

INSERT INTO user_journey (user_id, session_id, step, details)
VALUES
(1, 'SESSION-TOKEN-USER1', 'visite_site', '{"page":"home"}'),
(1, 'SESSION-TOKEN-USER1', 'recherche_trajet', '{"ville_depart":"Paris","ville_arrivee":"Lyon"}'),
(1, 'SESSION-TOKEN-USER1', 'ajout_panier', '{"trajet_id":"TR001"}'),
(1, 'SESSION-TOKEN-USER1', 'paiement', '{"methode":"Visa"}'),
(1, 'SESSION-TOKEN-USER1', 'reservation_confirmee', '{"code_reservation":"RES-A1B2C3D4"}');

INSERT INTO email_templates (name, subject, html_content, variables, active) VALUES
('password_reset', 'Réinitialisation de votre mot de passe',
'<h1>Réinitialisation de mot de passe</h1><p>Bonjour {{prenom}},</p><p>Vous avez demandé la réinitialisation de votre mot de passe.</p><p><a href="{{reset_link}}">Cliquez ici pour réinitialiser votre mot de passe</a></p><p>Ce lien expirera dans {{expires_in}}.</p>',
'["prenom","reset_link","expires_in"]', 1),

('password_reset_admin', 'Réinitialisation de votre mot de passe administrateur',
'<h1>Réinitialisation mot de passe admin</h1><p>Bonjour {{prenom}} {{nom}},</p><p>Une demande de réinitialisation a été initiée pour votre compte administrateur.</p><p><a href="{{reset_link}}">Réinitialiser mon mot de passe admin</a></p><p>Lien valable {{expires_in}} - Sécurité renforcée</p>',
'["prenom","nom","reset_link","expires_in"]', 1),

('password_reset_user', 'Réinitialisation de votre mot de passe',
'<h1>Réinitialisation de mot de passe</h1><p>Bonjour {{prenom}},</p><p>Un administrateur a initié la réinitialisation de votre mot de passe.</p><p><a href="{{reset_link}}">Cliquez ici pour définir un nouveau mot de passe</a></p><p>Inité par: {{initiated_by}}</p><p>Lien valable: {{expires_in}}</p>',
'["prenom","reset_link","initiated_by","expires_in"]', 1);
-- ===========================================================================
-- FIN DATA.sql
-- ===========================================================================
