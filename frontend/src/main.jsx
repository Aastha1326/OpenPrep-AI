import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from './context/ThemeContext'
import { SyncProvider } from './context/SyncContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <SyncProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SyncProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)
