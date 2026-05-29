import * as admin from 'firebase-admin';
import { buildLogger } from '@/utils';
import { config } from './config';

const logger = buildLogger('FirebaseConfig');

let messagingInstance: admin.messaging.Messaging | null = null;

const initializeFirebase = (): admin.messaging.Messaging => {
  if (messagingInstance) {
    return messagingInstance;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });

    logger.info('Firebase Admin SDK initialized');
  }

  messagingInstance = admin.messaging();
  return messagingInstance;
};

export const firebaseMessaging = initializeFirebase();
