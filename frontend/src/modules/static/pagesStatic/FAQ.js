import React, { useState, useMemo, useCallback } from "react";

import { Card, Input, Button, Alert } from "../../../Components/UI";

import { 
  categories,
  allFAQs,
  getCategoryIcon,
  getCategoryColorClass,
  searchSynonyms,
  keywordMapping
} from "../dataStatic/faqData";

import "../stylesStatic/FAQ.css";


const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestedTerm, setSuggestedTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Fonction de similarité de Levenshtein
  const levenshteinDistance = useCallback((a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }, []);

  // Fonction de recherche approximative
  const fuzzySearch = useCallback((text, search) => {
    if (!search) return false;
    
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Recherche exacte
    if (textLower.includes(searchLower)) return true;
    
    // Recherche par mots-clés
    const normalizedSearch = searchLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedText = textLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (normalizedText.includes(normalizedSearch)) return true;
    
    // Recherche par similarité pour les mots courts
    if (searchLower.length <= 3) {
      const words = textLower.split(/\s+/);
      return words.some(word => 
        levenshteinDistance(word, searchLower) <= 1
      );
    }
    
    // Recherche par parties de mots
    const searchParts = searchLower.split('');
    let foundCount = 0;
    let searchIndex = 0;
    
    for (let i = 0; i < textLower.length && searchIndex < searchParts.length; i++) {
      if (textLower[i] === searchParts[searchIndex]) {
        foundCount++;
        searchIndex++;
      }
    }
    
    return foundCount >= Math.max(2, searchLower.length - 1);
  }, [levenshteinDistance]);

  // Trouver le terme suggéré
  const findSuggestedTerm = useCallback((search) => {
    if (!search || search.length < 3) return '';
    
    const searchLower = search.toLowerCase();
    const normalizedSearch = searchLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Vérifier les mappings directs
    if (keywordMapping[normalizedSearch]) {
      return keywordMapping[normalizedSearch];
    }
    
    // Vérifier les synonymes
    for (const [correctTerm, variations] of Object.entries(searchSynonyms)) {
      if (variations.includes(normalizedSearch)) {
        return correctTerm;
      }
    }
    
    // Recherche approximative dans les termes corrects
    const correctTerms = Object.keys(searchSynonyms);
    for (const term of correctTerms) {
      if (levenshteinDistance(term, normalizedSearch) <= 2) {
        return term;
      }
    }
    
    return '';
  }, [levenshteinDistance]);

  // Recherche et filtrage fonctionnel
  const filteredFAQs = useMemo(() => {
    if (!searchTerm || !isSearching) {
      setSuggestedTerm('');
      return allFAQs.filter(faq => 
        selectedCategory === 'all' || faq.category === selectedCategory
      );
    }
    
    const suggestion = findSuggestedTerm(searchTerm);
    setSuggestedTerm(suggestion);
    
    return allFAQs.filter(faq => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      
      if (!matchesCategory) return false;
      
      // Recherche dans la question et la réponse
      const searchInQuestion = fuzzySearch(faq.question, searchTerm);
      const searchInAnswer = fuzzySearch(faq.answer, searchTerm);
      
      // Si on a une suggestion, chercher aussi avec le terme suggéré
      let searchWithSuggestion = false;
      if (suggestion && suggestion !== searchTerm.toLowerCase()) {
        searchWithSuggestion = fuzzySearch(faq.question, suggestion) || 
                              fuzzySearch(faq.answer, suggestion);
      }
      
      return searchInQuestion || searchInAnswer || searchWithSuggestion;
    });
  }, [searchTerm, selectedCategory, findSuggestedTerm, fuzzySearch, isSearching]);

  // Grouper les FAQ par catégorie
  const groupedFAQs = useMemo(() => {
    const groups = {};
    filteredFAQs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFAQs]);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (isSearching) {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      setIsSearching(true);
    } else {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const useSuggestion = () => {
    if (suggestedTerm) {
      setSearchTerm(suggestedTerm);
      setSuggestedTerm('');
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestedTerm('');
    setIsSearching(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsSearching(true);
  };

  return (
    <div className="faq-container">
      <div className="faq-wrapper">
        {/* Header */}
        <Card className="faq-header">
          <h1 className="faq-title">
            Foire Aux Questions
          </h1>
          <p className="faq-subtitle">
            Trouvez rapidement des réponses à vos questions les plus fréquentes
          </p>
        </Card>

        {/* Alert pour recherche vide */}
        {showAlert && (
          <Alert
            type="warning"
            message="Veuillez entrer un terme de recherche"
            onClose={() => setShowAlert(false)}
          />
        )}

        {/* Contrôles de recherche et filtres */}
        <Card className="faq-controls">
          {/* Barre de recherche */}
          <div className="search-container">
            <div className="search-wrapper">
              <Input
                type="text"
                placeholder="Rechercher une question ou une réponse..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                className="search-input"
              />
              <Button 
                onClick={handleSearchSubmit}
                disabled={!searchTerm.trim()}
                variant="primary"
                className="search-button"
              >
                🔍 Rechercher
              </Button>
            </div>
            
            {/* Indication pour la touche Entrée */}
            {searchTerm && !isSearching && (
              <div className="search-hint">
                Appuyez sur Entrée pour lancer la recherche
              </div>
            )}
            
            {/* Suggestion de recherche */}
            {suggestedTerm && suggestedTerm !== searchTerm.toLowerCase() && (
              <div className="search-suggestion">
                <span>Vouliez-vous dire : </span>
                <Button 
                  onClick={useSuggestion}
                  variant="text"
                  className="suggestion-link"
                >
                  {suggestedTerm}
                </Button>
              </div>
            )}
          </div>

          {/* Filtres par catégorie */}
          <div className="category-filters">
            <Button
              onClick={() => handleCategorySelect('all')}
              variant={selectedCategory === 'all' ? 'primary' : 'outline'}
              className="category-btn"
            >
              Toutes les catégories
            </Button>
            {Object.entries(categories).map(([key, label]) => (
              <Button
                key={key}
                onClick={() => handleCategorySelect(key)}
                variant={selectedCategory === key ? 'primary' : 'outline'}
                className="category-btn"
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Résultats de recherche */}
          {isSearching && searchTerm && (
            <div className="search-results">
              <p>
                {filteredFAQs.length} question(s) trouvée(s) pour "{searchTerm}"
                {suggestedTerm && suggestedTerm !== searchTerm.toLowerCase() && 
                  ` (recherche étendue incluant "${suggestedTerm}")`
                }
                {filteredFAQs.length > 0 && (
                  <Button 
                    onClick={clearSearch}
                    variant="text"
                    className="clear-search-btn"
                  >
                    ✕ Effacer
                  </Button>
                )}
              </p>
            </div>
          )}
        </Card>

        {/* Contenu FAQ */}
        <div className="faq-content">
          {isSearching && searchTerm && filteredFAQs.length === 0 ? (
            <Card className="no-results">
              <div className="no-results-icon">😕</div>
              <h3 className="no-results-title">
                Aucune question trouvée
              </h3>
              <p className="no-results-text">
                Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.
                {suggestedTerm && (
                  <div className="suggestion-container">
                    <Button 
                      onClick={useSuggestion}
                      variant="outline"
                      className="suggestion-button"
                    >
                      Rechercher avec "{suggestedTerm}" à la place
                    </Button>
                  </div>
                )}
              </p>
            </Card>
          ) : (
            <div className="faq-categories">
              {selectedCategory === 'all' ? (
                // Affichage groupé par catégorie
                Object.entries(groupedFAQs).map(([category, faqs]) => (
                  <Card key={category} className={`category-group ${getCategoryColorClass(category)}`}>
                    <div className="category-header">
                      <h2 className="category-title">
                        <span className="category-icon">{getCategoryIcon(category)}</span>
                        {categories[category]}
                        <span className="category-count">
                          ({faqs.length} question{faqs.length > 1 ? 's' : ''})
                        </span>
                      </h2>
                    </div>
                    <div className="faq-list">
                      {faqs.map((faq) => (
                        <Card key={faq.id} className="faq-item">
                          <Button
                            onClick={() => toggleFAQ(faq.id)}
                            variant="text"
                            className={`faq-question ${activeIndex === faq.id ? 'active' : ''}`}
                          >
                            <span className="question-text">
                              {faq.question}
                            </span>
                            <span className={`toggle-icon ${activeIndex === faq.id ? 'active' : 'inactive'}`}>
                              {activeIndex === faq.id ? '−' : '+'}
                            </span>
                          </Button>
                          {activeIndex === faq.id && (
                            <div className="faq-answer">
                              <p className="answer-text">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                ))
              ) : (
                // Affichage simple pour une catégorie spécifique
                <Card className={`category-group ${getCategoryColorClass(selectedCategory)}`}>
                  <div className="category-header">
                    <h2 className="category-title">
                      <span className="category-icon">{getCategoryIcon(selectedCategory)}</span>
                      {categories[selectedCategory]}
                      <span className="category-count">
                        ({filteredFAQs.length} question{filteredFAQs.length > 1 ? 's' : ''})
                      </span>
                    </h2>
                  </div>
                  <div className="faq-list">
                    {filteredFAQs.map((faq) => (
                      <Card key={faq.id} className="faq-item">
                        <Button
                          onClick={() => toggleFAQ(faq.id)}
                          variant="text"
                          className={`faq-question ${activeIndex === faq.id ? 'active' : ''}`}
                        >
                          <span className="question-text">
                            {faq.question}
                          </span>
                          <span className={`toggle-icon ${activeIndex === faq.id ? 'active' : 'inactive'}`}>
                            {activeIndex === faq.id ? '−' : '+'}
                          </span>
                        </Button>
                        {activeIndex === faq.id && (
                          <div className="faq-answer">
                            <p className="answer-text">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Section contact */}
        <Card className="contact-section-compact">
          <div className="contact-compact-card">
            <div className="contact-compact-header">
              <h2 className="contact-compact-title">
                Vous ne trouvez pas la réponse ?
              </h2>
              <p className="contact-compact-subtitle">
                Notre équipe de support est là pour vous aider
              </p>
            </div>
            
            <div className="contact-compact-grid">
              <div className="contact-compact-method">
                <div className="contact-compact-icon">📞</div>
                <div className="contact-compact-content">
                  <h3 className="contact-compact-method-title">Par téléphone</h3>
                  <p className="contact-compact-detail">+33 1 23 45 67 89</p>
                  <small className="contact-compact-hours">Lun-Ven: 8h-20h, Sam: 9h-18h</small>
                </div>
              </div>
              
              <div className="contact-compact-method">
                <div className="contact-compact-icon">✉️</div>
                <div className="contact-compact-content">
                  <h3 className="contact-compact-method-title">Par email</h3>
                  <p className="contact-compact-detail">support@transportplatform.com</p>
                  <small className="contact-compact-hours">Réponse sous 24h</small>
                </div>
              </div>
              
              <div className="contact-compact-method">
                <div className="contact-compact-icon">💬</div>
                <div className="contact-compact-content">
                  <h3 className="contact-compact-method-title">Chat en ligne</h3>
                  <p className="contact-compact-detail">Disponible sur le site</p>
                  <small className="contact-compact-hours">Lun-Sam: 9h-18h</small>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;