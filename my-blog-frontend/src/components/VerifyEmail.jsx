import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = "http://localhost:8000";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!token) {
      setStatus("Invalid Token");
      return;
    }

    fetch(`${API_BASE}/api/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.msg);
      })
      .catch(() => {
        setStatus("Failed");
      });
  }, [token]);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>{status}</h1>
    </div>
  );
}

export default VerifyEmail;