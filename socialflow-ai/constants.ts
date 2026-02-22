
import { Platform } from "./types";
import { Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export const WEBHOOK_URL = "https://n8n.vitotek.com.ng/webhook/social-post-advance";

export const PLATFORMS: { id: Platform; name: string; icon: any; color: string }[] = [
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black text-white' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700 text-white' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600 text-white' },
];

export const STAGE_LABELS: Record<string, string> = {
  topic_input: "Topic",
  titles: "Select Title",
  content: "Edit Content",
  image_prompt: "Image Idea",
  image_generation: "Creating Visual",
  tags: "Hashtags",
  final: "Final Post"
};

export const STAGE_PROGRESS: Record<string, number> = {
  topic_input: 10,
  titles: 25,
  content: 40,
  image_prompt: 55,
  image_generation: 70,
  tags: 85,
  final: 100
};

// Image Generation Constants
export const IMAGE_MODELS = [
  { id: 'google/nano-banana', name: 'Base (Fast)', description: 'Efficient, text-driven generation' },
  { id: 'google/nano-banana-edit', name: 'Nexus (Balanced)', description: 'Balanced quality and speed' }, // Mapping both to flash-image as per available models, conceptually distinct tiers
  { id: 'nano-banana-pro', name: 'Titan (Premium)', description: 'High fidelity, supports up to 4K' },
];

export const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square (1:1)' },
  { id: '16:9', name: 'Landscape (16:9)' },
  { id: '9:16', name: 'Portrait (9:16)' },
  { id: '4:3', name: 'Standard (4:3)' },
  { id: '3:4', name: 'Vertical (3:4)' },
];

export const RESOLUTIONS = [
  { id: '1K', name: '1K (Standard)' },
  { id: '2K', name: '2K (High Res)' },
  { id: '4K', name: '4K (Ultra HD)' },
];

export const IMAGE_FORMATS = [
  { id: 'image/png', name: 'PNG' },
  { id: 'image/jpeg', name: 'JPEG' },
];
