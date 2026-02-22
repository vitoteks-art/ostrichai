export interface KieCreateTaskResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

export interface KieRecordInfoResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
    state: 'pending' | 'processing' | 'success' | 'failed';
    resultJson?: string;
    failMsg?: string;
  };
}

export interface ParsedResult {
  resultUrls?: string[];
}

const BASE_URL = 'https://api.kie.ai/api/v1/jobs';

export const createTask = async (apiKey: string, imageUrl: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  // Reordering payload to match the user's working example exactly
  const payload = {
    input: {
      image: imageUrl.trim()
    },
    callBackUrl: "",
    model: "recraft/remove-background"
  };

  console.log("Kie.ai createTask payload:", JSON.stringify(payload, null, 2));
  console.log("ACTUAL URL BEING SENT:", payload.input.image);

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create task: ${response.status} ${errorBody}`);
  }

  const result: KieCreateTaskResponse = await response.json();
  if (result.code !== 200) {
    throw new Error(result.message || "Unknown error creating task");
  }

  return result.data.taskId;
};

export interface KieVideoTaskInput {
  image_url: string;
  audio_url: string;
  prompt: string;
  resolution?: string;
}

export const createVideoTask = async (apiKey: string, input: KieVideoTaskInput): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  const payload = {
    model: 'infinitalk/from-audio',
    callBackUrl: '', // Optional, can be left empty or set if needed
    input: {
      image_url: input.image_url,
      audio_url: input.audio_url,
      prompt: input.prompt,
      resolution: input.resolution || "480p"
    }
  };

  console.log("Kie.ai createVideoTask payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create video task: ${response.status} ${errorBody}`);
  }

  const result: KieCreateTaskResponse = await response.json();
  if (result.code !== 200) {
    throw new Error(result.message || "Unknown error creating video task");
  }

  return result.data.taskId;
};

export const getTaskInfo = async (apiKey: string, taskId: string): Promise<KieRecordInfoResponse> => {
  const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch task info: ${response.status}`);
  }

  const result: KieRecordInfoResponse = await response.json();
  return result;
};

export const parseResultJson = (jsonString?: string): string | null => {
  if (!jsonString) return null;
  try {
    const parsed: ParsedResult = JSON.parse(jsonString);
    if (parsed.resultUrls && parsed.resultUrls.length > 0) {
      return parsed.resultUrls[0];
    }
    return null;
  } catch (e) {
    console.error("Failed to parse result JSON", e);
    return null;
  }
};
