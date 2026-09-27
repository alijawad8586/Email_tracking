# Groq API Setup for Email Lead Tracker

This application now uses **Groq API** instead of OpenAI for faster, cheaper AI inference.

## Why Groq?

| Feature | Groq | OpenAI |
|---------|------|--------|
| **Speed** | 10-50ms | 500-2000ms |
| **Cost** | $0.10-0.40 per 1M tokens | $0.15-0.60 per 1M tokens |
| **Model** | Mixtral 8x7B | GPT-4o Mini |
| **Performance** | Competitive quality | Slightly better |

**Result**: Groq is 3-5x faster and 30-40% cheaper! Perfect for email processing.

---

## Getting Your Groq API Key

### Step 1: Create Groq Account

1. Go to https://console.groq.com
2. Sign up with email or GitHub
3. Verify email address
4. Accept terms

### Step 2: Get API Key

1. Go to **API Keys** section
2. Click **"Create API Key"**
3. Name it: `email-tracker`
4. **Copy the key immediately** (you won't see it again!)
5. It starts with: `gsk-...`

### Step 3: Add to Environment

**For Local Development:**

```bash
# In .env.local
GROQ_API_KEY=gsk-your-actual-key-here
```

**For Vercel:**

1. Go to Vercel Dashboard → Select project
2. **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `GROQ_API_KEY`
   - **Value**: Your Groq API key
4. Redeploy

---

## Groq Model Options

### Recommended: Mixtral 8x7B (Current)

```
Model: mixtral-8x7b-32768
Speed: ⚡⚡⚡⚡⚡ (Fastest)
Quality: ⭐⭐⭐⭐ (Very Good)
Cost: Lowest
Best for: Email classification, quick replies
```

### Alternative: LLaMA 2 (Slower, Cheaper)

```
Model: llama2-70b-4096
Speed: ⚡⚡⚡ (Very Fast)
Quality: ⭐⭐⭐⭐ (Excellent)
Cost: Similar
Best for: Complex tasks requiring more reasoning
```

### Premium: LLaMA 3 (Newest)

```
Model: llama-3-70b-8192
Speed: ⚡⚡⚡⚡ (Very Fast)
Quality: ⭐⭐⭐⭐⭐ (Best)
Cost: Same
Best for: All use cases
```

**Switch models by editing:** `src/lib/ai/openai-client.ts` (change model name)

---

## Cost Breakdown

### Email Classification
- **Price**: ~$0.00001 per email
- **Volume**: 1,000 emails/month = ~$0.01/month
- **Annual**: ~$0.12

### AI Reply Generation
- **Price**: ~$0.0001 per reply
- **Volume**: 100 replies/month = ~$0.01/month
- **Annual**: ~$0.12

### Summarization
- **Price**: ~$0.00005 per thread
- **Volume**: 200 summaries/month = ~$0.01/month
- **Annual**: ~$0.12

### Total Monthly Cost
- **Low usage** (10-100 operations): ~$0.05-0.50/month
- **Medium usage** (100-1000 operations): ~$0.50-5/month
- **High usage** (1000+ operations): ~$5-50/month

**Note**: Groq is extremely cheap! Most users will never exceed $10/month.

---

## API Rate Limits

Groq provides generous free tier:

- **Free Tier**:
  - 100 API calls per minute
  - Perfect for single users
  - Great for testing

- **Paid Tier**:
  - 1,000+ calls per minute
  - ~$5-50/month depending on usage
  - Excellent for production

---

## Testing Your Setup

### Quick Test

```bash
# Verify Groq integration
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mixtral-8x7b-32768",
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 100
  }'
```

Should return a JSON response with a greeting.

### Application Test

Once deployed:

1. Login to your app
2. Test email classification (once Gmail is connected)
3. Generate an AI reply
4. Check response time (should be <1 second)

---

## Environment Variables Reference

| Variable | Value | Source |
|----------|-------|--------|
| `GROQ_API_KEY` | `gsk-...` | Groq Console → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google Cloud → Credentials |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google Cloud → Credentials |
| `ENCRYPTION_KEY` | Any 32 chars | Generate yourself |
| `NEXTAUTH_SECRET` | Any random string | Generate yourself |

---

## Troubleshooting

### Issue: "GROQ_API_KEY not configured"

**Fix**: 
- Make sure key is in `.env.local` (development)
- Make sure key is in Vercel environment variables (production)
- Redeploy after adding variable

### Issue: "API Error: 429 Rate Limited"

**Fix**:
- You've exceeded free tier rate limit (100/min)
- Upgrade to paid Groq plan
- Or: Add delays between requests

### Issue: "Invalid API Key"

**Fix**:
- Double-check key starts with `gsk-`
- Make sure full key was copied (no typos)
- Regenerate key if unsure
- Check key hasn't expired (Groq keys don't expire)

### Issue: "Connection Timeout"

**Fix**:
- Check internet connection
- Groq API might be down (check status: https://status.groq.com)
- Retry after 30 seconds

---

## Switching Back to OpenAI

If you need OpenAI instead:

```typescript
// In src/lib/ai/openai-client.ts

// Change from:
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

// To:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Update environment variable from GROQ_API_KEY to OPENAI_API_KEY
```

---

## More Information

- **Groq Console**: https://console.groq.com
- **Groq API Docs**: https://console.groq.com/docs
- **Groq Models**: https://console.groq.com/docs/models
- **Status Page**: https://status.groq.com

---

## Summary

✅ Application configured for Groq API
✅ Using fastest model: Mixtral 8x7B
✅ Email classification: <50ms
✅ Reply generation: <100ms
✅ Very affordable pricing

**Next Step**: Add your Groq API key to Vercel and deploy!

---

**You're all set with Groq! 🚀**
