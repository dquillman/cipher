import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Backstop for stale chunks after a deploy: Vite fires `vite:preloadError`
// when a modulepreload for a hashed chunk 404s (the SPA rewrite returns
// index.html). lazyWithReload handles the React.lazy path; this catches
// preload failures outside it. One reload per cooldown, sharing the wrapper's
// sessionStorage guard so the two never loop against each other.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'ec_chunk_reload_at';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (!last || Date.now() - last > 20_000) {
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  }
});

console.log('Mounting App...');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
