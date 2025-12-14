import React from "react";
import { Link } from "react-router-dom";

import { Card, Grid, Button } from "../../../Components/UI";

import "../stylesStatic/About.css";
import { aboutSections, detailedAboutData } from "../dataStatic/aboutData";

// Version simple du composant About
export const SimpleAbout = () => {
  return (
    <div className="about-container">
      <Card className="about-header">
        <h1>{aboutSections.header.title}</h1>
        <p>{aboutSections.header.subtitle}</p>
      </Card>

      <div className="about-content">
        <Card className="mission-section">
          <h2>{aboutSections.mission.title}</h2>
          <p>{aboutSections.mission.content}</p>
        </Card>

        <Card className="values-section">
          <h2>{aboutSections.values.title}</h2>
          <Grid cols={3} gap="medium" className="values-grid">
            {aboutSections.values.items.map((value, index) => (
              <Card key={index} className="value-card">
                <h3>{value.icon} {value.title}</h3>
                <p>{value.description}</p>
              </Card>
            ))}
          </Grid>
        </Card>

        <Card className="team-section">
          <h2>{aboutSections.team.title}</h2>
          <p>{aboutSections.team.content}</p>
        </Card>
      </div>
    </div>
  );
};

// Version détaillée du composant About
export const DetailedAbout = () => {
  return (
    <main aria-labelledby="about-title" className="about-main">
      <Card className="about-header-detailed">
        <h1 id="about-title" className="about-title">{detailedAboutData.title}</h1>
        <p className="about-lead">{detailedAboutData.lead}</p>
      </Card>

      {detailedAboutData.sections.map((section, index) => (
        <Card 
          key={section.id} 
          aria-labelledby={section.id}
          className={`about-section ${section.className || ''}`}
        >
          <h2 id={section.id}>{section.title}</h2>
          
          {section.content && <p>{section.content}</p>}
          
          {section.type === 'list' && (
            <ul>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )}
          
          {section.type === 'quote' && (
            <blockquote className="about-blockquote">
              {section.content}
            </blockquote>
          )}
          
          {section.note && (
            <p className="about-countries">{section.note}</p>
          )}
          
          {section.additionalContent && (
            <p>{section.additionalContent}</p>
          )}
        </Card>
      ))}

      {/* Section Formulaire pour les transporteurs */}
      <Card className="about-section">
        <h2>Devenez Partenaire Transporteur</h2>
        <p>
          Rejoignez notre réseau de transporteurs et bénéficiez de nos solutions digitales innovantes 
          pour optimiser votre activité et développer votre entreprise.
        </p>
        
        <div className="transport-form-preview">
          <p>
            <strong>Intéressé pour rejoindre notre plateforme ?</strong>
          </p>
          <p>
            Remplissez notre formulaire de partenariat et notre équipe vous contactera 
            dans les plus brefs délais pour discuter de vos besoins spécifiques.
          </p>
          
          <div className="about-actions">
            <Button
              variant="primary"
              onClick={() => window.location.href = "/transport-form"}
            >
              Devenir Partenaire Transporteur
            </Button>
          </div>
        </div>
      </Card>

      <Card className="about-footer">
        <p>
          {detailedAboutData.footer.content} <br />
          <Link to={detailedAboutData.footer.link.to} className="about-link">
            {detailedAboutData.footer.link.text}
          </Link>
        </p>
      </Card>
    </main>
  );
};

// Composant About principal
const About = ({ variant = "detailed" }) => {
  return variant === "simple" ? <SimpleAbout /> : <DetailedAbout />;
};

export default About;