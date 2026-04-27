import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = "http://localhost:8000";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying your email...");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("Invalid verification link");
      return;
    }

    fetch(`${API_BASE}/api/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) {
          setStatus("Email verified successfully!");
          setVerified(true);
        } else {
          setStatus(data.msg || "Verification failed");
        }
      });
  }, [token]);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-6">
            <div className="card">
              <div className="card-content" style={{ textAlign: "center", padding: "3rem" }}>
                <h1 className="title is-4">
                  {verified ? "🎉" : "⏳"} {status}
                </h1>
                {verified && (
                  <p className="has-text-grey mt-2">
                    You may close this page now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;