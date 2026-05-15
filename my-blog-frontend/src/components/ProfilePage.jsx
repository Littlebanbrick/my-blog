import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils";

const API_BASE = "/api";
const COOLDOWN_DAYS = 30;

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 修改用户名相关状态
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  // Get user profile on component mount
  useEffect(() => {
    authFetch(`${API_BASE}/user/profile`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) setUser(data.data);
        else navigate("/login");
      });
  }, [navigate]);

  // 计算冷却期信息
  const cooldownInfo = useMemo(() => {
    if (!user || !user.last_username_change) {
      return { inCooldown: false, remainingDays: 0 };
    }
    // 服务端返回的格式: "YYYY-MM-DD HH:MM:SS" (北京时间)
    const lastChange = new Date(user.last_username_change.replace(" ", "T") + "+08:00");
    const now = new Date();
    const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
    const remainingDays = COOLDOWN_DAYS - diffDays;
    return {
      inCooldown: diffDays < COOLDOWN_DAYS,
      remainingDays: remainingDays > 0 ? remainingDays : 0,
    };
  }, [user]);

  // 关闭模态框并重置状态
  const closeModal = () => {
    if (changeLoading) return;  // 加载中不允许关闭
    setShowUsernameModal(false);
    setNewUsername("");
    setUsernameError("");
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (
      !window.confirm("Confirm to delete your account? All data will be lost!")
    )
      return;

    const res = await authFetch(`${API_BASE}/user/delete`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (data.code === 200) {
      alert("Account deleted successfully");
      navigate("/");
      window.location.reload();
    }
  };

  // 修改用户名逻辑
  const handleUsernameChange = async () => {
    setUsernameError("");
    const trimmed = newUsername.trim();
    if (!trimmed) {
      setUsernameError("Username cannot be empty");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 50) {
      setUsernameError("Username must be 3-50 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError("Username can only contain letters, numbers and underscores");
      return;
    }
    if (trimmed.toLowerCase() === user.username.toLowerCase()) {
      setUsernameError("New username is the same as your current username.");
      return;
    }

    setChangeLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/user/username`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_username: trimmed }),
      });
      const data = await res.json();
      if (data.code === 200) {
        // 成功：更新 token，刷新页面
        if (data.data.access_token) {
          localStorage.setItem("token", data.data.access_token);
        }
        if (data.data.csrf_token) {
          document.cookie = `csrf_token=${data.data.csrf_token}; path=/`;
        }
        alert("Username updated successfully! Page will refresh.");
        window.location.reload();
      } else {
        // 失败：显示错误，重置 loading，不关闭模态框
        setUsernameError(data.msg || "Failed to update username");
        setChangeLoading(false);
      }
    } catch (err) {
      setUsernameError("Network error, please try again");
      setChangeLoading(false);
    }
  };

  if (!user) return <div className="section">Loading...</div>;

  const { inCooldown, remainingDays } = cooldownInfo;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-4">
            <div className="card">
              <div className="card-content">
                <h2 className="title is-4 has-text-centered">My Profile</h2>
                <p className="mb-2">
                  <strong>Username:</strong> {user.username}
                </p>
                <p className="mb-2">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="mb-2">
                  <strong>Role:</strong> {user.role}
                </p>
                <hr />
                {/* 修改用户名按钮 — 冷却期内禁用并提示剩余天数 */}
                {inCooldown ? (
                  <div>
                    <button
                      className="button is-fullwidth is-dark mb-1"
                      disabled
                      title={`You can change your username again in ${remainingDays} day(s)`}
                    >
                      Change Username
                    </button>
                    <p className="help has-text-centered mb-3">
                      Available in {remainingDays} day{remainingDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                ) : (
                  <button
                    className="button is-fullwidth is-dark mb-3"
                    onClick={() => setShowUsernameModal(true)}
                  >
                    Change Username
                  </button>
                )}

                <button
                  className="button is-fullwidth mt-2"
                  style={{ backgroundColor: "#8B0000", color: "white" }}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 修改用户名的模态框 */}
      {showUsernameModal && (
        <div className="modal is-active">
          <div
            className="modal-background"
            onClick={closeModal}
          ></div>
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Change Username</p>
              <button
                className="delete"
                onClick={closeModal}
                disabled={changeLoading}
              ></button>
            </header>
            <section className="modal-card-body">
              <div className="field">
                <label className="label">New Username</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Enter new username (letters, numbers, underscore)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={changeLoading}
                  />
                </div>
                {usernameError && (
                  <p className="help is-danger">{usernameError}</p>
                )}
                <p className="help is-dark mt-2">
                  You can change username once every 30 days.
                </p>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button
                className="button is-dark"
                onClick={handleUsernameChange}
                disabled={changeLoading}
              >
                {changeLoading ? "Updating..." : "Save"}
              </button>
              <button
                className="button ml-2"
                onClick={closeModal}
                disabled={changeLoading}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProfilePage;
