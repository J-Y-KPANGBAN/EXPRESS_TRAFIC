// frontend/src/pages/Admin/components/SystemSettings.js
import React, { useState, useEffect } from "react";
import { adminService } from '../../../api';
import { 
  Alert, 
  Button, 
  Card, 
  Loader, 
  Switch, 
  Input, 
  Select, 
  Table,
  Badge,
  Modal,
  FormGroup,
  TextArea,
  Grid
} from "../../../Components/UI";

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [maintenanceModal, setMaintenanceModal] = useState(false);

  const [form, setForm] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    default_language: "fr",
    session_timeout_minutes: 30,
    password_expiry_months: 6,
    inactivity_warning_months: 6,
    inactivity_deletion_months: 12
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    action: "start",
    message: "",
    duration_minutes: 60
  });

  useEffect(() => {
    fetchSystemSettings();
    fetchSystemLogs();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await adminService.getSystemSettings();
      setSettings(response.data.data);
      setForm(response.data.data || {});
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await adminService.getSystemLogs();
      setLogs(response.data.data || []);
    } catch (err) {
      console.error("Erreur logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setError(null);
      setSuccess(null);
      await adminService.updateSystemSettings(form);
      setSuccess("Paramètres système mis à jour avec succès");
      fetchSystemSettings(); // Recharger les données
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors de la mise à jour des paramètres");
    }
  };

  const handleMaintenanceAction = async () => {
    try {
      await adminService.triggerMaintenance(maintenanceForm);
      setSuccess(`Maintenance ${maintenanceForm.action === 'start' ? 'démarrée' : 'arrêtée'} avec succès`);
      setMaintenanceModal(false);
      fetchSystemSettings();
    } catch (err) {
      setError("Erreur lors de l'action de maintenance");
    }
  };

  const handleBackup = async () => {
    try {
      await adminService.createBackup();
      setSuccess("Sauvegarde de la base de données lancée avec succès");
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
    }
  };

  const getLogLevelVariant = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="system-settings">
        <Loader size="large" text="Chargement des paramètres système..." />
      </div>
    );
  }

  return (
    <div className="system-settings">
      <div className="section-header">
        <h2>Paramètres Système</h2>
        <div className="header-actions">
          <Button variant="secondary" onClick={fetchSystemSettings}>
            Actualiser
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Navigation par onglets */}
      <div className="settings-tabs">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ Général
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Sécurité
          </button>
          <button 
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📊 Logs Système
          </button>
          <button 
            className={`tab-button ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            🛠️ Maintenance
          </button>
        </div>

        <div className="tab-content">
          {/* ONGLET GÉNÉRAL */}
          {activeTab === 'general' && (
            <Card title="Paramètres Généraux">
              <Grid cols={2} gap="medium">
                <FormGroup label="Mode Maintenance">
                  <Switch
                    checked={form.maintenance_mode}
                    onChange={(checked) => setForm({...form, maintenance_mode: checked})}
                    label={form.maintenance_mode ? "Activé" : "Désactivé"}
                  />
                  <div className="form-help">
                    Lorsque activé, le site sera inaccessible aux utilisateurs normaux
                  </div>
                </FormGroup>

                <FormGroup label="Langue par Défaut">
                  <Select
                    value={form.default_language}
                    onChange={(value) => setForm({...form, default_language: value})}
                    options={[
                      { value: 'fr', label: 'Français' },
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Español' }
                    ]}
                  />
                </FormGroup>

                <FormGroup label="Message de Maintenance">
                  <TextArea
                    value={form.maintenance_message}
                    onChange={(value) => setForm({...form, maintenance_message: value})}
                    placeholder="Message à afficher aux utilisateurs pendant la maintenance..."
                    rows={3}
                  />
                </FormGroup>

                <FormGroup label="Configuration Mobile">
                  <div className="mobile-config-preview">
                    <Card variant="outline">
                      <h4>Config React Native</h4>
                      <div className="config-item">
                        <strong>API URL:</strong> {window.location.origin}/api
                      </div>
                      <div className="config-item">
                        <strong>Version:</strong> 2.1.0
                      </div>
                      <div className="config-item">
                        <strong>Environnement:</strong> Production
                      </div>
                    </Card>
                  </div>
                </FormGroup>
              </Grid>

              <div className="form-actions">
                <Button variant="primary" onClick={handleSaveSettings}>
                  Sauvegarder les Paramètres
                </Button>
              </div>
            </Card>
          )}

          {/* ONGLET SÉCURITÉ */}
          {activeTab === 'security' && (
            <Card title="Paramètres de Sécurité">
              <Grid cols={2} gap="medium">
                <FormGroup 
                  label="Délai d'Expiration de Session (minutes)" 
                  help="Délai d'inactivité avant déconnexion automatique"
                >
                  <Input
                    type="number"
                    value={form.session_timeout_minutes}
                    onChange={(e) => setForm({...form, session_timeout_minutes: e.target.value})}
                    min={1}
                    max={1440}
                  />
                </FormGroup>

                <FormGroup 
                  label="Expiration des Mots de Passe (mois)"
                  help="Durée de validité maximum des mots de passe"
                >
                  <Input
                    type="number"
                    value={form.password_expiry_months}
                    onChange={(e) => setForm({...form, password_expiry_months: e.target.value})}
                    min={1}
                    max={24}
                  />
                </FormGroup>

                <FormGroup 
                  label="Alerte Inactivité (mois)"
                  help="Envoi d'un rappel après cette période d'inactivité"
                >
                  <Input
                    type="number"
                    value={form.inactivity_warning_months}
                    onChange={(e) => setForm({...form, inactivity_warning_months: e.target.value})}
                    min={1}
                    max={24}
                  />
                </FormGroup>

                <FormGroup 
                  label="Suppression Compte Inactif (mois)"
                  help="Suppression automatique après cette période d'inactivité"
                >
                  <Input
                    type="number"
                    value={form.inactivity_deletion_months}
                    onChange={(e) => setForm({...form, inactivity_deletion_months: e.target.value})}
                    min={1}
                    max={36}
                  />
                </FormGroup>
              </Grid>

              <div className="security-stats">
                <h4>Statistiques de Sécurité</h4>
                <Grid cols={3} gap="small">
                  <Card variant="outline">
                    <div className="stat-item">
                      <span className="stat-label">Sessions Actives</span>
                      <span className="stat-value">12</span>
                    </div>
                  </Card>
                  <Card variant="outline">
                    <div className="stat-item">
                      <span className="stat-label">Tentatives Échouées</span>
                      <span className="stat-value">3</span>
                    </div>
                  </Card>
                  <Card variant="outline">
                    <div className="stat-item">
                      <span className="stat-label">Dernier Backup</span>
                      <span className="stat-value">Aujourd'hui</span>
                    </div>
                  </Card>
                </Grid>
              </div>

              <div className="form-actions">
                <Button variant="primary" onClick={handleSaveSettings}>
                  Sauvegarder la Configuration
                </Button>
              </div>
            </Card>
          )}

          {/* ONGLET LOGS SYSTÈME */}
          {activeTab === 'logs' && (
            <Card 
              title="Logs Système" 
              actions={
                <Button variant="outline" onClick={fetchSystemLogs} loading={logsLoading}>
                  Actualiser les Logs
                </Button>
              }
            >
              {logsLoading ? (
                <Loader text="Chargement des logs..." />
              ) : (
                <Table
                  columns={[
                    { key: "timestamp", label: "Date/Heure" },
                    { key: "level", label: "Niveau" },
                    { key: "module", label: "Module" },
                    { key: "message", label: "Message" },
                    { key: "user", label: "Utilisateur" }
                  ]}
                  data={logs.map(log => ({
                    timestamp: new Date(log.timestamp).toLocaleString("fr-FR"),
                    level: (
                      <Badge variant={getLogLevelVariant(log.level)}>
                        {log.level}
                      </Badge>
                    ),
                    module: log.module || "Système",
                    message: (
                      <div className="log-message">
                        {log.message}
                        {log.details && (
                          <div className="log-details text-muted">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>
                    ),
                    user: log.user_id ? `User ${log.user_id}` : "Système"
                  }))}
                  emptyMessage="Aucun log trouvé"
                />
              )}
            </Card>
          )}

          {/* ONGLET MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <Card title="Outils de Maintenance">
              <Grid cols={2} gap="medium">
                <Card variant="warning">
                  <h4>🛠️ Mode Maintenance</h4>
                  <p>Activer/désactiver le mode maintenance pour effectuer des opérations techniques</p>
                  <Button 
                    variant="warning" 
                    onClick={() => {
                      setMaintenanceForm({
                        action: settings?.maintenance_mode ? 'stop' : 'start',
                        message: settings?.maintenance_message || "",
                        duration_minutes: 60
                      });
                      setMaintenanceModal(true);
                    }}
                  >
                    {settings?.maintenance_mode ? "Arrêter" : "Démarrer"} Maintenance
                  </Button>
                </Card>

                <Card variant="info">
                  <h4>💾 Sauvegarde BD</h4>
                  <p>Créer une sauvegarde complète de la base de données</p>
                  <Button variant="info" onClick={handleBackup}>
                    Lancer Sauvegarde
                  </Button>
                </Card>

                <Card variant="outline">
                  <h4>🧹 Nettoyage Logs</h4>
                  <p>Supprimer les logs anciens pour libérer de l'espace</p>
                  <Button variant="outline">
                    Nettoyer les Logs
                  </Button>
                </Card>

                <Card variant="outline">
                  <h4>📊 Santé Système</h4>
                  <div className="health-status">
                    <div className="health-item">
                      <Badge variant="success">BD: OK</Badge>
                    </div>
                    <div className="health-item">
                      <Badge variant="success">API: OK</Badge>
                    </div>
                    <div className="health-item">
                      <Badge variant="success">Cache: OK</Badge>
                    </div>
                  </div>
                </Card>
              </Grid>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Maintenance */}
      <Modal
        isOpen={maintenanceModal}
        onClose={() => setMaintenanceModal(false)}
        title={`${maintenanceForm.action === 'start' ? 'Démarrer' : 'Arrêter'} la Maintenance`}
      >
        <FormGroup label="Message de Maintenance">
          <TextArea
            value={maintenanceForm.message}
            onChange={(value) => setMaintenanceForm({...maintenanceForm, message: value})}
            placeholder="Expliquez la raison de la maintenance..."
            rows={3}
          />
        </FormGroup>

        {maintenanceForm.action === 'start' && (
          <FormGroup label="Durée Estimée (minutes)">
            <Input
              type="number"
              value={maintenanceForm.duration_minutes}
              onChange={(e) => setMaintenanceForm({...maintenanceForm, duration_minutes: e.target.value})}
              min={1}
              max={1440}
            />
          </FormGroup>
        )}

        <div className="form-actions">
          <Button 
            variant={maintenanceForm.action === 'start' ? 'warning' : 'success'}
            onClick={handleMaintenanceAction}
          >
            Confirmer {maintenanceForm.action === 'start' ? 'le Démarrage' : "l'Arrêt"}
          </Button>
          <Button variant="secondary" onClick={() => setMaintenanceModal(false)}>
            Annuler
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SystemSettings;