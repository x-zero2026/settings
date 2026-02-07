// Get token from localStorage or URL parameter
export const getToken = () => {
  // First check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    // Save to localStorage
    localStorage.setItem('token', tokenFromUrl);
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return tokenFromUrl;
  }
  
  // Then check localStorage
  return localStorage.getItem('token');
};

// Parse JWT token to get user info
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      did: payload.did,
      username: payload.username,
    };
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
};

// Clear auth data
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = 'https://main.d2fozf421c6ftf.amplifyapp.com';
};
