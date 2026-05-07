import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

function RootWrapper() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle redirect from GitHub Pages 404.html
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    if (redirect) {
      // Clean up the URL and navigate to the original path
      const path = '/' + decodeURIComponent(redirect).replace(/~and~/g, '&');
      window.history.replaceState(null, null, path);
      navigate(path);
    }
  }, [navigate]);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/mindbridge/">
      <AuthProvider>
        <RootWrapper />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
