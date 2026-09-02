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
return localStorage.getItem(
"accessToken"
);
};

// ============================================================
// FETCH REQUESTS
// ============================================================

const fetchRequests = async (
showLoading = false
) => {
try {
if (showLoading) {
setLoading(true);
}


  setError("");

  const token =
    getToken();

  if (!token) {
    throw new Error(
      "Admin session expired."
    );
  }

  const response =
    await fetch(
      `${API_URL}/users/admin/phone-verification`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },
      }
    );

  let data = {};

  try {
    data =
      await response.json();
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
    Array.isArray(
      data.requests
    )
      ? data.requests
      : []
  );
} catch (err) {
  console.log(
    "PHONE VERIFICATION ERROR:",
    err
  );

  if (showLoading) {
    setError(
      err.message ||
        "Unable to load verification requests."
    );
  }
} finally {
  if (showLoading) {
    setLoading(false);
  }
}


};

// ============================================================
// INITIAL LOAD + AUTO REFRESH
// ============================================================

useEffect(() => {
fetchRequests(true);


const interval =
  setInterval(() => {
    fetchRequests(false);
  }, 5 * 60 * 1000);

return () => {
  clearInterval(interval);
};


}, []);

// ============================================================
// GET REQUEST ID
// ============================================================

const getRequestId = (
request
) => {
if (!request) {
return null;
}

if (
  typeof request._id ===
    "string" &&
  request._id.trim()
) {
  return request._id;
}

if (
  request._id &&
  typeof request._id ===
    "object" &&
  typeof request._id.$oid ===
    "string"
) {
  return request._id.$oid;
}

if (
  typeof request.id ===
    "string" &&
  request.id.trim()
) {
  return request.id;
}

return null;


};

// ============================================================
// GET REQUEST TYPE
// ============================================================

const getRequestType = (
request
) => {
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

if (type === "CHANGE_PHONE") {
  return "Change Phone";
}

return "Verification";


};

// ============================================================
// CHECK CHANGE PHONE
// ============================================================

const isChangePhoneRequest = (
request
) => {
const type =
request?.phoneVerificationType ||
request?.requestType ||
request?.type ||
"";


return type === "CHANGE_PHONE";

};

// ============================================================
// GET WHATSAPP PHONE
// ============================================================

const getWhatsAppPhone = (
request
) => {
if (
isChangePhoneRequest(
request
)
) {
return (
request?.pendingPhone ||
request?.newPhone ||
request?.phone ||
""
);
}


return request?.phone || "";


};

// ============================================================
// OPEN WHATSAPP
// ============================================================

const openWhatsApp = (
phone,
otp
) => {
if (!phone || !otp) {
return;
}

const cleanPhone =
  String(phone).replace(
    /[^0-9]/g,
    ""
  );

if (!cleanPhone) {
  alert(
    "Invalid phone number."
  );

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

const markCompleted = async (
request
) => {
try {
const token =
getToken();

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

  const response =
    await fetch(
      `${API_URL}/users/admin/phone-verification/${requestId}`,
      {
        method: "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          status:
            "completed",
        }),
      }
    );

  let data = {};

  try {
    data =
      await response.json();
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

  await fetchRequests(
    false
  );
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

const formatDate = (
date
) => {
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
return ( <div className="phone-verification-page">

    <div className="phone-verification-header">

      <div>
        <h1>
          Phone Verification
        </h1>

        <p>
          Manage Register, Login, and
          phone change verification requests.
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

return ( <div className="phone-verification-page">


  <div className="phone-verification-header">

    <div>

      <h1>
        Phone Verification
      </h1>

      <p>
        Manage Register, Login, and
        phone change verification requests.
      </p>

    </div>

    <button
      type="button"
      className="phone-verification-refresh"
      onClick={() =>
        fetchRequests(true)
      }
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
        onClick={() =>
          fetchRequests(true)
        }
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

        <small>
          This page automatically checks
          for new requests every 5 minutes.
        </small>

      </div>
    )}

  {/* ======================================================
      REQUEST LIST
  ====================================================== */}

  {requests.length > 0 && (
    <div className="phone-verification-list">

      {requests.map(
        (
          request,
          index
        ) => {

          const requestId =
            getRequestId(
              request
            );

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

          const oldPhone =
            request.phone ||
            "—";

          const newPhone =
            request.pendingPhone ||
            request.newPhone ||
            "";

          const changePhone =
            isChangePhoneRequest(
              request
            );

          const displayPhone =
            changePhone
              ? newPhone || oldPhone
              : oldPhone;

          const whatsappPhone =
            getWhatsAppPhone(
              request
            );

          const otp =
            request.otp ||
            request.verificationCode ||
            request.whatsappOtp ||
            "—";

          const requestType =
            getRequestType(
              request
            );

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

                    {!changePhone && (
                      <p>
                        {displayPhone}
                      </p>
                    )}

                    {changePhone && (
                      <p>
                        {oldPhone}
                        {" → "}
                        {displayPhone}
                      </p>
                    )}

                  </div>

                </div>

                <div className="phone-verification-status waiting">

                  <span className="phone-verification-status-dot"></span>

                  Waiting

                </div>

              </div>

              {/* ==================================================
                  INFORMATION
              ================================================== */}

              <div className="phone-verification-details">

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
                        : requestType ===
                          "Change Phone"
                        ? "change-phone"
                        : ""
                    }`}
                  >
                    {requestType}
                  </strong>

                </div>

                {changePhone && (
                  <>
                    <div className="phone-verification-info">

                      <span className="phone-verification-label">
                        Old Phone
                      </span>

                      <strong>
                        {oldPhone}
                      </strong>

                    </div>

                    <div className="phone-verification-info">

                      <span className="phone-verification-label">
                        New Phone
                      </span>

                      <strong>
                        {newPhone || "—"}
                      </strong>

                    </div>
                  </>
                )}

                {!changePhone && (
                  <div className="phone-verification-info">

                    <span className="phone-verification-label">
                      Phone
                    </span>

                    <strong>
                      {displayPhone}
                    </strong>

                  </div>
                )}

                <div className="phone-verification-info">

                  <span className="phone-verification-label">
                    Status
                  </span>

                  <strong className="phone-verification-waiting">
                    Waiting
                  </strong>

                </div>

                <div className="phone-verification-info">

                  <span className="phone-verification-label">
                    OTP
                  </span>

                  <strong className="phone-verification-otp">
                    {otp}
                  </strong>

                </div>

                <div className="phone-verification-info">

                  <span className="phone-verification-label">
                    Expires
                  </span>

                  <strong>
                    {formatDate(
                      expires
                    )}
                  </strong>

                </div>

              </div>

              {/* ==================================================
                  CHANGE PHONE NOTICE
              ================================================== */}

              {changePhone && (
                <div className="phone-verification-address">

                  <span className="phone-verification-label">
                    Phone Change
                  </span>

                  <p>
                    Send the verification code to the
                    <strong>
                      {" new phone number "}
                    </strong>
                    before the customer can complete
                    the phone change.
                  </p>

                </div>
              )}

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
                    !whatsappPhone ||
                    !otp ||
                    otp === "—"
                  }
                  onClick={() =>
                    openWhatsApp(
                      whatsappPhone,
                      otp
                    )
                  }
                >
                  💬 Send WhatsApp
                </button>

                <button
                  type="button"
                  className="phone-verification-complete"
                  disabled={
                    !requestId
                  }
                  onClick={() =>
                    markCompleted(
                      request
                    )
                  }
                >
                  ✓ Completed
                </button>

              </div>

            </div>
          );
        }
      )}

    </div>
  )}

</div>


);
}

export default PhoneVerification;
