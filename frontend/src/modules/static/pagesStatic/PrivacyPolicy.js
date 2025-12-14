import React from "react";
import { Card } from "../../../Components/UI";
import "../stylesStatic/PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Collecte des informations",
      content: `
        Nous collectons les informations que vous nous fournissez lorsque vous :
        <ul>
          <li>Créez un compte sur notre plateforme</li>
          <li>Effectuez une réservation</li>
          <li>Nous contactez via le formulaire de contact</li>
          <li>Vous abonnez à notre newsletter</li>
        </ul>
        Les informations collectées incluent : nom, prénom, email, téléphone, 
        adresse postale, et informations de paiement.
      `
    },
    {
      title: "2. Utilisation des informations",
      content: `
        Nous utilisons vos informations pour :
        <ul>
          <li>Traiter vos réservations et paiements</li>
          <li>Vous envoyer des confirmations et mises à jour</li>
          <li>Améliorer nos services</li>
          <li>Vous envoyer des communications marketing (avec votre consentement)</li>
          <li>Répondre à vos demandes de support</li>
        </ul>
      `
    },
    {
      title: "3. Partage des informations",
      content: `
        Nous ne vendons, n'échangeons ni ne transférons vos informations 
        personnelles à des tiers, sauf dans les cas suivants :
        <ul>
          <li>Avec les transporteurs pour l'exécution de votre voyage</li>
          <li>Avec les processeurs de paiement pour le traitement des transactions</li>
          <li>Pour se conformer à des obligations légales</li>
          <li>Pour protéger nos droits, notre propriété ou notre sécurité</li>
        </ul>
      `
    },
    {
      title: "4. Protection des données",
      content: `
        Nous mettons en œuvre une variété de mesures de sécurité pour préserver 
        la sécurité de vos informations personnelles. Toutes les transactions 
        sensibles sont cryptées via SSL (Secure Socket Layer).
      `
    },
    {
      title: "5. Vos droits",
      content: `
        Conformément au RGPD, vous disposez des droits suivants :
        <ul>
          <li>Droit d'accès à vos données personnelles</li>
          <li>Droit de rectification des données inexactes</li>
          <li>Droit à l'effacement ("droit à l'oubli")</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité des données</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
        Pour exercer ces droits, contactez-nous à : privacy@transportplatform.com
      `
    },
    {
      title: "6. Conservation des données",
      content: `
        Nous conservons vos données personnelles aussi longtemps que nécessaire 
        pour fournir nos services et nous conformer à nos obligations légales. 
        Les données de réservation sont conservées pendant 5 ans pour des raisons 
        fiscales et légales.
      `
    },
    {
      title: "7. Contact",
      content: `
        Pour toute question concernant cette politique de confidentialité, 
        contactez notre Délégué à la Protection des Données :
        <br/><br/>
        <strong>Email :</strong> dpo@transportplatform.com<br/>
        <strong>Adresse :</strong> 123 Avenue des Champs, 75008 Paris<br/>
        <strong>Téléphone :</strong> +33 1 23 45 67 89
      `
    }
  ];

  return (
    <div className="privacy-container">
      <Card className="privacy-content">
        <h1>Politique de Confidentialité</h1>
        
        {sections.map((section, index) => (
          <Card key={index} className="privacy-section">
            <h2>{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default PrivacyPolicy;