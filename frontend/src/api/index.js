//frontend/src/api/index.js

// 👉 On importe tout AVANT de les ré-exporter
import { secureApiService, checkAPIHealth, apiMonitor, cacheManager } from './apiService';

import { adminService } from './adminService';
import { userService } from './userService';
import { trajetService } from './trajetService';
import { paymentService } from './paymentService';
import { reservationService } from './reservationService';
import { contactService } from './contactService';
import { countryService } from './countryService';

// 👉 Export normal (pour import ciblé)
export {
  secureApiService,
  checkAPIHealth,
  apiMonitor,
  cacheManager,
  adminService,
  userService,
  trajetService,
  paymentService,
  reservationService,
  contactService,
  countryService
};

// 👉 Export par défaut (objet global API)
const api = {
  secureApiService,
  checkAPIHealth,
  apiMonitor,
  cacheManager,
  adminService,
  userService,
  trajetService,
  paymentService,
  reservationService,
  contactService,
  countryService
};

export default api;
