import { useEffect, useState } from "react";

const API_URL =
  "https://mystore-backend-u6ey.onrender.com";

function PhoneVerification() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // GET ADMIN TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("accessToken");
  };

  // ============================================================
  // FETCH REQUESTS
  // ============================================================

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Admin session expired.");
      }

      const response = await fetch(
        `${API_URL}/users/admin/phone-verification`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load verification requests."
        );
      }

      console.log(
        "PHONE VERIFICATION REQUESTS:",
        data.requests
      );

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      console.log(
        "PHONE VERIFICATION ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load verification requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchRequests();
  }, []);

  // ============================================================
  // GET REQUEST ID
  // ============================================================

  const getRequestId = (request) => {
    if (!request) {
      return null;
    }

    if (
      typeof request._id === "string" &&
      request._id.trim()
    ) {
      return request._id;
    }

    if (
      request._id &&
      typeof request._id === "object" &&
      typeof request._id.$oid === "string"
    ) {
      return request._id.$oid;
    }

    if (
      typeof request.id === "string" &&
      request.id.trim()
    ) {
      return request.id;
    }

    return null;
  };

  // ============================================================
  // GET REQUEST TYPE
  // ============================================================

  const getRequestType = (request) => {
    const type =
      request?.phoneVerificationType ||
      request?.requestType ||
      request?.type ||
      "";

    if (type === "REGISTER") {
      return "Register";
    }

    if (type === "LOGIN") {
      return "Login";
    }

    return "Verification";
  };

  // ============================================================
  // OPEN WHATSAPP
  // ============================================================

  const openWhatsApp = (phone, otp) => {
    if (!phone || !otp) {
      return;
    }

    const cleanPhone = phone.replace(
      /[^0-9]/g,
      ""
    );

    if (!cleanPhone) {
      alert("Invalid phone number.");
      return;
    }

    const message =
      `BStore verification code: ${otp}`;

    const whatsappUrl =
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // MARK REQUEST COMPLETED
  // ============================================================

  const markCompleted = async (request) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin session expired."
        );
      }

      const requestId =
        getRequestId(request);

      if (!requestId) {
        throw new Error(
          "This verification request has no valid user ID."
        );
      }

      console.log(
        "MARK COMPLETED USER ID:",
        requestId
      );

      const response = await fetch(
        `${API_URL}/users/admin/phone-verification/${requestId}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: "completed",
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        "MARK COMPLETED RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update verification request."
        );
      }

      await fetchRequests();

    } catch (err) {
      console.log(
        "MARK COMPLETED ERROR:",
        err
      );

      alert(
        err.message ||
          "Unable to update request."
      );
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "—";
    }

    return parsedDate.toLocaleString();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="phone-verification-page">

        <div className="phone-verification-header">

          <div>
            <h1>
              Phone Verification
            </h1>

            <p>
              Manage Register and Login
              verification requests.
            </p>
          </div>

        </div>

        <div className="phone-verification-loading">

          <div className="phone-verification-spinner"></div>

          <p>
            Loading verification requests...
          </p>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="phone-verification-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="phone-verification-header">

        <div>

          <h1>
            Phone Verification
          </h1>

          <p>
            Manage Register and Login
            verification requests.
          </p>

        </div>

        <button
          type="button"
          className="phone-verification-refresh"
          onClick={fetchRequests}
        >
          🔄 Refresh
        </button>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="phone-verification-error">

          <div>
            <strong>
              Error
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchRequests}
          >
            Try Again
          </button>

        </div>
      )}


      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!error &&
        requests.length === 0 && (
          <div className="phone-verification-empty">

            <div className="phone-verification-empty-icon">
              📱
            </div>

            <h2>
              No Pending Requests
            </h2>

            <p>
              There are currently no phone
              verification requests waiting
              for approval.
            </p>

          </div>
        )}


      {/* ======================================================
          REQUEST LIST
      ====================================================== */}

      {requests.length > 0 && (
        <div className="phone-verification-list">

          {requests.map((request, index) => {

            const requestId =
              getRequestId(request);

            const firstName =
              request.firstName ||
              request.name ||
              "";

            const lastName =
              request.lastName ||
              "";

            const fullName =
              `${firstName} ${lastName}`.trim() ||
              "Unknown User";

            const phone =
              request.phone ||
              "—";

            const otp =
              request.otp ||
              request.verificationCode ||
              request.whatsappOtp ||
              "—";

            const requestType =
              getRequestType(request);

            const expires =
              request.expiresAt ||
              request.whatsappOtpExpires;

            return (
              <div
                className="phone-verification-card"
                key={
                  requestId ||
                  `request-${index}`
                }
              >

                {/* ==================================================
                    TOP
                ================================================== */}

                <div className="phone-verification-card-top">

                  <div className="phone-verification-card-user">

                    <div className="phone-verification-avatar">
                      {fullName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <h3>
                        {fullName}
                      </h3>

                      <p>
                        {phone}
                      </p>

                    </div>

                  </div>


                  {/* STATUS */}

                  <div className="phone-verification-status waiting">

                    <span className="phone-verification-status-dot"></span>

                    Waiting

                  </div>

                </div>


                {/* ==================================================
                    INFORMATION
                ================================================== */}

                <div className="phone-verification-details">

                  {/* REQUEST TYPE */}

                  <div className="phone-verification-info">

                    <span className="phone-verification-label">
                      Request Type
                    </span>

                    <strong
                      className={`phone-verification-type ${
                        requestType ===
                        "Register"
                          ? "register"
                          : requestType ===
                            "Login"
                          ? "login"
                          : ""
                      }`}
                    >
                      {requestType}
                    </strong>

                  </div>


                  {/* STATUS */}

                  <div className="phone-verification-info">

                    <span className="phone-verification-label">
                      Status
                    </span>

                    <strong className="phone-verification-waiting">
                      Waiting
                    </strong>

                  </div>


                  {/* OTP */}

                  <div className="phone-verification-info">

                    <span className="phone-verification-label">
                      OTP
                    </span>

                    <strong className="phone-verification-otp">
                      {otp}
                    </strong>

                  </div>


                  {/* EXPIRES */}

                  <div className="phone-verification-info">

                    <span className="phone-verification-label">
                      Expires
                    </span>

                    <strong>
                      {formatDate(expires)}
                    </strong>

                  </div>

                </div>


                {/* ==================================================
                    ADDRESS
                ================================================== */}

                {request.address && (
                  <div className="phone-verification-address">

                    <span className="phone-verification-label">
                      Address
                    </span>

                    <p>
                      {request.address}
                    </p>

                  </div>
                )}


                {/* ==================================================
                    ACTIONS
                ================================================== */}

                <div className="phone-verification-actions">

                  <button
                    type="button"
                    className="phone-verification-whatsapp"
                    disabled={
                      !request.phone ||
                      !otp ||
                      otp === "—"
                    }
                    onClick={() =>
                      openWhatsApp(
                        request.phone,
                        otp
                      )
                    }
                  >
                    💬 Send WhatsApp
                  </button>


                  <button
                    type="button"
                    className="phone-verification-complete"
                    disabled={!requestId}
                    onClick={() =>
                      markCompleted(request)
                    }
                  >
                    ✓ Completed
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default PhoneVerification;