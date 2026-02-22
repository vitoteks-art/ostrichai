const WEBHOOK_URL = 'https://n8n.getostrichai.com/webhook/blog-gen';
const WEBHOOK_TIMEOUT_MS = 180000;

const parseWebhookResponse = async (response: Response) => {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse webhook JSON response:', error);
    return { rawText: text };
  }
};

export const callBlogWebhook = async (step: string, payload: Record<string, any>) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        step,
        source: 'blog-research',
        ...payload
      })
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook error ${response.status}: ${errorText || response.statusText}`);
  }

  return parseWebhookResponse(response);
};

export const generateBlogTitles = (payload: Record<string, any>) => {
  return callBlogWebhook('title', payload);
};

export const generateBlogSections = (payload: Record<string, any>) => {
  return callBlogWebhook('sections', payload);
};

export const generateBlogSeo = (payload: Record<string, any>) => {
  return callBlogWebhook('seo', payload);
};

export const generateBlogContent = (payload: Record<string, any>) => {
  return callBlogWebhook('content', payload);
};
