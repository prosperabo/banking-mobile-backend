/**
 * Base Axios instance for the SIP authentication endpoint ONLY.
 * This instance has NO token interceptor to avoid circular dependency
 * with SipAuthService.
 *
 * Endpoint: POST /autenticacion/v1/generarToken
 * Required header: apikey (empresa)
 */
import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';

const logger = buildLogger('SipAuthInstance');

const sipAuthInstance = axios.create({
  baseURL: config.sip.baseUrl,
  timeout: config.sip.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    apikey: config.sip.apiKey,
  },
});

sipAuthInstance.interceptors.request.use(request => {
  logger.info('SIP auth request', { method: request.method, url: request.url });
  return request;
});

sipAuthInstance.interceptors.response.use(
  response => response,
  error => {
    logger.error('SIP auth error', {
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export default sipAuthInstance;
