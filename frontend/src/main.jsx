import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import * as Sentry from '@sentry/react'
import { store } from './store'
import { ThemeProvider } from './context/ThemeContext'
import { SyncProvider } from './context/SyncContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'
import './i18n';
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

if (import.meta.env.MODE !== 'test' && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 0.2, // 20% traces sampling
    replaysSessionSampleRate: 0.1, // 10% session replays
    replaysOnErrorSampleRate: 1.0, // 100% replays on error
  });
  console.log('✅ Sentry React Monitoring initialized successfully.');
}

// Catch Vite chunk load errors when a new deployment updates JS assets
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message?.includes('Failed to fetch dynamically imported module') ||
      event.reason.message?.includes('Importing a module script failed'))
  ) {
    const lastReload = sessionStorage.getItem('chunk_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('chunk_reload', now.toString());
      window.location.reload();
    }
  }
});



const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '179369126060-lq7unpt173rt6aog2nt93s6m895d6b2i.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider store={store}>
          <ThemeProvider>
            <SyncProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </SyncProvider>
          </ThemeProvider>
        </Provider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
