import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");
  const [errorType, setErrorType] = useState(null);
  // null = no error yet (initial "Verifying...")
  // "timeout" = fetch timed out → retryable
  // "network" = fetch failed → retryable
  // "server" = backend 5xx → retryable
  // "permanent"= backend 4xx (invalid/expired token) → NOT retryable

  const verify = useCallback(() => {
    if (!token) {
      setStatus("Invalid Token");
      setErrorType("permanent");
      return;
    }

    setStatus("Verifying...");
    setErrorType(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        setStatus(data.msg);
        if (data.code === 200) {
          setErrorType(null); // success
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else if (data.code === 400) {
          setErrorType("permanent"); // token 过期/无效，重试无意义
        } else {
          setErrorType("server"); // 500 等，可能是临时故障
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          setStatus("Request timed out. Please try again.");
          setErrorType("timeout");
        } else {
          setStatus("Network error. Please try again.");
          setErrorType("network");
        }
      });
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-6">
            <div className="card">
              <div
                className="card-content"
                style={{ textAlign: "center", padding: "3rem" }}
              >
                <h1 className="title is-4">{status}</h1>

                {/* 等待中：不确定进度条 */}
                {status === "Verifying..." && (
                  <progress
                    className="progress is-small is-dark"
                    max="100"
                    style={{ maxWidth: "300px", margin: "1.5rem auto 0" }}
                  />
                )}

                {/* 瞬态错误：提供 Retry */}
                {(errorType === "timeout" ||
                  errorType === "network" ||
                  errorType === "server") && (
                  <button
                    className="button is-dark is-small mt-4"
                    onClick={verify}
                  >
                    Retry
                  </button>
                )}

                {/* 永久错误：引导重新注册 */}
                {errorType === "permanent" && (
                  <p className="has-text-grey mt-4">
                    The verification link is invalid or has expired.{" "}
                    <a href="/register">Register again</a>
                  </p>
                )}

                {/* 始终保留手动跳转登录 */}
                <p className="has-text-grey mt-4">
                  <a href="/login">Go to login</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;