# OpenRouter Model Management Guide

## Overview

SeekEngine uses OpenRouter's free models tier to power AI features without requiring paid API access. This guide explains how models work, their tiers, and how to update them.

---

## Model Tiers

Models are classified into 4 performance tiers:

### 🚀 Fast Tier (Small & Quick)
- **Size**: 1-30B parameters
- **Speed**: 100-500ms
- **Use**: Search suggestions, quick summaries
- **Examples**: Gemma 3N (2-4B), LLaMA 3.2 (3B), Nemotron Nano (9B)
- **Task Policy**: 3s max latency, 6s global timeout

### ⚡ Balanced Tier (Mid-Range)
- **Size**: 12-27B parameters  
- **Speed**: 300-1200ms
- **Use**: Main search results, detailed summaries
- **Examples**: Mistral Small (24B), Gemma 3 (12-27B)
- **Task Policy**: 5s max latency, 12s global timeout

### 💪 Heavy Tier (Large & Powerful)
- **Size**: 70B-405B parameters
- **Speed**: 2-8s+ per request
- **Use**: Complex reasoning, detailed analysis
- **Examples**: LLaMA 70B, Hermes 405B, GPT-OSS
- **Task Policy**: 6s max latency, 15s global timeout

### 🧠 Code Tier (Programming Specialists)
- **Size**: Varies (typically 20-100B)
- **Specialty**: Code generation, syntax understanding
- **Examples**: Qwen Coder
- **Use**: Planned for future code-related features

---

## Finding Available Free Models

### Step 1: Check OpenRouter
Visit one of these URLs:
- **All Models**: https://openrouter.ai/models
- **Free Models Only**: https://openrouter.ai/openrouter/free
- **Sort by Price**: https://openrouter.ai/models?sort=latest&max_price=0

### Step 2: Filter Criteria
Look for models with:
- ✅ **Pricing**: Prompt $0.00, Completion $0.00
- ✅ **Context**: 4K or higher (8K+ preferred)
- ✅ **Modality**: Text output support
- ✅ **Availability**: Currently operational (green status)

### Step 3: Identify Model ID
The model ID format is: `provider/model-name:free`
- Example: `google/gemma-3n-e4b-it:free`
- Example: `meta-llama/llama-3.3-70b-instruct:free`

---

## Updating Models in SeekEngine

### Location
File: `src/lib/openrouter/config.ts`  
Object: `STATIC_FALLBACK_MODELS`

### Process

1. **Add Model ID**
   ```typescript
   fast: [
     'google/gemma-3n-e4b-it:free',  // Existing model
     'new-provider/new-model:free',  // New model to add
   ]
   ```

2. **Add Comment**
   Use this format for consistency:
   ```typescript
   'model/id:free', // [Tier] Model Name — Brief description of strengths
   ```
   
   Example:
   ```typescript
   'google/gemma-3-4b-it:free',      // Gemma 3 4B — Higher quality than 3N, still very fast
   ```

3. **Validate**
   The system automatically validates at module load:
   ```
   ✓ Validated tier fast: 12 models
   ✓ All 25 fallback models validated
   ```

4. **Test**
   ```bash
   npm run build  # Verify TypeScript compilation
   ```

5. **Remove Broken Models**
   If a model fails:
   - Check the logs for `❌ Model connection failed`
   - Remove from `STATIC_FALLBACK_MODELS`
   - The system will auto-fetch from OpenRouter API as primary source

---

## Model Selection Algorithm

When processing a query, SeekEngine:

1. **Fetches Dynamic List** from OpenRouter API (preferred, always fresh)
2. **Falls Back to Static List** if API fails (your `STATIC_FALLBACK_MODELS`)
3. **Filters by Task** (SUGGESTIONS, ANSWER, CODE)
4. **Sorts by Health** (models with fewer failures first)
5. **Races Top Models** in batches (first to respond wins)
6. **Detects Failures** (track failures with timestamps)
7. **Recovers Smart** (waits 30s before retrying failed models)

Example for SUGGESTIONS task:
```
All Models → Filter [fast, balanced] → Remove failures → Race 2-3 models → First token wins
```

---

## Task-Based Model Selection

### Suggestions Task
```
Preferred Tiers: fast, balanced
Max Latency: 3s
Global Timeout: 6s
Tokens: 200
Temperature: 0.8 (creative)
Use: Search query completions
```

### Answer Task (Primary)
```
Preferred Tiers: fast, balanced, heavy
Max Latency: 5s
Global Timeout: 12s
Tokens: 800
Temperature: 0.35 (focused)
Use: Deep search analysis
```

### Code Task (Future)
```
Preferred Tiers: code, balanced
Max Latency: 6s
Global Timeout: 15s
Tokens: 1200
Temperature: 0.2 (precise)
Use: Code generation/analysis
```

---

## Failure Tracking & Recovery

### How It Works
- Each model tracks: `{ failures: number, lastFailedAt: timestamp }`
- Systemic failures detected if all models fail < 30s ago
- Recovery happens > 30s after most recent failure
- Failed models are marked and gradually retried

### Monitoring
Check logs for:
- ✅ `Model won race` — Model selected and working
- ⚠️  `Model connection failed` — Single model failed
- 🔴 `Systemic API failure detected` — API appears down

### Fallback Chain
```
Try Model A → Fails
Try Model B → Fails  
All models failed < 30s ago → Detect systemic issue
→ Return: "All AI models currently unavailable. API appears to be down."
→ Wait 30s before retrying (prevents thrashing)
```

---

## Performance Metrics

### Current Setup (25 Models)
- **Fast Tier**: 12 models (1.2B - 30B params)
- **Balanced Tier**: 4 models (12B - 27B params)
- **Heavy Tier**: 8 models (70B - 405B params)
- **Code Tier**: 1 model (20B params)

### Expected Response Times
- Suggestions: 300-1200ms (fast tier racing)
- Answers: 500-3000ms (balanced tier racing)
- Best Case: ~200ms (cached answer)
- Worst Case: ~15s (all models timeout)

---

## Adding a New Tier or Task

To add Code task support:

1. Update `TASK_POLICIES` in config.ts:
   ```typescript
   [AITaskEnum.CODE]: {
     temperature: 0.2,
     maxTokens: 1200,
     preferredTiers: ['code', 'balanced'],
     maxLatency: 6000,
     globalTimeout: 15000,
   }
   ```

2. Update route handler (e.g., `/api/ai/code`)

3. Test with code generation requests

---

## Troubleshooting

### "No models available"
- Check OpenRouter API status
- Verify STATIC_FALLBACK_MODELS is not empty
- Check console for validation errors

### "All models failing"
- OpenRouter API may be down
- Check https://status.openrouter.ai
- Wait 30+ seconds (auto-recovery)

### Slow responses
- Check `logTelemetry` output for latency
- Consider adding faster models to appropriate tier
- Check if heavy tier is being overused

### Model not being used
- Verify model ID format: `provider/model:free`
- Check tier classification (MODEL_TIER_PATTERNS)
- Verify task policy prefers that tier

---

## References

- **OpenRouter Models**: https://openrouter.ai/models
- **Free Models Guide**: https://openrouter.ai/openrouter/free
- **API Documentation**: https://openrouter.ai/docs/quick-start
- **Status Page**: https://status.openrouter.ai

---

## Maintenance Schedule

- **Weekly**: Monitor logs for `Model connection failed` patterns
- **Monthly**: Check OpenRouter for new free models
- **Quarterly**: Review performance metrics and adjust tier policies
- **As Needed**: Remove broken models, update to latest versions

---

## Contributing

To suggest a new model:
1. Verify it's free on OpenRouter
2. Identify the correct tier based on parameters
3. Open an issue or PR with the model ID and justification
4. Include expected latency and performance characteristics
