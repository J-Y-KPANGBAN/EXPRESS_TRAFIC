import React, { useState } from "react";

import { transportFormData } from "../dataStatic/transportFormData";

import { Card, Input, Select, Button, TextArea, Alert } from "../../../Components/UI";

import "../stylesStatic/TransportForm.css";


//C:\Users\Jean-YvesDG\Downloads\ExpressTrafic\frontend\src\modules\static\stylesStatic\TransportForm.css
const FormulaireTransport = () => {
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    country: '',
    fleetSize: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [errors, setErrors] = useState({});

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const hideAlert = () => {
    setAlert({ show: false, type: '', message: '' });
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    transportFormData.fields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} est obligatoire`;
      }
      
      if (field.name === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('error', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsSubmitting(true);
    hideAlert();

    try {
      // Logique d'envoi du formulaire
      console.log('Données du formulaire:', formData);
      showAlert('success', 'Formulaire envoyé avec succès!');
      setFormData({
        company: '',
        contact: '',
        email: '',
        phone: '',
        country: '',
        fleetSize: '',
        message: ''
      });
    } catch (error) {
      console.error('Erreur envoi formulaire:', error);
      showAlert('error', 'Erreur lors de l\'envoi du formulaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      label: `${field.label} ${field.required ? '*' : ''}`,
      name: field.name,
      value: formData[field.name],
      onChange: (value) => handleChange(field.name, value),
      error: errors[field.name],
      required: field.required,
      disabled: isSubmitting,
      placeholder: field.placeholder
    };

    switch (field.type) {
      case 'select':
        return (
          <Select
            {...commonProps}
            options={[
              { value: '', label: 'Sélectionnez...' },
              ...field.options.map(option => ({
                value: option,
                label: option
              }))
            ]}
          />
        );
      
      case 'textarea':
        return (
          <TextArea
            {...commonProps}
            rows={4}
          />
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
          />
        );
    }
  };

  return (
    <div className="contact-container">
      <Card className="contact-card">
        <div className="contact-header">
          <h1>{transportFormData.title}</h1>
          <p>{transportFormData.description}</p>
        </div>

        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={hideAlert}
          />
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <Card className="form-section">
            <h3>Informations de votre entreprise</h3>
            <div className="form-grid">
              {transportFormData.fields.map((field, index) => (
                <div key={index} className="form-field">
                  {renderField(field)}
                </div>
              ))}
            </div>
          </Card>

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Envoyer la demande
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FormulaireTransport;