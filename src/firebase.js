import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDCl5TemeIlHqHFP5w8YYA4u7t9CshNSuk',
  authDomain: 'appmove-e6d32.firebaseapp.com',
  databaseURL: 'https://appmove-e6d32-default-rtdb.firebaseio.com',
  projectId: 'appmove-e6d32',
  storageBucket: 'appmove-e6d32.appspot.com',
  messagingSenderId: '818572074341',
  appId: '1:818572074341:web:96d2d8982c85cc83f2d58c',
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
