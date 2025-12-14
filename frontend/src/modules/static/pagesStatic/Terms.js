import React from "react";
import { Card } from "../../../Components/UI";
import "../stylesStatic/Terms.css";

const Terms = () => {
  const sections = [
    {
      title: "1. Acceptation des conditions",
      content: `
        En utilisant TransportPlatform, vous acceptez sans réserve les présentes 
        Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, 
        veuillez ne pas utiliser notre plateforme.
      `
    },
    {
      title: "2. Services proposés",
      content: `
        TransportPlatform est une plateforme de réservation en ligne de billets 
        de bus. Nous mettons en relation des voyageurs avec des sociétés de 
        transport partenaires.
      `
    },
    {
      title: "3. Création de compte",
      content: `
        Pour effectuer une réservation, vous devez créer un compte en fournissant 
        des informations exactes et complètes. Vous êtes responsable de la 
        confidentialité de votre mot de passe.
      `
    },
    {
      title: "4. Réservations et paiements",
      content: `
        <strong>4.1.</strong> Les prix sont indiqués en euros et incluent la TVA.<br/>
        <strong>4.2.</strong> Le paiement est exigible immédiatement lors de la réservation.<br/>
        <strong>4.3.</strong> Vous recevrez une confirmation par email après chaque réservation.<br/>
        <strong>4.4.</strong> Les billets sont nominatifs et non transférables.
      `
    },
    {
      title: "5. Annulations et modifications",
      content: `
        <strong>5.1.</strong> Annulation plus de 48h avant le départ : remboursement à 100%<br/>
        <strong>5.2.</strong> Annulation entre 24h et 48h avant le départ : remboursement à 50%<br/>
        <strong>5.3.</strong> Annulation moins de 24h avant le départ : aucun remboursement<br/>
        <strong>5.4.</strong> Les modifications sont possibles jusqu'à 24h avant le départ
      `
    },
    {
      title: "6. Responsabilités",
      content: `
        <strong>6.1.</strong> TransportPlatform n'est pas responsable des retards 
        ou annulations dus aux transporteurs.<br/>
        <strong>6.2.</strong> Les bagages sont sous la responsabilité du voyageur.<br/>
        <strong>6.3.</strong> Le non-respect des horaires de départ entraîne la 
        perte du billet sans remboursement.
      `
    },
    {
      title: "7. Propriété intellectuelle",
      content: `
        Le contenu de la plateforme (textes, images, logos, etc.) est la propriété 
        exclusive de TransportPlatform et est protégé par le droit d'auteur.
      `
    },
    {
      title: "8. Modification des conditions",
      content: `
        Nous nous réservons le droit de modifier ces conditions à tout moment. 
        Les modifications prendront effet dès leur publication sur la plateforme.
      `
    },
    {
      title: "9. Loi applicable",
      content: `
        Les présentes conditions sont régies par le droit français. Tout litige 
        relèvera de la compétence des tribunaux de Paris.
      `
    },
    {
      title: "10. Contact",
      content: `
        Pour toute question concernant ces conditions :<br/>
        <strong>Email :</strong> legal@transportplatform.com<br/>
        <strong>Téléphone :</strong> +33 1 23 45 67 89
      `
    }
  ];

  return (
    <div className="terms-container">
      <Card className="terms-content">
        <h1>Conditions Générales d'Utilisation</h1>
        
        {sections.map((section, index) => (
          <Card key={index} className="terms-section">
            <h2>{section.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </Card>
        ))}

        <Card className="terms-date">
          <p><strong>Dernière mise à jour :</strong> 1er Janvier 2024</p>
        </Card>
      </Card>
    </div>
  );
};

export default Terms;