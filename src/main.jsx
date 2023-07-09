import React from 'react';
import ReactDOM from 'react-dom/client';
import { Flowbite } from 'flowbite-react';

import { App } from '@/App';

import 'animate.css';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Flowbite theme={{ theme: { dark: true } }}>
      <App />
    </Flowbite>
  </React.StrictMode>
);
