const API_BASE = "/api";

function getLocalToken() {
  return localStorage.getItem("token") || "";
}

export function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };
  const localToken = getLocalToken();
  if (localToken) {
    headers["Authorization"] = `Bearer ${localToken}`;
  }
  return headers;
}

export async function loginUser(username, password) {
  const res = await authFetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

export async function registerUser(username, email, password) {
  const res = await authFetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });
  return await res.json();
}

export function setAuthToken(token) {
  localStorage.setItem("token", token);
}

export async function toggleLike(postId) {
  try {
    const res = await authFetch(`${API_BASE}/posts/${postId}/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch (err) {
    return { data: null }; 
  }
}

export async function addComment(postId, content) {
  const res = await authFetch(`${API_BASE}/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ content })
  });
  return await res.json();
}

export async function getComments(postId) {
  const res = await authFetch(`${API_BASE}/posts/${postId}/comments`);
  return await res.json();
}

export async function getCurrentUser() {
  const res = await authFetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: { "Content-Type": "application/json" },
    credentials: 'include'
  });
  return await res.json();
}

export function getImageUrl(url) {
  const STATIC_BASE = 'http://localhost:8000';
  if (url && url.startsWith('/')) {
    return STATIC_BASE + url;
  }
  return url;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export function authFetch(url, options = {}) {
  const csrfToken = getCookie('csrf_token');

  const headers = new Headers(options.headers || {});
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}