import React from "react";
import "./Pagination.css";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showPageNumbers = true,
  className = "" 
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    if (!showPageNumbers) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`page-number ${i === currentPage ? "active" : ""}`}
          onClick={() => handlePageClick(i)}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={`pagination ${className}`}>
      <button
        className={`pagination-btn prev ${currentPage === 1 ? "disabled" : ""}`}
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        ⬅️ Précédent
      </button>

      <div className="page-info">
        <span className="page-text">
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      {showPageNumbers && (
        <div className="page-numbers">
          {renderPageNumbers()}
        </div>
      )}

      <button
        className={`pagination-btn next ${currentPage === totalPages ? "disabled" : ""}`}
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        Suivant ➡️
      </button>
    </div>
  );
};

export default Pagination;