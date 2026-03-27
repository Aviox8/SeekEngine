/**
 * Tests for Model Management Utilities  
 * Tests model name humanization and tier classification
 */

import { describe, it, expect } from 'vitest'
import { humanizeModel, classifyModel } from '@/lib/openrouter/models'

describe('humanizeModel', () => {
  describe('Google models', () => {
    it('humanizes Gemma 3N models', () => {
      expect(humanizeModel('google/gemma-3n-e2b-it:free')).toBe('Gemma 3N 2B')
      expect(humanizeModel('google/gemma-3n-e4b-it:free')).toBe('Gemma 3N 4B')
      expect(humanizeModel('google/gemma-3n-it:free')).toBe('Gemma 3N')
    })

    it('humanizes Gemma 3 models', () => {
      expect(humanizeModel('google/gemma-3-27b-it:free')).toBe('Gemma 3 27B')
      expect(humanizeModel('google/gemma-3-12b-it:free')).toBe('Gemma 3 12B')
      expect(humanizeModel('google/gemma-3-4b-it:free')).toBe('Gemma 3 4B')
    })

    it('humanizes Gemini', () => {
      expect(humanizeModel('google/gemini-2.0-flash:free')).toContain('Gemini')
    })
  })

  describe('Meta models', () => {
    it('humanizes LLaMA 3.3', () => {
      expect(humanizeModel('meta-llama/llama-3.3-70b-instruct:free')).toBe('LLaMA 3.3 70B')
    })

    it('humanizes LLaMA 3.2', () => {
      expect(humanizeModel('meta-llama/llama-3.2-3b-instruct:free')).toBe('LLaMA 3.2 3B')
    })

    it('humanizes LLaMA 3.1', () => {
      expect(humanizeModel('meta-llama/llama-3.1-405b-instruct:free')).toBe('LLaMA 3.1 405B')
    })

    it('falls back to generic LLaMA for unknown versions', () => {
      expect(humanizeModel('meta-llama/llama-2-70b:free')).toContain('LLaMA')
    })
  })

  describe('Mistral models', () => {
    it('humanizes Dolphin Mistral', () => {
      expect(humanizeModel('cognitivecomputations/dolphin-mistral-24b-venice-edition:free')).toBe('Dolphin Mistral')
    })

    it('humanizes Mistral Small', () => {
      expect(humanizeModel('mistralai/mistral-small-3.1-24b-instruct:free')).toBe('Mistral Small')
    })
  })

  describe('Qwen models', () => {
    it('humanizes Qwen3 Coder', () => {
      expect(humanizeModel('qwen/qwen3-coder:free')).toBe('Qwen3 Coder')
    })

    it('humanizes Qwen3 Next 80B', () => {
      expect(humanizeModel('qwen/qwen3-next-80b-a3b-instruct:free')).toBe('Qwen3 Next 80B')
    })

    it('humanizes Qwen3 4B', () => {
      expect(humanizeModel('qwen/qwen3-4b:free')).toBe('Qwen3 4B')
    })
  })

  describe('DeepSeek models', () => {
    it('humanizes DeepSeek R1', () => {
      expect(humanizeModel('deepseek/deepseek-r1:free')).toBe('DeepSeek R1')
    })

    it('humanizes DeepSeek Chat', () => {
      expect(humanizeModel('deepseek/deepseek-chat:free')).toBe('DeepSeek Chat')
    })
  })

  describe('Fallback behavior', () => {
    it('extracts model name from provider/model format', () => {
      const result = humanizeModel('provider/model-name-test:free')
      expect(result).toContain('model')
    })

    it('returns original for unknown models', () => {
      const unknownModel = 'unknown/model/format'
      expect(humanizeModel(unknownModel)).toBe(unknownModel)
    })

    it('handles empty string', () => {
      expect(humanizeModel('')).toBe('Unknown Model')
    })
  })

  describe('Specificity order', () => {
    it('prioritizes specific versions over generic names', () => {
      // LLaMA 3.3 should match before generic LLaMA
      expect(humanizeModel('meta-llama/llama-3.3-70b:free')).toBe('LLaMA 3.3 70B')
      expect(humanizeModel('meta-llama/llama-2-7b:free')).toContain('LLaMA')
    })
  })
})

describe('classifyModel', () => {
  describe('Fast tier models', () => {
    it('classifies Gemini Flash as fast', () => {
      expect(classifyModel('google/gemini-2-flash:free')).toBe('fast')
    })

    it('classifies Gemma 3N as fast', () => {
      expect(classifyModel('google/gemma-3n-e4b:free')).toBe('fast')
    })

    it('classifies small models as fast', () => {
      expect(classifyModel('meta-llama/llama-3.2-3b:free')).toBe('fast')
      expect(classifyModel('qwen/qwen3-4b:free')).toBe('fast')
    })
  })

  describe('Balanced tier models', () => {
    it('classifies Mistral Small as balanced', () => {
      expect(classifyModel('mistralai/mistral-small:free')).toBe('balanced')
    })

    it('classifies DeepSeek Chat as balanced', () => {
      expect(classifyModel('deepseek/deepseek-chat:free')).toBe('balanced')
    })

    it('classifies medium models as balanced', () => {
      expect(classifyModel('google/gemma-3-12b:free')).toBe('balanced')
    })
  })

  describe('Heavy tier models', () => {
    it('classifies LLaMA 70B as heavy', () => {
      expect(classifyModel('meta-llama/llama-3.3-70b:free')).toBe('heavy')
    })

    it('classifies 80B+ models as heavy', () => {
      expect(classifyModel('qwen/qwen3-next-80b:free')).toBe('heavy')
    })

    it('classifies 405B models as heavy', () => {
      expect(classifyModel('meta-llama/llama-3.1-405b:free')).toBe('heavy')
    })

    it('classifies thinking models as heavy', () => {
      expect(classifyModel('model-with-thinking:free')).toBe('heavy')
    })
  })

  describe('Code tier models', () => {
    it('classifies Qwen3 Coder as code', () => {
      expect(classifyModel('qwen/qwen3-coder:free')).toBe('code')
    })

    it('classifies Devstral as code', () => {
      expect(classifyModel('mistralai/devstral:free')).toBe('code')
    })

    it('classifies DeepSeek Code as code', () => {
      expect(classifyModel('deepseek/deepseek-coder:free')).toBe('code')
    })

    it('classifies CodeLlama as code', () => {
      expect(classifyModel('meta-llama/codellama-34b:free')).toBe('code')
    })
  })

  describe('Fallback', () => {
    it('defaults to balanced for unknown models', () => {
      expect(classifyModel('unknown/model:free')).toBe('balanced')
    })

    it('removes :free suffix before classifying', () => {
      const withSuffix = classifyModel('google/gemini-flash:free')
      const withoutSuffix = classifyModel('google/gemini-flash')
      expect(withSuffix).toBe(withoutSuffix)
    })

    it('is case-insensitive', () => {
      expect(classifyModel('MISTRALAI/MISTRAL-SMALL:FREE')).toBe('balanced')
    })
  })
})
