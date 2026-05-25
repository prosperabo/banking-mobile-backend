import * as admin from 'firebase-admin';
import { buildLogger } from '@/utils';
import { config } from './config';

const logger = buildLogger('FirebaseConfig');

let messagingInstance: admin.messaging.Messaging | null = null;
let firestoreInstance: admin.firestore.Firestore | null = null;

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

const getFirestore = (): admin.firestore.Firestore => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  if (!admin.apps.length) {
    initializeFirebase();
  }

  firestoreInstance = admin.firestore();
  logger.info('Firestore instance created');
  return firestoreInstance;
};

export const firebaseMessaging = initializeFirebase();
export const firebaseDB = getFirestore();
