# MeetOps Studio 🏛️

> **Stand-alone Meeting Action Extraction & Deterministic Routing Application**  
> Built with Next.js 15, React 19, Tailwind CSS, Google Gemini 2.0 Flash / Ollama `qwen2.5:3b`, and Basecamp 3 API.  
> Styled using the **Editorial Neo-Brutalist Technical Archive** design system from [Ajay's Portfolio](https://ajay-710.github.io/Portfolio/).

---

## ⚡ Features

1. **Deterministic Routing Engine (Spec v1.1)**:
   - Full 2x2 matrix implementation:
     - `External - Single Project` (e.g. FOOGO Governance) -> Specific Client
     - `Internal - Single Project` (e.g. FOOGO Blog Planning) -> Specific Client
     - `External - Multi-Project` (e.g. BOLDEST Partner Sync) -> Contextual Routing
     - `Internal - Multi-Project` (e.g. eStride Daily Standup) -> Mention-based / Standup Heuristics
   - **Pipeline & Inactive Protection**: Automatically re-routes Pipeline (`eFin`, `NOVOS FiBER`, `AT&T`, `FamilyGuard`) and Inactive (`Sandiva`) tasks into eStride with `[Pipeline: Name]` prefixes.
   - **Client Commitment Isolation**: Distinguishes client promises (e.g. Divya sharing pricing sheets) from internal eStride deliverables, excluding them from Basecamp creation.
   - **Relative Date Grounding**: Accurately grounds "by Friday", "tomorrow", "today" against meeting date without false precision for vague terms.

2. **FOOGO Green List Routing Profile v1.0**:
   - Classifies FOOGO tasks into 8 approved lists:
     - `Marketing Automation` (Klaviyo flows)
     - `Paid Media` (Meta/Google Ads)
     - `Website` (Shopify theme/glitches)
     - `Content` (Blog copy/guides)
     - `SEO & AEO` (Schema.org/search optimization)
     - `Analytics & Reporting` (GA4/metrics)
     - `Operations` (Pricing sheets/inventory)
     - `Requires Routing` (Fallback/triage)

3. **Dual AI Extraction + Offline Simulation**:
   - **Google Gemini 2.0 Flash**: Cloud extraction via `@google/generative-ai`.
   - **Ollama (`qwen2.5:3b`)**: Local private inference with zero cloud data transmission.
   - **Demo Simulation Mode**: Ready out-of-the-box with preset transcripts and offline mocking for instant reviews.

4. **Basecamp 3 Zero-Drift Sync**:
   - Single-click staging to Basecamp To-dos.
   - Safe Simulation mode enabled by default (inspect JSON payloads before executing live calls).

---

## 🚀 Quickstart & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Open your browser
# Navigate to http://localhost:3000
```

---

## 🌐 Deploying to Vercel

MeetOps Studio uses Next.js App Router and serverless route handlers, making it natively optimized for Vercel deployment:

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial MeetOps Studio deployment"
   git branch -M main
   git remote add origin https://github.com/your-username/meetops-studio.git
   git push -u origin main
   ```
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Add environment variables in Vercel project settings:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `BASECAMP_ACCOUNT_ID`: Your Basecamp account ID (optional for live sync).
   - `BASECAMP_ACCESS_TOKEN`: Your Basecamp OAuth/Bearer token (optional for live sync).
4. Click **Deploy**!
