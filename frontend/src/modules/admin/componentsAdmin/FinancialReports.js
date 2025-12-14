// frontend/src/pages/Admin/components/FinancialReports.js
import React, { useState, useEffect } from "react";
import { adminService } from '../../../api';
import {  Button, Table, Card, Grid, Select} from "../../../Components/UI";

const FinancialReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    periode: 'month',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date().toISOString().split('T')[0]
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await adminService.getFinancialReports(filters);
      setReportData(response.data.data);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generateReport(); }, []);

  return (
    <div className="financial-reports">
      <div className="section-header">
        <h2>Rapports Financiers</h2>
        <div className="report-filters">
          <Select value={filters.periode} onChange={value => setFilters({...filters, periode: value})}
            options={[
              {value: 'today', label: 'Aujourd\'hui'},
              {value: 'week', label: 'Cette semaine'},
              {value: 'month', label: 'Ce mois'},
              {value: 'custom', label: 'Personnalisé'}
            ]} />
          <Button variant="primary" onClick={generateReport} loading={loading}>
            Générer Rapport
          </Button>
        </div>
      </div>

      {reportData && (
        <Grid cols={3} gap="medium">
          <Card variant="success">
            <h3>Chiffre d'Affaires</h3>
            <p className="stat-value">{reportData.chiffre_affaires || 0} €</p>
            <p className="stat-label">Total période</p>
          </Card>
          
          <Card variant="info">
            <h3>Réservations</h3>
            <p className="stat-value">{reportData.total_reservations || 0}</p>
            <p className="stat-label">Nombre de billets</p>
          </Card>
          
          <Card variant="warning">
            <h3>Taux Occupation</h3>
            <p className="stat-value">{reportData.taux_occupation || 0}%</p>
            <p className="stat-label">Moyenne des bus</p>
          </Card>
        </Grid>
      )}

      {reportData && reportData.paiements_par_methode && (
        <Card title="Paiements par Méthode" className="mt-4">
          <Table
            columns={[
              { key: "methode", label: "Méthode" },
              { key: "montant", label: "Montant" },
              { key: "nombre", label: "Transactions" },
              { key: "pourcentage", label: "Part" }
            ]}
            data={reportData.paiements_par_methode.map(p => ({
              methode: p.methode_paiement,
              montant: `${p.montant_total} €`,
              nombre: p.nombre_transactions,
              pourcentage: `${p.pourcentage}%`
            }))}
          />
        </Card>
      )}
    </div>
  );
};

export default FinancialReports;