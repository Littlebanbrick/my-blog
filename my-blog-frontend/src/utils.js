const API_BASE = "http://localhost:8000/api";

/*
 Note:
 - 后端现在使用 httpOnly cookie 存放 access_token（推荐）。
 - 所有需要鉴权的请求应使用 credentials: 'include' 发送 cookie。
 - 为了兼容仍可能存在的 token（例如手动在浏览器插入的 Authorization header），getAuthHeaders 会检查 localStorage（如果你仍手动存了 token）。
   但默认前端不再把 token 写入 localStorage。
*/

function getLocalToken() {
  return localStorage.getItem("token") || "";
}

export function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json"
  };
  const localToken = getLocalToken();
  if (localToken) {
    // 兼容手动/老流程
    headers["Authorization"] = `Bearer ${localToken}`;
  }
  return headers;
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include', // 关键：允许发送/接收 httpOnly cookie
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ username, email, password })
  });
  return await res.json();
}

// 如果你需要在某些脚本里临时设置 token（不推荐），可以继续使用这个函数。
// 但默认流程不再依赖 localStorage。
export function setAuthToken(token) {
  localStorage.setItem("token", token);
}

// 关键的鉴权请求：使用 credentials: 'include'
export async function toggleLike(postId) {
  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
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
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
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
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`);
  return await res.json();
}

// 新增：获取当前登录用户（用于 Header 判断登录与用户信息）
export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: { "Content-Type": "application/json" },
    credentials: 'include'
  });
  return await res.json();
}