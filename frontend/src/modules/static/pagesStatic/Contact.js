// frontend/src/modules/static/pagesStatic/Contact.js
import React, { useState, useMemo } from "react";

import { contactService } from "../../../api/";
import { Alert, Card, Input, Select, Button, TextArea } from "../../../Components/UI";

import { 
  contactFormConfig,
  contactInfo,
  successMessages,
  errorMessages
} from "../dataStatic/contactData";

import "../stylesStatic/Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telephone: '',
    sujet: '',
    sousSujet: '',
    message: '',
    indicatif: '+33'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [errors, setErrors] = useState({});

  // ✅ CORRECTION : handleChange qui prend l'événement
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "sujet" ? { sousSujet: "" } : {})
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const sousSujetOptions = useMemo(() => {
    if (!formData.sujet) {
      return [{ value: "", label: "Choisir un sujet d'abord" }];
    }
    
    const sousSujets = contactFormConfig.sousSujetOptions?.[formData.sujet] || [];
    return [
      { value: "", label: "Choisir un sous-sujet" },
      ...sousSujets.map(s => ({
        value: s,
        label: s
      }))
    ];
  }, [formData.sujet]);

  const sujetOptions = useMemo(() => {
    const sujets = contactFormConfig.sujetOptions || [];
    return [
      { value: "", label: "Choisir un sujet" },
      ...sujets.map(s => ({
        value: s,
        label: s
      }))
    ];
  }, []);

  const contactMethods = useMemo(() => {
    return contactInfo?.methods || [];
  }, []);

  const validateForm = () => {
    let newErrors = {};

    // Validation des champs requis
    if (!formData.firstName?.trim()) newErrors.firstName = "Le prénom est obligatoire";
    if (!formData.lastName?.trim()) newErrors.lastName = "Le nom est obligatoire";
    if (!formData.email?.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.sujet?.trim()) newErrors.sujet = "Le sujet est obligatoire";
    if (!formData.sousSujet?.trim()) newErrors.sousSujet = "Le sous-sujet est obligatoire";
    if (!formData.message?.trim()) newErrors.message = "Le message est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      setAlert({ show: true, type: "error", message: "Veuillez corriger les erreurs." });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await contactService.sendMessage(formData);
      if (res.data.success) {
        setAlert({ show: true, type: "success", message: successMessages.contact });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          telephone: '',
          sujet: '',
          sousSujet: '',
          message: '',
          indicatif: '+33'
        });
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      setAlert({ show: true, type: "error", message: errorMessages.generic });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <Card className="contact-card">
        <h1>Contactez-nous</h1>

        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false })}
          />
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          
          <Card className="form-section">
            <h3>Informations personnelles</h3>

            <div className="form-row">
              <Input 
                label="Prénom *" 
                name="firstName" 
                value={formData.firstName}
                error={errors.firstName} 
                onChange={handleChange} // ✅ Passe l'événement directement
                required
              />

              <Input 
                label="Nom *" 
                name="lastName" 
                value={formData.lastName}
                error={errors.lastName} 
                onChange={handleChange} // ✅ Passe l'événement directement
                required
              />
            </div>

            <div className="form-row">
              <Input 
                label="Email *" 
                name="email" 
                type="email"
                value={formData.email} 
                error={errors.email}
                onChange={handleChange} // ✅ Passe l'événement directement
                required
              />

              <Input 
                label="Téléphone" 
                name="telephone" 
                value={formData.telephone}
                onChange={handleChange} // ✅ Passe l'événement directement
              />
            </div>
          </Card>

          <Card className="form-section">
            <h3>Objet de votre demande</h3>

            <div className="form-row">
              <Select
                label="Sujet principal *"
                name="sujet"
                value={formData.sujet}
                onChange={handleChange} // ✅ Passe l'événement directement
                options={sujetOptions}
                error={errors.sujet}
                required
              />

              <Select
                label="Sous-sujet *"
                name="sousSujet"
                value={formData.sousSujet}
                onChange={handleChange} // ✅ Passe l'événement directement
                options={sousSujetOptions}
                error={errors.sousSujet}
                required
                disabled={!formData.sujet}
              />
            </div>
          </Card>

          <Card className="form-section">
            <h3>Message</h3>
            <TextArea
              label="Votre message *"
              name="message"
              value={formData.message}
              onChange={handleChange} // ✅ Passe l'événement directement
              error={errors.message}
              required
              rows={6}
            />
          </Card>

          <div className="form-actions">
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Envoyer
            </Button>
          </div>
        </form>

        <Card className="contact-info">
          <h3>{contactInfo?.title || "Nous contacter"}</h3>

          {contactMethods.length > 0 ? (
            contactMethods.map((method, i) => (
              <div key={i} className="contact-method">
                <div className="icon">{method.icon}</div>
                <div>
                  <h4>{method.title}</h4>
                  <p>{method.details}</p>
                  <small>{method.description}</small>
                </div>
              </div>
            ))
          ) : (
            <p>Aucune information de contact disponible.</p>
          )}
        </Card>
      </Card>
    </div>
  );
};

export default Contact;