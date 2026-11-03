

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const EMBEDDING_DIMENSIONS = 768;

const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

const BATCH_SIZE = 50;

function mockEmbedding(text) {
  const vec = new Array(EMBEDDING_DIMENSIONS).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % EMBEDDING_DIMENSIONS;
    vec[idx] += text.charCodeAt(i) / 1000;
  }

  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}

export async function embedText(text, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!GEMINI_API_KEY) {
    return {
      embedding: mockEmbedding(text),
      model: 'mock',
      isMock: true,
    };
  }

  const payload = {
    model: `models/${GEMINI_EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
  };

  let response;
  try {
    response = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[embeddingService] Network error, falling back to mock:', err.message);
    return { embedding: mockEmbedding(text), model: 'mock', isMock: true };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`[embeddingService] Gemini API error ${response.status}: ${body}. Falling back to mock.`);
    return { embedding: mockEmbedding(text), model: 'mock', isMock: true };
  }

  const data = await response.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values) || values.length === 0) {
    console.warn('[embeddingService] Unexpected response shape, falling back to mock.');
    return { embedding: mockEmbedding(text), model: 'mock', isMock: true };
  }

  return {
    embedding: values,
    model: GEMINI_EMBEDDING_MODEL,
    isMock: false,
  };
}

export async function embedBatch(texts, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!texts || texts.length === 0) return [];

  if (!GEMINI_API_KEY) {
    return texts.map((t) => ({ embedding: mockEmbedding(t), model: 'mock', isMock: true }));
  }

  const batchUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;
  const results = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const slice = texts.slice(i, i + BATCH_SIZE);

    const payload = {
      requests: slice.map((text) => ({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
      })),
    };

    let response;
    try {
      response = await fetch(batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`[embeddingService] Batch network error (batch ${i}/${texts.length}), using mock:`, err.message);
      results.push(...slice.map((t) => ({ embedding: mockEmbedding(t), model: 'mock', isMock: true })));
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[embeddingService] Batch API error ${response.status}: ${body}. Using mock for this batch.`);
      results.push(...slice.map((t) => ({ embedding: mockEmbedding(t), model: 'mock', isMock: true })));
      continue;
    }

    const data = await response.json();
    const embeddings = data?.embeddings || [];

    for (let j = 0; j < slice.length; j++) {
      const values = embeddings[j]?.values;
      if (Array.isArray(values) && values.length > 0) {
        results.push({ embedding: values, model: GEMINI_EMBEDDING_MODEL, isMock: false });
      } else {
        results.push({ embedding: mockEmbedding(slice[j]), model: 'mock', isMock: true });
      }
    }
  }

  return results;
}

export async function embedQuery(query) {
  return embedText(query, 'RETRIEVAL_QUERY');
}
