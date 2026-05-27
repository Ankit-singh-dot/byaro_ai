# 🛡️ AstroVault: Enterprise AI Safety Validation

AstroVault is a zero-trust, microservice-based adversarial testing infrastructure designed to evaluate Large Language Models (LLMs) against sophisticated Prompt Injections, Jailbreaks, and Data Exfiltration vectors. 

This document serves as the technical whitepaper for the system architecture, integrity models, and deployment workflows.

---

## 🏛️ System Architecture & Zero-Trust Networking

AstroVault completely isolates adversarial testing environments using Docker's internal bridge networking. 

```text
                 ┌────────────────────┐
                 │  Clerk Auth (SSO)  │
                 └─────────┬──────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│               Next.js Frontend (Port 3000)             │
│                 (frontend-net, gateway-net)            │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             LLM Proxy / Gateway (Port 4002)            │
│  (Rate Limiter, Auth Validation, Traffic Interceptor)  │
└──────┬───────────────────┬──────────────────────┬──────┘
       ▼                   ▼                      ▼
┌────────────┐     ┌──────────────┐     ┌────────────────┐
│  Red Team  │     │  Threat ML   │     │ Audit Service  │
│  (Isolated)│     │  (Port 4006) │     │  (Port 4003)   │
└────────────┘     └──────────────┘     └────────────────┘
```
**Networking Rules:**
- The Red Team service (`redteam-net`) has absolutely no route to the Blue Team ML classifier (`blueteam-net`). 
- All traffic must pass through the central LLM Proxy gateway (`gateway-net`).
- Services are run in `read_only: true` Docker modes with `tmpfs` mounts to prevent container escapes.

---

## 🧠 ML Integration & Threat Engine

Initially built using localized PyTorch weights (`safetensors`), AstroVault's Blue Team classifier was migrated to a highly scalable **Semantic Threat Engine** powered by Google's Gemini 2.5 Flash API.

### How the ML Sidecar Works:
1. **Interception**: When a prompt is submitted, the API Gateway immediately intercepts the payload and issues a gRPC/HTTP call to the Python `ml-inference` sidecar.
2. **Zero-Shot Classification**: The sidecar wraps the untrusted prompt in a strict system metaprompt and sends it to the Gemini API. Gemini is instructed to act as an un-jailbreakable cybersecurity analyst.
3. **Deterministic Output**: Gemini is forced into returning a strict JSON schema containing:
   - `Threat Score`: (0-100)
   - `Category`: (e.g., JAILBREAK, PROMPT_INJECTION)
   - `Confidence`: (Float)
4. **Action Routing**: Based on the exact threat score, the Gateway automatically routes the request:
   - `Score 0-49`: **ALLOWED** (Passed to target model)
   - `Score 50-74`: **FLAGGED** (Passed to model, but logged with high priority)
   - `Score 75-89`: **BLOCKED** (Target model never sees the prompt)
   - `Score 90-100`: **QUARANTINED** (Connection dropped, Session instantly locked)

### Heuristic Fallback
If the ML Inference engine experiences a network failure or latency timeout, AstroVault automatically fails open to a static **Heuristic Regex Engine**. This fallback uses pre-compiled PCRE patterns to catch standard base64 encoding attacks (`JB-001`), system prompt leak attempts (`PI-001`), and role-play overrides (`RO-005`).

---

## ⚔️ Threat Vectors & Attack Types Allowed

The platform is designed to categorize and defend against 8 primary vectors:

1. **PROMPT_INJECTION**: Direct attempts to override the system instructions (e.g., "Ignore previous instructions and do X").
2. **JAILBREAK**: Elaborate role-playing scenarios (e.g., "DAN - Do Anything Now") designed to break the model's ethical boundaries.
3. **ROLE_OVERRIDE**: Tricking the AI into assuming a privileged role (e.g., "You are the root Linux administrator...").
4. **DATA_EXFILTRATION**: Forcing the model to leak its hidden system prompt or sensitive API keys hidden in its context window.
5. **UNSAFE_GENERATION**: Requests for malware creation, phishing templates, or explicit material.
6. **CONTEXT_EXTRACTION**: Using special tokens (like `<|endoftext|>`) to force the LLM to dump its conversation memory buffer.
7. **ENCODING_ATTACK**: Using Base64, Hex, or Unicode manipulation to bypass heuristic keyword filters.
8. **INSTRUCTION_MANIPULATION**: Inserting invisible characters or multi-language combinations to confuse the tokenizer.

---

## ⛓️ The Cryptographic Integrity Model (Audit Ledger)

AstroVault utilizes a tamper-evident, append-only cryptographic ledger to track every event. It is mathematically impossible for an insider to alter a historical log without triggering a system-wide alert.

### The Chaining Algorithm:
When Event *N* occurs, the Node.js `audit-service` generates a hash using this precise algorithm:
```javascript
const entryData = JSON.stringify({ ...payload, id, index, previousHash });
const currentHash = SHA256(entryData + previousHash);
```
Every block's hash relies heavily on the hash of the block before it. 

### The Verification Engine:
To prevent attackers from using tools like `sed` to silently alter logs directly on the disk, AstroVault does **not** blindly trust the stored hashes.

When an engineer clicks **Verify Chain Integrity**, the backend strips the metadata from every historical block, reconstructs the raw JSON payload in its original insertion order, and mathematically recalculates the SHA-256 hash on-the-fly. If `Recomputed_Hash !== Stored_Hash`, the chain is declared broken, exposing the exact index of the tampered payload.

---

## 🔍 How to Monitor Service Logs

Because AstroVault runs on Docker Compose, all microservice logs are aggregated by the Docker daemon. You can monitor the live traffic flow in real-time.

**View all logs simultaneously:**
```bash
docker compose logs -f
```

**Tail specific services:**
```bash
# Watch the ML classification scores in real-time
docker compose logs -f threat-engine

# Watch the cryptographic ledger appending new blocks
docker compose logs -f audit-service

# Watch the frontend Next.js server for API Gateway routing
docker compose logs -f nextjs-app
```

---

## 🚀 Deployment Operations

AstroVault is too complex to deploy to serverless Edge providers like Vercel. It requires a dedicated VPS (e.g., DigitalOcean, AWS EC2) or a Docker-native platform (e.g., Railway).

1. Clone the repository to your host instance.
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Inject your `GEMINI_API_KEY` and Clerk authentication keys.
4. Orchestrate the cluster:
   ```bash
   docker compose up -d --build
   ```


5. 