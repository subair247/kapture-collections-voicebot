# Kapture Finance Voicebot (Maya) - Outbound Debt Collections

An AI-powered voice collections agent built on Vapi.ai with an Express/Node.js backend to handle compliance-safe debt recovery, identity verification, Promise-to-Pay (PTP) scheduling, escalation handling, and CRM disposition logging.

---

### 1. Architecture & System Design

The system is designed with a decoupled architecture focusing on sub-1.2s latency, regulatory compliance, and deterministic state transitions:

```text
[ PSTN / WebRTC Call ] 
          │
          ▼
   [ Vapi.ai Engine ]
   ├── STT: Deepgram Nova-2 (Optimized for Indian-accented English & telephony noise)
   ├── LLM: GPT-4o (Strictly system-prompted for collection workflows & guardrails)
   └── TTS: Cartesia / ElevenLabs (Empathetic, clear conversational tone)
          │
     (Webhook / Tool Calls via HTTPS)
          ▼
 [ Mock Backend Server ] (Express.js / Node.js on Render)
   ├── /webhook Router
   ├── verify_customer (Identity confirmation gatekeeper)
   ├── log_promise_to_pay (PTP date & amount capture)
   ├── send_payment_link (SMS/WhatsApp link dispatcher)
   ├── mark_disposition (CRM status update)
   └── escalate_to_agent (Live human handoff & hardship desk)

```

## 2. Design Choices

**Compliance-First State Machine:** Identity verification is treated as a non-negotiable gateway. The system prompt strictly prohibits disclosing debt amount (₹8,499) or overdue days (12 days) until verify_customer executes successfully.

**Resilient Parameter Normalization:** Voice input for codes (e.g., "1, 2, 3, 4", "Twelve thirty-four") produces heterogeneous speech-to-text strings. The backend sanitizes inputs automatically to ensure accurate verification without LLM hallucinations.

**Universal Catch-All Webhook Route:** Both / and /webhook endpoints are bound to the tool processor, accepting structured payloads as well as serialized JSON argument strings to prevent payload-format runtime drops.

**Sub-1.2s Latency Optimization:** Endpoint payloads are lightweight JSON representations returned synchronously to keep the conversation responsive and avoid dead air.

## 3. Bugs Faced & Debugging Process

**Bug 1: Webhook Rejection (503 Service Unavailable on Local Tunnels)**

Cause: Relying on ephemeral SSH tunnels (localhost.run / ngrok) resulted in dropped connections and frequent URL changes during testing, causing Vapi to reject calls.

Resolution: Migrated the mock server to a persistent cloud deployment on Render, providing a permanent HTTPS endpoint with consistent availability.

**Bug 2: JSON Parsing Errors on Serialized Tool Arguments**

Cause: The LLM occasionally passed arguments as a pre-stringified JSON string rather than a parsed JSON object inside toolCalls.function.arguments, causing runtime TypeError exceptions.

Resolution: Implemented dynamic type checking and safe string parsing wrapped in try/catch blocks inside the Express handler.

**Bug 3: Spoken Number Format Mismatches**

Cause: Deepgram transcribed natural pauses as punctuation ("1, 2, 3, 4."), which failed strict number equality checks.

Resolution: Added regex-based non-alphanumeric character stripping in the verification handler and added explicit formatting guidelines to the Vapi tool schema.

## 4. Future Enhancements

**Database Persistence:** Integrate PostgreSQL/MongoDB to store conversation transcripts, token metrics, and PTP commitments across customer accounts.

**Direct SMS Gateway Integration:** Wire up Twilio or AWS SNS to trigger real-time SMS payment links during the call with unique tracking tokens.

**Calling Window & Timezone Middleware:** Enforce regulatory calling window rules (08:00 AM – 07:00 PM recipient local time) at the API trigger layer before outbound dialing initiates.

**Sentiment-Driven Early Escalation:** Implement real-time acoustic sentiment and hardship detection hooks to immediately route distressed borrowers to human hardship desks before standard escalation thresholds are reached.

## 5. Setup & Local Execution
```
# Clone the repository
git clone <https://github.com/subair247/kapture-collections-voicebot.git>
cd kapture-collections-voicebot/mock-server

# Install dependencies
npm install

# Start the mock webhook server
node server.js
```
