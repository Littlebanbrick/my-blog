import { useEffect, useState } from "react";

function WaitVerification() {
  const [status, setStatus] = useState("");
  const username = localStorage.getItem("verify_username");

  useEffect(() => {
    // No polling needed — verification is completed via email link.
    // Just show a static prompt and clear the stored username on mount.
    setStatus(
      "Verification email sent. Please check your inbox (and spam folder).",
    );
    // Clear stale verify_username after 15 min (token expiry)
    const timer = setTimeout(
      () => {
        localStorage.removeItem("verify_username");
      },
      15 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, []);

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
                <h1 className="title is-4">Registration Successful</h1>
                <p className="has-text-grey-dark">
                  Please check your email to activate your account.
                </p>
                {username && (
                  <p className="has-text-grey-dark mt-2">
                    An email was sent to the address you provided.
                  </p>
                )}
                <p className="has-text-grey mt-2">{status}</p>
                <p className="has-text-grey is-size-7 mt-4">
                  After verifying, you can{" "}
                  <a href="/login" style={{ color: "#333" }}>
                    log in here
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WaitVerification;
