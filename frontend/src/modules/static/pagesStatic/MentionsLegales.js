import React from 'react';
import { Card } from '../../../Components/UI';
import "../stylesStatic/MentionsLegales.css";

const MentionsLegales = () => {
  const sections = [
    {
      title: "1. Informations générales",
      content: `
        <strong>Nom de l'entreprise :</strong> TransportPlatform SAS<br/>
        <strong>Forme juridique :</strong> Société par Actions Simplifiée<br/>
        <strong>Capital social :</strong> 50 000 €<br/>
        <strong>Siège social :</strong> 123 Avenue des Champs, 75008 Paris<br/>
        <strong>RCS :</strong> Paris 123 456 789<br/>
        <strong>Numéro TVA :</strong> FR 12 345678901<br/>
        <strong>Email :</strong> legal@transportplatform.com<br/>
        <strong>Téléphone :</strong> +33 1 23 45 67 89
      `
    },
    {
      title: "2. Hébergement",
      content: `
        <strong>Hébergeur :</strong> OVH SAS<br/>
        <strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France<br/>
        <strong>Téléphone :</strong> +33 9 72 10 10 07<br/>
        <strong>Site web :</strong> www.ovh.com
      `
    },
    {
      title: "3. Propriété intellectuelle",
      content: `
        L'ensemble de ce site relève de la législation française et internationale 
        sur le droit d'auteur et la propriété intellectuelle. Tous les droits de 
        reproduction sont réservés, y compris pour les documents téléchargeables 
        et les représentations iconographiques et photographiques.
      `
    },
    {
      title: "4. Protection des données personnelles",
      content: `
        Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée 
        et au Règlement Général sur la Protection des Données (RGPD), vous disposez 
        d'un droit d'accès, de rectification, de suppression et d'opposition aux 
        données vous concernant.
      `
    },
    {
      title: "5. Cookies",
      content: `
        Le site peut collecter automatiquement des informations standards. 
        Toutes les informations collectées indirectement ne seront utilisées 
        que pour suivre le volume, le type et la configuration du trafic utilisant 
        ce site.
      `
    },
    {
      title: "6. Responsabilité",
      content: `
        TransportPlatform ne pourra être tenu responsable des dommages directs et 
        indirects causés au matériel de l'utilisateur, lors de l'accès au site, 
        et résultant de l'utilisation d'un matériel ne répondant pas aux 
        spécifications techniques requises.
      `
    }
  ];

  return (
    <div className="mentions-container">
      <Card className="mentions-content">
        <h1>Mentions Légales</h1>
        
        {sections.map((section, index) => (
          <Card key={index} className="mentions-section">
            <h2>{section.title}</h2>
            <p dangerouslySetInnerHTML={{ __html: section.content }} />
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default MentionsLegales;