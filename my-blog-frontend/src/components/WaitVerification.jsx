import { useEffect, useState } from 'react';

const API_BASE = "http://localhost:8000";

function WaitVerification() {
  const [status, setStatus] = useState("Waiting for email verification...");
  const username = localStorage.getItem('verify_username');

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check?username=${username}`);
        const data = await res.json();
        
        if (data.is_verified) {
          localStorage.removeItem('verify_username');

          setStatus("Verification successful! Redirecting to login...");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
      } catch (err) {
        console.log("Checking verification status...");
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-6">
            <div className="card">
              <div className="card-content" style={{ textAlign: "center", padding: "3rem" }}>
                <h1 className="title is-4">Registration Successful</h1>
                <p className="has-text-grey-dark">
                  Please check your email to activate your account.
                </p>
                <p className="has-text-grey mt-2">{status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WaitVerification;