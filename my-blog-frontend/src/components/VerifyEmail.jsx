import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!token) {
      setStatus("Invalid Token");
      return;
    }

    authFetch(`/api/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.msg);
      })
      .catch(() => {
        setStatus("Failed");
      });
  }, [token]);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-6">
            <div className="card">
              <div className="card-content" style={{ textAlign: "center", padding: "3rem" }}>
                <h1 className="title is-4">{status}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;