const API_BASE = "http://localhost:8000/api";

function getAuthToken() {
  return localStorage.getItem("token") || "";
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getAuthToken()}`
  };
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  return await res.json();
}

export function setAuthToken(token) {
  localStorage.setItem("token", token);
}

export async function toggleLike(postId) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    return { data: null }; 
  }
}

export async function addComment(postId, content) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content })
  });
  return await res.json();
}

export async function getComments(postId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
  return await res.json();
}