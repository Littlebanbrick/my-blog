const API_BASE = "http://localhost:8000/api";


// 获取token（不带Bearer前缀）
export function getAuthToken() {
  return localStorage.getItem("token") || "";
}

// 生成带Bearer前缀的header
export function getAuthHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

// 检查token是否过期（JWT）
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

// 登出并清理token
export function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
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
  // 只存储原token，不带Bearer前缀
  if (token && token.startsWith("Bearer ")) {
    token = token.replace(/^Bearer\s+/, "");
  }
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