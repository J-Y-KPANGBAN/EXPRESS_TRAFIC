// backend/services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const generateCode = require('./generateCode');
const { formatDate, formatTime, formatDateTime } = require('../utils/dateUtils');
const logger = require('../utils/logger');

class PDFService {
  
  /* ============================================================
     🎫 GÉNÉRER UN BILLET DE RÉSERVATION
  ============================================================ */
  async generateTicket(reservationData) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `ticket_${reservationData.code_reservation}_${Date.now()}.pdf`;
        const ticketsDir = path.join(__dirname, '../tickets');

        // Créer le dossier tickets s'il n'existe pas
        if (!fs.existsSync(ticketsDir)) {
          fs.mkdirSync(ticketsDir, { recursive: true });
        }

        const filePath = path.join(ticketsDir, fileName);
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: `Billet ExpressTrafic - ${reservationData.code_reservation}`,
            Author: 'ExpressTrafic',
            Subject: 'Billet de réservation de transport',
            Keywords: 'billet, réservation, transport, bus',
            Creator: 'ExpressTrafic System',
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ==========================================
        // 🎨 EN-TÊTE PROFESSIONNELLE
        // ==========================================
        this.addHeader(doc, reservationData);
        
        // ==========================================
        // 📋 INFORMATIONS DU BILLET
        // ==========================================
        this.addTicketInfo(doc, reservationData);
        
        // ==========================================
        // 👤 INFORMATIONS DU PASSAGER
        // ==========================================
        this.addPassengerInfo(doc, reservationData);
        
        // ==========================================
        // 🚍 INFORMATIONS DU TRAJET
        // ==========================================
        this.addJourneyInfo(doc, reservationData);

        // ==========================================
        // 📄 QR CODE ET INSTRUCTIONS
        // ==========================================
        await this.addQrCodeAndInstructions(doc, reservationData);

        // ==========================================
        // 🏢 PIED DE PAGE
        // ==========================================
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          logger.success(`🎫 Ticket PDF généré: ${filePath}`);
          resolve({
            filePath,
            fileName,
            publicUrl: `/tickets/${fileName}`,
            downloadUrl: `/api/pdf/download/${fileName}`
          });
        });

        stream.on('error', (error) => {
          logger.error(`❌ Erreur génération ticket: ${error.message}`);
          reject(error);
        });

      } catch (error) {
        logger.error(`❌ Erreur génération PDF: ${error.message}`);
        reject(error);
      }
    });
  }

  /* ============================================================
     📊 GÉNÉRER UN RAPPORT ADMIN
  ============================================================ */
  async generateReport(reportData) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `rapport_${reportData.type}_${Date.now()}.pdf`;
        const reportsDir = path.join(__dirname, '../reports');

        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filePath = path.join(reportsDir, fileName);
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4'
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // En-tête du rapport
        this.addReportHeader(doc, reportData);

        // Contenu selon le type de rapport
        switch (reportData.type) {
          case 'reservations':
            await this.addReservationsReport(doc, reportData);
            break;
          case 'finances':
            await this.addFinancialReport(doc, reportData);
            break;
          case 'trajets':
            await this.addTrajetsReport(doc, reportData);
            break;
          default:
            this.addGenericReport(doc, reportData);
        }

        // Pied de page
        this.addReportFooter(doc, reportData);

        doc.end();

        stream.on('finish', () => {
          logger.success(`📊 Rapport PDF généré: ${filePath}`);
          resolve({
            filePath,
            fileName,
            publicUrl: `/reports/${fileName}`
          });
        });

      } catch (error) {
        logger.error(`❌ Erreur génération rapport: ${error.message}`);
        reject(error);
      }
    });
  }

  /* ============================================================
     🧾 GÉNÉRER UNE FACTURE
  ============================================================ */
  async generateInvoice(invoiceData) {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `facture_${invoiceData.number}_${Date.now()}.pdf`;
        const invoicesDir = path.join(__dirname, '../invoices');

        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const filePath = path.join(invoicesDir, fileName);
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4'
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // En-tête facture
        this.addInvoiceHeader(doc, invoiceData);

        // Informations client
        this.addInvoiceClientInfo(doc, invoiceData);

        // Détails de la facture
        this.addInvoiceDetails(doc, invoiceData);

        // Total et mentions
        this.addInvoiceTotal(doc, invoiceData);

        // Pied de page
        this.addInvoiceFooter(doc, invoiceData);

        doc.end();

        stream.on('finish', () => {
          logger.success(`🧾 Facture PDF générée: ${filePath}`);
          resolve({
            filePath,
            fileName,
            publicUrl: `/invoices/${fileName}`
          });
        });

      } catch (error) {
        logger.error(`❌ Erreur génération facture: ${error.message}`);
        reject(error);
      }
    });
  }

  // ============================================================
  // 🎨 MÉTHODES POUR LE BILLET
  // ============================================================

  addHeader(doc, reservation) {
    // En-tête bleu
    doc.rect(0, 0, 612, 80)
       .fill('#2c5aa0');
    
    // Logo et titre
    doc.fillColor('#ffffff')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('EXPRESSTRAFIC', 50, 30);
    
    doc.fontSize(14)
       .text('BILLET DE RESERVATION', 50, 55);

    // Code réservation
    doc.fontSize(12)
       .text(`CODE: ${reservation.code_reservation}`, 400, 45, { align: 'right' });

    // Ligne de séparation
    doc.moveTo(50, 85)
       .lineTo(550, 85)
       .strokeColor('#2c5aa0')
       .lineWidth(2)
       .stroke();
  }

  addTicketInfo(doc, reservation) {
    doc.fillColor('#000000')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('INFORMATIONS DU BILLET', 50, 110);

    // Cadre d'informations
    this.drawRoundedRect(doc, 50, 135, 500, 80, 5);
    
    const statusColor = reservation.etat_reservation === 'confirmee' ? '#27AE60' : '#E74C3C';
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('Code réservation:', 70, 150)
       .fontSize(14)
       .fillColor('#2c5aa0')
       .text(reservation.code_reservation, 180, 150)
       .fillColor('#000000')
       .fontSize(12)
       .text('Date d\'émission:', 70, 175)
       .text(formatDateTime(new Date()), 180, 175)
       .text('Statut:', 300, 150)
       .fillColor(statusColor)
       .text(reservation.etat_reservation.toUpperCase(), 340, 150)
       .fillColor('#000000')
       .text('Montant payé:', 300, 175)
       .text(`${reservation.montant_total || reservation.montant} €`, 380, 175);
  }

  addPassengerInfo(doc, reservation) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c5aa0')
       .text('INFORMATIONS DU PASSAGER', 50, 240)
       .fillColor('#000000');

    this.drawRoundedRect(doc, 50, 265, 500, 100, 5);
    
    doc.fontSize(11)
       .font('Helvetica')
       .text('Nom complet:', 70, 285)
       .fontSize(12)
       .text(`${reservation.user_prenom} ${reservation.user_nom}`, 150, 285)
       .fontSize(11)
       .text('Email:', 70, 305)
       .fontSize(12)
       .text(reservation.user_email, 150, 305)
       .text('Téléphone:', 70, 325)
       .text(reservation.user_telephone || 'Non renseigné', 150, 325)
       .text('Siège attribué:', 300, 285)
       .fontSize(14)
       .fillColor('#2c5aa0')
       .text(`N° ${reservation.siege_numero}`, 390, 285)
       .fillColor('#000000');
  }

  addJourneyInfo(doc, reservation) {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c5aa0')
       .text('INFORMATIONS DU TRAJET', 50, 390)
       .fillColor('#000000');

    this.drawRoundedRect(doc, 50, 415, 500, 120, 5);

    // Départ
    doc.fontSize(12)
       .fillColor('#2c5aa0')
       .text('DÉPART', 70, 435)
       .fillColor('#000000')
       .fontSize(14)
       .text(reservation.ville_depart, 70, 455)
       .fontSize(10)
       .text(formatDate(reservation.date_depart), 70, 475)
       .text(`Heure: ${reservation.heure_depart}`, 70, 490);

    // Flèche
    doc.fontSize(16)
       .text('→', 280, 460);

    // Arrivée
    doc.fontSize(12)
       .fillColor('#2c5aa0')
       .text('ARRIVÉE', 350, 435)
       .fillColor('#000000')
       .fontSize(14)
       .text(reservation.ville_arrivee, 350, 455)
       .fontSize(10)
       .text(formatDate(reservation.date_depart), 350, 475)
       .text(`Durée: ${this.formatDuration(reservation.duree)}`, 350, 490);

    // Informations complémentaires
    if (reservation.numero_immatriculation || reservation.chauffeur_nom) {
      doc.fontSize(10)
         .text(`Bus: ${reservation.numero_immatriculation || 'Non spécifié'}`, 70, 510)
         .text(`Chauffeur: ${reservation.chauffeur_nom ? `${reservation.chauffeur_prenom} ${reservation.chauffeur_nom}` : 'Non assigné'}`, 300, 510);
    }
  }

 //📄 AJOUTER QR CODE AVEC SÉCURITÉ
 // ============================================================ */
  async addQrCodeAndInstructions(doc, reservationData) {
    try {
      // Générer le QR Code sécurisé
      const qrResult = await generateCode.generateSecureQRCode(reservationData);
      
      if (qrResult.success) {
        const base64Data = qrResult.qrDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, 'base64');
        
        // Positionner le QR Code
        doc.image(qrBuffer, 450, 560, { 
          width: 80, 
          height: 80 
        });
        
        // Informations autour du QR Code
        doc.fontSize(8)
           .fillColor('#2c5aa0')
           .text('SCANNEZ-MOI', 450, 645, { width: 80, align: 'center' })
           .fillColor('#666666')
           .fontSize(6)
           .text(`Code: ${reservationData.code_reservation}`, 450, 655, { width: 80, align: 'center' })
           .text(`Siège: ${reservationData.siege_numero}`, 450, 662, { width: 80, align: 'center' });
           
        logger.success('✅ QR Code sécurisé ajouté au PDF');
      } else {
        throw new Error('Échec génération QR Code');
      }

    } catch (qrError) {
      logger.error('❌ Erreur génération QR Code:', qrError.message);
      
      // Fallback: Afficher le code texte
      doc.fontSize(10)
         .fillColor('#ff0000')
         .text('⚠️ QR Code non disponible', 450, 580)
         .fillColor('#000000')
         .fontSize(8)
         .text(`Code: ${reservationData.code_reservation}`, 450, 595)
         .text(`Siège: ${reservationData.siege_numero}`, 450, 605)
         .text(`Passager: ${reservationData.user_prenom} ${reservationData.user_nom}`, 450, 615, { width: 100 });
    }

    // Instructions
    this.addScanInstructions(doc);
  }

  /* ============================================================
     📋 INSTRUCTIONS DE SCAN DÉTAILLÉES
  ============================================================ */
  addScanInstructions(doc) {
    doc.fontSize(9)
       .fillColor('#666666')
       .text('• Présentez ce billet et une pièce d\'identité à l\'embarquement', 50, 615)
       .text('• Le QR Code sera scanné par le chauffeur pour validation', 50, 630)
       .text('• Soyez présent au point de départ 15 minutes avant le départ', 50, 645)
       .text('• Bagages: 1 valise en soute + 1 bagage à main inclus', 50, 660)
       .text('• En cas de problème, contactez le service client', 50, 675);
  }


  addFooter(doc) {
    const footerY = 700;
    
    doc.moveTo(50, footerY)
       .lineTo(550, footerY)
       .strokeColor('#2c5aa0')
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .fillColor('#666666')
       .text('ExpressTrafic - Votre partenaire de mobilité fiable', 50, footerY + 10, { align: 'center' })
       .text('Service client: +33 1 23 45 67 89 | Email: contact@expresstrafic.com', 50, footerY + 25, { align: 'center' })
       .text('123 Avenue des Champs-Élysées, 75008 Paris, France', 50, footerY + 40, { align: 'center' })
       .text('www.expresstrafic.com | SIRET: 123 456 789 00012', 50, footerY + 55, { align: 'center' });
  }

  // ============================================================
  // 📊 MÉTHODES POUR LES RAPPORTS
  // ============================================================

  addReportHeader(doc, reportData) {
    doc.fillColor('#2c5aa0')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(`RAPPORT ${reportData.type.toUpperCase()} - EXPRESSTRAFIC`, 50, 50, { align: 'center' });
    
    doc.fillColor('#000000')
       .fontSize(12)
       .text(`Généré le: ${formatDateTime(new Date())}`, 50, 80)
       .text(`Période: ${reportData.period || 'Non spécifiée'}`, 50, 95);
    
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#cccccc').lineWidth(1).stroke();
  }

  async addReservationsReport(doc, reportData) {
    let yPosition = 130;
    
    doc.fontSize(16)
       .text('Résumé des Réservations', 50, yPosition);
    
    yPosition += 30;

    // Tableau des réservations
    const headers = ['Date', 'Code', 'Trajet', 'Passager', 'Statut', 'Montant'];
    const colWidths = [80, 80, 120, 100, 60, 60];
    
    // En-têtes du tableau
    doc.fontSize(10).font('Helvetica-Bold');
    let xPosition = 50;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).strokeColor('#cccccc').lineWidth(0.5).stroke();
    yPosition += 10;

    // Données
    doc.fontSize(9).font('Helvetica');
    reportData.reservations.forEach(reservation => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(formatDate(reservation.date_reservation), 50, yPosition);
      doc.text(reservation.code_reservation, 130, yPosition);
      doc.text(`${reservation.ville_depart} → ${reservation.ville_arrivee}`, 210, yPosition, { width: 120 });
      doc.text(`${reservation.user_prenom} ${reservation.user_nom}`, 330, yPosition, { width: 100 });
      doc.text(reservation.etat_reservation, 430, yPosition);
      doc.text(`${reservation.montant_total} €`, 490, yPosition);
      
      yPosition += 15;
    });

    // Totaux
    yPosition += 20;
    doc.fontSize(10).font('Helvetica-Bold')
       .text(`Total réservations: ${reportData.totalReservations}`, 50, yPosition)
       .text(`Chiffre d'affaires: ${reportData.totalRevenue} €`, 300, yPosition);
  }

  // ============================================================
  // 🧾 MÉTHODES POUR LES FACTURES
  // ============================================================

  addInvoiceHeader(doc, invoice) {
    doc.fillColor('#2c5aa0')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('FACTURE', 50, 50);
    
    doc.fillColor('#000000')
       .fontSize(12)
       .text(`N° ${invoice.number}`, 50, 80)
       .text(`Date: ${formatDate(invoice.date)}`, 50, 95)
       .text(`Échéance: ${formatDate(invoice.dueDate)}`, 50, 110);
    
    // Informations société
    doc.text('EXPRESSTRAFIC', 400, 50, { align: 'right' })
       .fontSize(10)
       .text('123 Avenue des Champs-Élysées', 400, 65, { align: 'right' })
       .text('75008 Paris, France', 400, 78, { align: 'right' })
       .text('contact@expresstrafic.com', 400, 91, { align: 'right' })
       .text('SIRET: 123 456 789 00012', 400, 104, { align: 'right' });
  }

  // ============================================================
  // 🛠️ MÉTHODES UTILITAIRES
  // ============================================================

  drawRoundedRect(doc, x, y, width, height, radius) {
    doc.roundedRect(x, y, width, height, radius)
       .strokeColor('#2c5aa0')
       .lineWidth(1)
       .stroke();
  }

  formatDuration(duration) {
    if (!duration) return 'N/A';
    
    try {
      if (typeof duration === 'string') {
        const [hours, minutes] = duration.split(':').map(Number);
        if (hours === 0) return `${minutes}min`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
      }
      return duration;
    } catch (error) {
      return duration;
    }
  }

  /* ============================================================
     📥 SERVIR UN FICHIER PDF
  ============================================================ */
  async servePdfFile(filename, type = 'tickets') {
    try {
      const baseDir = path.join(__dirname, '..', type);
      const filePath = path.join(baseDir, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Fichier PDF non trouvé');
      }

      return filePath;
    } catch (error) {
      logger.error(`❌ Erreur servePdfFile: ${error.message}`);
      throw error;
    }
  }

  /* ============================================================
     🗑️ NETTOYER LES FICHIERS ANCIENS
  ============================================================ */
  async cleanupOldFiles(type = 'tickets', days = 30) {
    try {
      const baseDir = path.join(__dirname, '..', type);
      
      if (!fs.existsSync(baseDir)) {
        return { deleted: 0 };
      }

      const files = fs.readdirSync(baseDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(baseDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info(`🗑️ ${deletedCount} fichiers ${type} anciens supprimés`);
      return { deleted: deletedCount };

    } catch (error) {
      logger.error(`❌ Erreur cleanupOldFiles: ${error.message}`);
      throw error;
    }
  }
}

// Méthodes pour les rapports et factures (à compléter selon les besoins)
PDFService.prototype.addFinancialReport = async function(doc, reportData) {
  // Implémentation des rapports financiers
};

PDFService.prototype.addTrajetsReport = async function(doc, reportData) {
  // Implémentation des rapports de trajets
};

PDFService.prototype.addGenericReport = function(doc, reportData) {
  // Implémentation des rapports génériques
};

PDFService.prototype.addInvoiceClientInfo = function(doc, invoice) {
  // Informations client facture
};

PDFService.prototype.addInvoiceDetails = function(doc, invoice) {
  // Détails facture
};

PDFService.prototype.addInvoiceTotal = function(doc, invoice) {
  // Total facture
};

PDFService.prototype.addInvoiceFooter = function(doc, invoice) {
  // Pied de page facture
};

PDFService.prototype.addReportFooter = function(doc, reportData) {
  // Pied de page rapport
};

module.exports = new PDFService();