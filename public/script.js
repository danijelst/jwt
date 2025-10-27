// Elements
const headerTextarea = document.getElementById("header");
const payloadTextarea = document.getElementById("payload");
const privateKeyTextarea = document.getElementById("privateKey");
const publicKeyTextarea = document.getElementById("publicKey");
const jwtTextarea = document.getElementById("jwt");
const jwtHighlight = document.getElementById("jwt-highlight");

const headerValidation = document.getElementById("headerValidation");
const payloadValidation = document.getElementById("payloadValidation");
const privateKeyValidation = document.getElementById("privateKeyValidation");
const publicKeyValidation = document.getElementById("publicKeyValidation");

const clearHeaderBtn = document.getElementById("clearHeader");
const clearPayloadBtn = document.getElementById("clearPayload");
const clearPrivateKeyBtn = document.getElementById("clearPrivateKey");
const clearPublicKeyBtn = document.getElementById("clearPublicKey");
const copyJwtBtn = document.getElementById("copyJwtBtn");
const clearJwtBtn = document.getElementById("clearJwtBtn");

let suppressJwtUpdate = false;
let suppressPayloadUpdate = false;
let suppressHeaderUpdate = false;

// Helper: Validate JSON and return parsed object or null
function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Highlight JSON in the editor
function highlightJSON(json) {
  if (!json) return '';
  
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  ).replace(/[{}\[\],]/g, function(match) {
    return '<span class="json-punctuation">' + match + '</span>';
  });
}

// Update JSON highlight for a field
function updateJSONHighlight(field) {
  const textarea = document.getElementById(field);
  const highlight = document.getElementById(field + '-highlight');
  
  let content = textarea.value;
  if (!content.trim()) {
    highlight.innerHTML = '';
    return;
  }

  try {
    // Only format if it's not already formatted
    const parsed = JSON.parse(content);
    if (!content.includes('\n')) {
      content = JSON.stringify(parsed, null, 2);
      textarea.value = content; // Update textarea with formatted JSON
    }
  } catch (e) {
    // If invalid JSON, just use the raw content
  }
  
  // Ensure proper escaping of HTML entities
  const highlighted = highlightJSON(content);
  highlight.innerHTML = highlighted || content;

  // Sync scroll position
  textarea.addEventListener('scroll', () => {
    highlight.scrollTop = textarea.scrollTop;
  });
}

// Highlight JWT parts
function highlightJWT(jwt) {
  const parts = jwt.split(".");
  const header = parts[0] || "";
  const payload = parts[1] || "";
  const signature = parts[2] || "";

  return `
    <span class="jwt-highlight jwt-header">${escapeHtml(header)}</span><span class="jwt-dot">.</span>
    <span class="jwt-highlight jwt-payload">${escapeHtml(payload)}</span><span class="jwt-dot">.</span>
    <span class="jwt-highlight jwt-signature">${escapeHtml(signature)}</span>
  `;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");
}

// Update JWT parts with different colors
function updateJwtHighlight() {
  const jwt = jwtTextarea.value;
  const parts = jwt.split('.');
  
  if (parts.length === 3) {
    const header = parts[0];
    const payload = parts[1];
    const signature = parts[2];
    
    jwtTextarea.style.color = 'inherit';
    // The coloring will be handled by CSS based on the structure
  }
}

// Encode JWT logic (placeholder for your encoding function)
// You may replace this with your actual JWT sign function.
async function encodeJWT(headerObj, payloadObj, privateKey) {
  // Using Web Crypto API or library for JWT signing is complex
  // For demo, just encode header.payload and add dummy signature

  const base64url = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const headerStr = JSON.stringify(headerObj);
  const payloadStr = JSON.stringify(payloadObj);

  const encodedHeader = base64url(headerStr);
  const encodedPayload = base64url(payloadStr);

  // If no private key, just return header.payload.
  if (!privateKey) return `${encodedHeader}.${encodedPayload}.`;

  // For demo: dummy signature (replace with actual signing)
  const dummySignature = "signed_signature";

  return `${encodedHeader}.${encodedPayload}.${dummySignature}`;
}

// Decode JWT into header and payload fields
function decodeJwt(jwt) {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { header, payload };
  } catch {
    return null;
  }
}

// Validation message helpers
function showValidation(elem, message, isError = false, isSuccess = false) {
  elem.textContent = message;
  elem.classList.toggle("validation-error", isError);
  elem.classList.toggle("validation-success", isSuccess);
  if (!message) {
    elem.classList.remove("validation-error", "validation-success");
  }
}

// On JWT input change - decode JWT and update header & payload fields
jwtTextarea.addEventListener("input", () => {
  updateJwtHighlight();

  if (suppressJwtUpdate) return;
  const decoded = decodeJwt(jwtTextarea.value);
  if (!decoded) {
    showValidation(headerValidation, "Invalid JWT format", true);
    showValidation(payloadValidation, "Invalid JWT format", true);
    return;
  }
  showValidation(headerValidation, "Valid header", false, true);
  showValidation(payloadValidation, "Valid payload", false, true);

  suppressHeaderUpdate = true;
  suppressPayloadUpdate = true;

  headerTextarea.value = JSON.stringify(decoded.header, null, 2);
  payloadTextarea.value = JSON.stringify(decoded.payload, null, 2);
  
  // Update the highlights for both fields
  updateJSONHighlight('header');
  updateJSONHighlight('payload');

  suppressHeaderUpdate = false;
  suppressPayloadUpdate = false;
});

// On Header change - validate JSON, update validation message, and regenerate JWT if private key exists
headerTextarea.addEventListener("input", async () => {
  if (suppressHeaderUpdate) return;

  const json = tryParseJSON(headerTextarea.value);
  if (!json) {
    showValidation(headerValidation, "Invalid JSON header", true);
  } else {
    showValidation(headerValidation, "Valid header", false, true);
    updateJSONHighlight('header');
  }

  await regenerateJwtIfPossible();
});

// On Payload change - validate JSON, update validation message, and regenerate JWT if private key exists
payloadTextarea.addEventListener("input", async () => {
  if (suppressPayloadUpdate) return;

  const json = tryParseJSON(payloadTextarea.value);
  if (!json) {
    showValidation(payloadValidation, "Invalid JSON payload", true);
  } else {
    showValidation(payloadValidation, "Valid payload", false, true);
    updateJSONHighlight('payload');
  }

  await regenerateJwtIfPossible();
});

// On private key change - just validate presence for demo
privateKeyTextarea.addEventListener("input", async () => {
  const val = privateKeyTextarea.value.trim();
  if (!val) {
    showValidation(privateKeyValidation, "Private key must not be empty.", true);
  } else {
    showValidation(privateKeyValidation, "", false, false);
  }

  await regenerateJwtIfPossible();
});

// On public key change - just clear validation for demo
publicKeyTextarea.addEventListener("input", () => {
  showValidation(publicKeyValidation, "", false, false);
});

// Clear buttons
clearHeaderBtn.addEventListener("click", () => {
  headerTextarea.value = "";
  showValidation(headerValidation, "", false, false);
});

clearPayloadBtn.addEventListener("click", () => {
  payloadTextarea.value = "";
  showValidation(payloadValidation, "", false, false);
});

clearPrivateKeyBtn.addEventListener("click", () => {
  privateKeyTextarea.value = "";
  showValidation(privateKeyValidation, "", false, false);
});

clearPublicKeyBtn.addEventListener("click", () => {
  publicKeyTextarea.value = "";
  showValidation(publicKeyValidation, "", false, false);
});

// Generic copy handler
function handleCopy(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "COPIED!";
    setTimeout(() => (button.textContent = "COPY"), 1500);
  });
}

// Copy buttons
copyJwtBtn.addEventListener("click", () => {
  handleCopy(copyJwtBtn, jwtTextarea.value);
});

document.getElementById("copyHeader").addEventListener("click", () => {
  handleCopy(document.getElementById("copyHeader"), headerTextarea.value);
});

document.getElementById("copyPayload").addEventListener("click", () => {
  handleCopy(document.getElementById("copyPayload"), payloadTextarea.value);
});

document.getElementById("copyPrivateKey").addEventListener("click", () => {
  handleCopy(document.getElementById("copyPrivateKey"), privateKeyTextarea.value);
});

document.getElementById("copyPublicKey").addEventListener("click", () => {
  handleCopy(document.getElementById("copyPublicKey"), publicKeyTextarea.value);
});

// Regenerate JWT if private key present and header/payload valid
async function regenerateJwtIfPossible() {
  const headerJson = tryParseJSON(headerTextarea.value);
  const payloadJson = tryParseJSON(payloadTextarea.value);
  const privateKey = privateKeyTextarea.value.trim();

  if (!headerJson || !payloadJson) return;

  if (!privateKey) {
    // If no private key, just encode header.payload. with empty signature
    const dummyJwt = await encodeJWT(headerJson, payloadJson, null);
    suppressJwtUpdate = true;
    jwtTextarea.value = dummyJwt;
    updateJwtHighlight();
    suppressJwtUpdate = false;
    return;
  }

  // Here you would sign with the privateKey and generate JWT properly.
  // For now, use dummy signature.
  const signedJwt = await encodeJWT(headerJson, payloadJson, privateKey);
  suppressJwtUpdate = true;
  jwtTextarea.value = signedJwt;
  updateJwtHighlight();
  suppressJwtUpdate = false;
}

// Clear JWT button
clearJwtBtn.addEventListener("click", () => {
  jwtTextarea.value = "";
  updateJwtHighlight();
  showValidation(headerValidation, "", false, false);
  showValidation(payloadValidation, "", false, false);
});

// Initialize
window.addEventListener("load", () => {
  updateJwtHighlight();

  // Run validation for header and payload if present
  if (headerTextarea.value.trim()) {
    headerTextarea.dispatchEvent(new Event("input"));
    updateJSONHighlight('header');
  }
  if (payloadTextarea.value.trim()) {
    payloadTextarea.dispatchEvent(new Event("input"));
    updateJSONHighlight('payload');
  }
});
