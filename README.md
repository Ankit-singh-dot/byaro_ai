# 🛡️ AstroVault

AstroVault is an **Enterprise-Grade AI Safety Validation & Adversarial Testing Infrastructure**. It provides a highly secure, zero-trust sandbox environment designed to stress-test Large Language Models (LLMs) against jailbreaks, prompt injections, and data exfiltration attacks.

Unlike basic testing scripts, AstroVault is built using a microservice architecture with mathematically rigorous, tamper-evident audit logging and semantic threat analysis powered by Gemini 2.5 Flash.

---

## 🌟 Core Features

### 1. Zero-Trust Network Isolation
AstroVault operates using **four isolated Docker networks** (`frontend-net`, `gateway-net`, `redteam-net`, `blueteam-net`). The Red Team and Blue Team services are physically segregated at the networking layer. They cannot communicate directly; all cross-boundary traffic is forced through a heavily monitored central API Gateway.

### 2. Semantic Threat Engine (Blue Team)
Legacy security systems rely on brittle regex patterns to catch attacks. AstroVault uses a lightweight Python sidecar (`ml-inference`) to proxy traffic to **Gemini 2.5 Flash**, effectively using an LLM to police another LLM. It instantly categorizes attacks, generates a semantic threat score (0-100), and blocks high-risk prompts before they ever reach the target model.

### 3. Immutable Audit Ledger
Every prompt submitted, blocked, flagged, or quarantined is recorded in a tamper-evident cryptographic ledger. 
Using techniques similar to blockchain, every single log entry calculates a **SHA-256 Hash** based on its own data payload combined with the hash of the *previous* entry. If an attacker attempts to edit the JSON database file to cover their tracks, the cryptographic chain instantly breaks and triggers a system-wide alert.

### 4. Enterprise Authentication
The Mission Control Dashboard is completely locked down using **Clerk**. Unauthenticated traffic is physically blocked via Next.js middleware, ensuring that only authorized security engineers can view the live threat feed and audit chains.

---

## 🏗️ Architecture

```text
                 ┌────────────────────┐
                 │  Clerk Auth (SSO)  │
                 └─────────┬──────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│               Next.js Frontend (Port 3000)             │
│   (Dashboard, Threat Feeds, Audit Integrity Checks)    │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             API Gateway & Rate Limiter                 │
└──────┬───────────────────┬──────────────────────┬──────┘
       ▼                   ▼                      ▼
┌────────────┐     ┌──────────────┐     ┌────────────────┐
│  Red Team  │     │  Blue Team   │     │ Audit Service  │
│  Console   │     │ (Threat ML)  │     │ (Hash-Chained) │
└────────────┘     └──────────────┘     └────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (if running the frontend locally without Docker)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- A [Clerk](https://clerk.com/) account for authentication keys

### 1. Environment Setup
Copy the example environment file and fill in your keys:
```bash
cp .env.example .env
```
Inside your `.env` file, you must provide:
- `GEMINI_API_KEY`: Used by the `ml-inference` service to classify threats.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk frontend key.
- `CLERK_SECRET_KEY`: Clerk backend key for middleware protection.

### 2. Build and Run the Stack
AstroVault is fully containerized. Start the entire microservice architecture with one command:
```bash
docker compose up -d --build
```

The services will be exposed as follows:
- **Dashboard**: `http://localhost:3000`
- **Threat Engine**: `http://localhost:4001`
- **LLM Proxy**: `http://localhost:4002`
- **Audit Service**: `http://localhost:4003`

---

## 🧪 Testing the Audit Ledger Integrity

AstroVault is built to catch insider threats and database tampering. You can test the SHA-256 cryptographic chain yourself!

1. **Simulate an attack**: Open the Dashboard and submit an obvious jailbreak attempt. It will be `QUARANTINED`.
2. **Hack the database**: SSH into the running Docker container and silently edit the log file to cover your tracks using `sed`:
   ```bash
   docker exec astro-vault-audit-service-1 sed -i 's/QUARANTINED/ALLOWED/g' /data/audit.jsonl
   ```
3. **Verify the breach**: Go to the AstroVault Audit page and click **"Verify Chain Integrity"**. 
   The Next.js backend will recalculate the hashes of the data payload on-the-fly, realize the raw text doesn't match the historical cryptographic hash, and throw a massive red **CHAIN BROKEN** alert!

---

## 🛠️ Tech Stack Best Practices

- **Next.js App Router**: Used heavily for Server Components to keep secrets (like Clerk keys and database logic) out of the client bundle.
- **Docker Compose Networking**: Uses `internal: true` on Docker networks to prevent the microservices from accessing the outside internet directly.
- **Pure CSS**: Designed with strict, SOC-grade vanilla CSS and root variables. Avoiding overly neon "AI" aesthetics in favor of a highly professional security design.
- **Rate Limiting**: Custom token-bucket rate limiters are applied at the middleware level to prevent DDoS attacks against the LLM proxy.

## 📜 License
AstroVault is proprietary software designed for internal security auditing.
