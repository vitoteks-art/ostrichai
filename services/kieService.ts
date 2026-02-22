import { KieCreateTaskResponse, KieRecordInfoResponse, ParsedResult } from '../types';

const BASE_URL = 'https://api.kie.ai/api/v1/jobs';

export const createTask = async (apiKey: string, imageUrl: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is required");

  const response = await fetch(`${BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "recraft/remove-background",
      // Optional callback, not strictly needed for polling
      callBackUrl: "", 
      input: {
        image: imageUrl
      }
    })
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

export const getTaskInfo = async (apiKey: string, taskId: string): Promise<KieRecordInfoResponse> => {
  const response = await fetch(`${BASE_URL}/recordInfo?taskId=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
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
