import { KieVeoGeneratePayload, KieVeoExtendPayload, VeoPollResult } from '../types/kieVeo';

const N8N_CREATE_WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/ugc';
const N8N_STATUS_WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/ugc-status';
const N8N_EXTEND_WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/extend-video';

// Helper to parse n8n response for Task ID
const parseTaskIdFromResponse = (result: any): string => {
  // Handle n8n array response format (e.g. [{ "code": 200, "data": { ... } }])
  if (Array.isArray(result) && result.length > 0) {
    result = result[0];
  }

  // 1. Check for nested data.taskId (Standard Kie format wrapped in n8n object)
  if (result.data && result.data.taskId) {
    return result.data.taskId;
  }

  // 2. Check for flat taskId
  if (result.taskId) {
    return result.taskId;
  }

  // 3. Fallback: check if the result itself is a string that looks like an ID
  if (typeof result === 'string' && result.startsWith('veo_task')) {
    return result;
  }

  throw new Error("Webhook response did not contain a valid taskId");
}

export const createVeoTask = async (
  apiKey: string,
  payload: KieVeoGeneratePayload
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  // Send payload to n8n webhook
  const response = await fetch(N8N_CREATE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...payload,
      enableTranslation: true,
      enableFallback: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit task to webhook: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return parseTaskIdFromResponse(result);
};

export const extendVeoVideo = async (
  apiKey: string,
  payload: KieVeoExtendPayload
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  const response = await fetch(N8N_EXTEND_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit extension task: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return parseTaskIdFromResponse(result);
};

export const getVeoResult = async (apiKey: string, taskId: string): Promise<VeoPollResult> => {
  try {
    // Send status check to n8n webhook
    const response = await fetch(N8N_STATUS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId })
    });

    if (!response.ok) {
      return { status: 'processing' }; // Keep polling on HTTP error
    }

    let result = await response.json();

    // Handle n8n array response format
    if (Array.isArray(result) && result.length > 0) {
      result = result[0];
    }

    // Try to parse metadata from paramJson if available
    let metadata: VeoPollResult['metadata'] = {};
    if (result.data?.paramJson) {
      try {
        const params = JSON.parse(result.data.paramJson);
        metadata = {
          prompt: params.prompt,
          model: params.model,
          aspectRatio: params.aspectRatio
        };
      } catch (e) {
        // Ignore parse errors
      }
    }

    // --- Result Extraction Logic ---

    // 1. Specific Webhook Structure: data.response.resultUrls[]
    if (result.data?.response?.resultUrls && Array.isArray(result.data.response.resultUrls) && result.data.response.resultUrls.length > 0) {
      return {
        status: 'completed',
        resultUrl: result.data.response.resultUrls[0],
        metadata
      };
    }

    // 2. Standard Kie nested format: { data: { resultUrl: "..." } }
    if (result.data && result.data.resultUrl) {
      return {
        status: 'completed',
        resultUrl: result.data.resultUrl,
        metadata
      };
    }

    // 3. Flat format: { resultUrl: "..." }
    if (result.resultUrl) {
      return {
        status: 'completed',
        resultUrl: result.resultUrl,
        metadata
      };
    }

    // 4. Check for failure flags
    if (result.data?.state === 'failed' || result.data?.failCode) {
      return {
        status: 'failed',
        error: result.data?.failMsg || 'Generation failed',
        metadata
      };
    }

  } catch (e) {
    console.error("Error fetching Veo result from webhook:", e);
  }

  return { status: 'processing' };
};
