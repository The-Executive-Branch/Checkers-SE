import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "@fontsource/alfa-slab-one";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";

import './index.css'
import './styles/theme.css'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

postMessage({ payload: 'removeLoading' }, '*')
