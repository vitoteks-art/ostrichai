
import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { FeatureGate } from "@/components/FeatureGate";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Scissors,
  Upload,
  ArrowUp,
  ArrowDown,
  Clock,
  Film,
  ShieldCheck,
  Trash2,
  MousePointer2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Undo2,
  Redo2,
  Plus,
} from "lucide-react";

type Segment = {
  id: string;
  start: string;
  end: string;
};

type LibraryClip = {
  id: string;
  file: File;
  url: string;
  duration: number;
  thumbnail: string | null;
};

type TimelineClip = {
  id: string;
  file: File;
  url: string;
  duration: number;
  offset: number;
  start: number;
  end: number;
};

type DragState = {
  id: string;
  mode: "move" | "trim-start" | "trim-end";
  startX: number;
  baseOffset: number;
  baseStart: number;
  baseEnd: number;
};

type TimelineSnapshot = {
  clips: TimelineClip[];
  selectedClipId: string | null;
  playhead: number;
};

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

const MIN_CLIP_LENGTH = 0.1;
const SNAP_THRESHOLD = 0.15;

const VideoEditor = () => {
  const [trimFile, setTrimFile] = useState<File | null>(null);
  const [trimPreviewUrl, setTrimPreviewUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([
    { id: makeId(), start: "0", end: "" },
  ]);
  const [trimBusy, setTrimBusy] = useState(false);
  const [trimError, setTrimError] = useState<string | null>(null);
  const [trimResultUrl, setTrimResultUrl] = useState<string | null>(null);

  const [libraryClips, setLibraryClips] = useState<LibraryClip[]>([]);
  const [libraryPreviewId, setLibraryPreviewId] = useState<string | null>(null);
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [timelineBusy, setTimelineBusy] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineResultUrl, setTimelineResultUrl] = useState<string | null>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(80);
  const [precisionMode, setPrecisionMode] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<"select" | "cut">("select");
  const [activePanel, setActivePanel] = useState<"media" | "audio" | "text">("media");
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [previewAspect, setPreviewAspect] = useState(16 / 9);
  const [leftWidth, setLeftWidth] = useState(340);
  const [rightWidth, setRightWidth] = useState(220);
  const [resizing, setResizing] = useState<"left" | "right" | null>(null);
  const [history, setHistory] = useState<TimelineSnapshot[]>([]);
  const [future, setFuture] = useState<TimelineSnapshot[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragStartSnapshotRef = useRef<TimelineSnapshot | null>(null);
  const libraryClipsRef = useRef<LibraryClip[]>([]);
  const timelineClipsRef = useRef<TimelineClip[]>([]);
  const selectedClipIdRef = useRef<string | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const suppressNativeSyncRef = useRef(false);
  const isSwitchingSourceRef = useRef(false);
  const boundaryAdvanceLockRef = useRef(false);
  const playheadFromPreviewRef = useRef(false);
  const isSwitchingClipRef = useRef(false);
  const playheadRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!trimFile) {
      setTrimPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(trimFile);
    setTrimPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [trimFile]);

  useEffect(() => {
    if (!trimResultUrl) {
      return;
    }
    return () => URL.revokeObjectURL(trimResultUrl);
  }, [trimResultUrl]);

  useEffect(() => {
    if (!timelineResultUrl) {
      return;
    }
    return () => URL.revokeObjectURL(timelineResultUrl);
  }, [timelineResultUrl]);

  useEffect(() => {
    libraryClipsRef.current = libraryClips;
  }, [libraryClips]);

  useEffect(() => {
    return () => {
      libraryClipsRef.current.forEach((clip) => URL.revokeObjectURL(clip.url));
    };
  }, []);

  useEffect(() => {
    timelineClipsRef.current = timelineClips;
  }, [timelineClips]);

  useEffect(() => {
    selectedClipIdRef.current = selectedClipId;
  }, [selectedClipId]);

  useEffect(() => {
    if (selectedClipId) {
      setLibraryPreviewId(null);
    }
  }, [selectedClipId]);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    if (!resizing) {
      return;
    }
    const onMove = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      if (resizing === "left") {
        const next = Math.min(320, Math.max(120, event.clientX - rect.left));
        setLeftWidth(next);
      } else {
        const next = Math.min(320, Math.max(120, rect.right - event.clientX));
        setRightWidth(next);
      }
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const apiBase = useMemo(() => API_BASE_URL.replace(/\/$/, ""), []);
  const updateSegment = (id: string, key: "start" | "end", value: string) => {
    setSegments((current) =>
      current.map((segment) =>
        segment.id === id ? { ...segment, [key]: value } : segment
      )
    );
  };

  const addSegment = () => {
    const last = segments[segments.length - 1];
    const nextStart = last?.end && Number.isFinite(Number(last.end)) ? last.end : "";
    setSegments((current) => [
      ...current,
      { id: makeId(), start: nextStart || "", end: "" },
    ]);
  };

  const removeSegment = (id: string) => {
    setSegments((current) => current.filter((segment) => segment.id !== id));
  };

  const setFromPlayer = (id: string, key: "start" | "end") => {
    if (!videoRef.current) {
      return;
    }
    const time = videoRef.current.currentTime;
    updateSegment(id, key, time.toFixed(2));
  };

  const parseSegments = () => {
    const parsed = segments
      .map((segment) => ({
        start: Number(segment.start),
        end: Number(segment.end),
      }))
      .filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end))
      .filter((segment) => segment.start >= 0 && segment.end > segment.start);

    if (parsed.length === 0) {
      throw new Error("Add at least one valid segment (end must be greater than start).");
    }
    return parsed;
  };

  const readErrorDetail = async (response: Response) => {
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") {
        return data.detail;
      }
      return JSON.stringify(data);
    } catch {
      return `Request failed with status ${response.status}.`;
    }
  };

  const cloneClips = (clips: TimelineClip[]) => clips.map((clip) => ({ ...clip }));

  const makeSnapshot = (clips: TimelineClip[], selectedId: string | null, head: number) => ({
    clips: cloneClips(clips),
    selectedClipId: selectedId,
    playhead: head,
  });

  const pushHistoryFromCurrent = () => {
    setHistory((current) => [
      ...current,
      makeSnapshot(timelineClipsRef.current, selectedClipIdRef.current, playheadRef.current),
    ]);
    setFuture([]);
  };

  const applySnapshot = (snapshot: TimelineSnapshot) => {
    setTimelineClips(snapshot.clips);
    setSelectedClipId(snapshot.selectedClipId);
    setPlayhead(snapshot.playhead);
  };

  const handleUndo = () => {
    setHistory((current) => {
      if (current.length === 0) {
        return current;
      }
      const snapshot = current[current.length - 1];
      setFuture((futureState) => [
        makeSnapshot(timelineClipsRef.current, selectedClipIdRef.current, playheadRef.current),
        ...futureState,
      ]);
      applySnapshot(snapshot);
      return current.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setFuture((current) => {
      if (current.length === 0) {
        return current;
      }
      const snapshot = current[0];
      setHistory((historyState) => [
        ...historyState,
        makeSnapshot(timelineClipsRef.current, selectedClipIdRef.current, playheadRef.current),
      ]);
      applySnapshot(snapshot);
      return current.slice(1);
    });
  };

  const handleTrim = async () => {
    setTrimError(null);
    setTrimResultUrl(null);
    if (!trimFile) {
      setTrimError("Select a video file to trim.");
      return;
    }

    let parsedSegments;
    try {
      parsedSegments = parseSegments();
    } catch (error: any) {
      setTrimError(error.message || "Invalid segments.");
      return;
    }

    const formData = new FormData();
    formData.append("file", trimFile);
    formData.append("keep_json", JSON.stringify(parsedSegments));

    setTrimBusy(true);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/video/trim`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        setTrimError(detail);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTrimResultUrl(url);
    } catch (error: any) {
      setTrimError(error.message || "Trim request failed.");
    } finally {
      setTrimBusy(false);
    }
  };

  const loadDuration = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.onloadedmetadata = () => {
        resolve(tempVideo.duration || 0);
        URL.revokeObjectURL(tempVideo.src);
      };
      tempVideo.onerror = () => reject(new Error("Failed to load video metadata"));
      tempVideo.src = URL.createObjectURL(file);
    });

  const generateThumbnail = (file: File) =>
    new Promise<string | null>((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const cleanup = (url: string) => {
        URL.revokeObjectURL(url);
        video.removeAttribute("src");
        video.load();
      };
      const url = URL.createObjectURL(file);
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        const target = Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(0.1, video.duration / 2)
          : 0;
        video.currentTime = target;
      };
      video.onseeked = () => {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup(url);
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        cleanup(url);
        resolve(dataUrl);
      };
      video.onerror = () => {
        cleanup(url);
        resolve(null);
      };
      video.src = url;
    });

  const getTimelineLength = (clips: TimelineClip[]) => {
    if (clips.length === 0) {
      return 10;
    }
    return Math.max(
      10,
      ...clips.map((clip) => clip.offset + (clip.end - clip.start)),
    );
  };

  const getTimelineEnd = (clips: TimelineClip[]) => {
    if (clips.length === 0) {
      return 0;
    }
    return Math.max(...clips.map((clip) => clip.offset + (clip.end - clip.start)));
  };

  const handleImportFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }
    try {
      const clipData = await Promise.all(
        files.map(async (file) => {
          const duration = await loadDuration(file);
          const thumbnail = await generateThumbnail(file);
          const url = URL.createObjectURL(file);
          return {
            id: makeId(),
            file,
            url,
            duration,
            thumbnail,
          };
        })
      );
      setLibraryClips((current) => [...current, ...clipData]);
    } catch (error: any) {
      setTimelineError(error.message || "Failed to import clips.");
    }
  };

  const addClipToTimeline = (clip: LibraryClip) => {
    const offset = getTimelineEnd(timelineClipsRef.current);
    const timelineClip: TimelineClip = {
      id: makeId(),
      file: clip.file,
      url: clip.url,
      duration: clip.duration,
      offset,
      start: 0,
      end: clip.duration,
    };
    pushHistoryFromCurrent();
    setTimelineClips((current) => [...current, timelineClip]);
    if (!selectedClipIdRef.current) {
      setSelectedClipId(timelineClip.id);
      setLibraryPreviewId(null);
    }
  };

  const updateClipWithHistory = (id: string, changes: Partial<TimelineClip>) => {
    pushHistoryFromCurrent();
    setTimelineClips((current) => {
      const next = current.map((clip) => (clip.id === id ? { ...clip, ...changes } : clip));
      return next;
    });
    setTimeout(() => clampPlayheadToSelection(), 0);
  };

  const removeClip = (id: string) => {
    pushHistoryFromCurrent();
    const nextClips = timelineClipsRef.current.filter((item) => item.id !== id);
    const nextSelected = selectedClipIdRef.current === id ? nextClips[0]?.id || null : selectedClipIdRef.current;
    setTimelineClips(nextClips);
    setSelectedClipId(nextSelected);
    setTimeout(() => {
      if (nextSelected) {
        const clip = nextClips.find((item) => item.id === nextSelected);
        if (clip && previewRef.current) {
          previewRef.current.currentTime = clip.start;
        }
      }
      syncPreviewToPlayhead(playheadRef.current);
    }, 0);
  };

  const moveClipOrder = (index: number, direction: number) => {
    pushHistoryFromCurrent();
    setTimelineClips((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const updated = [...current];
      const [item] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, item);
      let cursor = 0;
      return updated.map((clip) => {
        const length = clip.end - clip.start;
        const next = { ...clip, offset: cursor };
        cursor += length;
        return next;
      });
    });
  };

  const onPointerMove = (event: PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) {
      return;
    }
    const head = playheadRef.current;
    const deltaSeconds = (event.clientX - drag.startX) / pixelsPerSecond;
    setTimelineClips((current) =>
      current.map((clip) => {
        if (clip.id !== drag.id) {
          return clip;
        }
        if (drag.mode === "move") {
          let nextOffset = Math.max(0, drag.baseOffset + deltaSeconds);
          if (Math.abs(nextOffset - head) <= SNAP_THRESHOLD) {
            nextOffset = head;
          }
          return { ...clip, offset: nextOffset };
        }
        if (drag.mode === "trim-start") {
          let nextStart = Math.min(
            Math.max(0, drag.baseStart + deltaSeconds),
            drag.baseEnd - MIN_CLIP_LENGTH,
          );
          if (Math.abs(clip.offset + nextStart - head) <= SNAP_THRESHOLD) {
            nextStart = Math.min(Math.max(0, head - clip.offset), drag.baseEnd - MIN_CLIP_LENGTH);
          }
          return { ...clip, start: nextStart };
        }
        let nextEnd = Math.max(
          drag.baseStart + MIN_CLIP_LENGTH,
          Math.min(clip.duration, drag.baseEnd + deltaSeconds),
        );
        if (Math.abs(clip.offset + nextEnd - head) <= SNAP_THRESHOLD) {
          nextEnd = Math.max(drag.baseStart + MIN_CLIP_LENGTH, Math.min(clip.duration, head - clip.offset));
        }
        return { ...clip, end: nextEnd };
      }),
    );
  };

  const onPointerUp = () => {
    if (dragStartSnapshotRef.current) {
      setHistory((current) => [...current, dragStartSnapshotRef.current as TimelineSnapshot]);
      setFuture([]);
      dragStartSnapshotRef.current = null;
    }
    dragStateRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  const startDrag = (event: React.PointerEvent, clip: TimelineClip, mode: DragState["mode"]) => {
    event.stopPropagation();
    if (!dragStartSnapshotRef.current) {
      dragStartSnapshotRef.current = makeSnapshot(
        timelineClipsRef.current,
        selectedClipIdRef.current,
        playheadRef.current,
      );
    }
    dragStateRef.current = {
      id: clip.id,
      mode,
      startX: event.clientX,
      baseOffset: clip.offset,
      baseStart: clip.start,
      baseEnd: clip.end,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const getClipAtPlayhead = (head: number, clips: TimelineClip[]) =>
    clips.find((clip) => head >= clip.offset && head <= clip.offset + (clip.end - clip.start));

  const getOrderedClips = (clips: TimelineClip[]) => [...clips].sort((a, b) => a.offset - b.offset);
  const getClipAtOrAfterPlayhead = (head: number, clips: TimelineClip[]) => {
    const ordered = getOrderedClips(clips);
    const current = ordered.find((clip) => head >= clip.offset && head <= clip.offset + (clip.end - clip.start));
    if (current) {
      return current;
    }
    return ordered.find((clip) => clip.offset > head) || ordered[0] || null;
  };

  const advanceToNextClip = (currentId: string | null) => {
    const ordered = getOrderedClips(timelineClipsRef.current);
    if (ordered.length === 0) {
      setIsPlaying(false);
      return null;
    }
    const head = playheadRef.current;
    const currentClip =
      (currentId ? ordered.find((clip) => clip.id === currentId) : null) ||
      getClipAtPlayhead(head, ordered);
    if (!currentClip) {
      setIsPlaying(false);
      return null;
    }
    const currentIndex = ordered.findIndex((clip) => clip.id === currentClip.id);
    const nextClip = currentIndex >= 0 ? ordered[currentIndex + 1] : null;
    if (!nextClip) {
      setIsPlaying(false);
      return null;
    }
    isSwitchingClipRef.current = true;
    pendingSeekRef.current = nextClip.start;
    setSelectedClipId(nextClip.id);
    setPlayhead(nextClip.offset);
    return nextClip;
  };

  const handlePlayToggle = () => {
    if (!isPlaying && timelineClipsRef.current.length > 0) {
      boundaryAdvanceLockRef.current = false;
      const head = playheadRef.current;
      const ordered = getOrderedClips(timelineClipsRef.current);
      const clip = getClipAtOrAfterPlayhead(head, ordered);
      if (clip) {
        const clipLength = clip.end - clip.start;
        const headInClip = head >= clip.offset && head <= clip.offset + clipLength;
        const atClipEnd = headInClip && head >= clip.offset + clipLength - 0.02;
        if (atClipEnd) {
          const currentIndex = ordered.findIndex((item) => item.id === clip.id);
          const nextClip = currentIndex >= 0 ? ordered[currentIndex + 1] : null;
          if (nextClip) {
            pendingSeekRef.current = nextClip.start;
            setSelectedClipId(nextClip.id);
            setPlayhead(nextClip.offset);
          } else {
            pendingSeekRef.current = clip.start;
            setSelectedClipId(clip.id);
            setPlayhead(clip.offset);
          }
        } else {
          const local = head >= clip.offset ? Math.min(clipLength, Math.max(0, head - clip.offset)) : 0;
          pendingSeekRef.current = clip.start + local;
          setSelectedClipId(clip.id);
          setPlayhead(head >= clip.offset ? head : clip.offset);
        }
      }
    }
    setIsPlaying((current) => !current);
  };

  const syncPreviewToPlayhead = (head: number) => {
    if (isSwitchingClipRef.current) {
      return;
    }
    const clip = getClipAtPlayhead(head, timelineClipsRef.current);
    if (!clip || !previewRef.current) {
      return;
    }
    if (selectedClipIdRef.current !== clip.id) {
      playheadRef.current = head;
      setSelectedClipId(clip.id);
    }
    const timeInClip = clip.start + (head - clip.offset);
    const clamped = Math.min(Math.max(timeInClip, clip.start), clip.end);
    previewRef.current.currentTime = clamped;
  };

  const clampPlayheadToSelection = () => {
    const clip = selectedClipIdRef.current
      ? timelineClipsRef.current.find((item) => item.id === selectedClipIdRef.current)
      : null;
    if (!clip) {
      return;
    }
    const clipStart = clip.offset;
    const clipEnd = clip.offset + (clip.end - clip.start);
    const nextHead = Math.min(Math.max(playheadRef.current, clipStart), clipEnd);
    if (nextHead !== playheadRef.current) {
      setPlayhead(nextHead);
      syncPreviewToPlayhead(nextHead);
    }
  };

  const setPlayheadFromEvent = (event: React.MouseEvent) => {
    if (!timelineRef.current) {
      return;
    }
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.parentElement?.scrollLeft ?? 0;
    const x = event.clientX - rect.left + scrollLeft;
    const nextHead = Math.min(timelineLength, Math.max(0, x / pixelsPerSecond));
    setPlayhead(nextHead);
    if (tool === "cut") {
      splitClipAtPlayhead(nextHead);
    } else {
      syncPreviewToPlayhead(nextHead);
    }
  };

  const nudgePlayhead = (delta: number) => {
    setPlayhead((current) => {
      const next = Math.min(timelineLength, Math.max(0, current + delta));
      syncPreviewToPlayhead(next);
      return next;
    });
  };

  const setClipIn = () => {
    if (!selectedClipIdRef.current) {
      return;
    }
    const clip = timelineClipsRef.current.find((item) => item.id === selectedClipIdRef.current);
    if (!clip) {
      return;
    }
    const localTime = clip.start + (playhead - clip.offset);
    const nextStart = Math.min(Math.max(0, localTime), clip.end - MIN_CLIP_LENGTH);
    updateClipWithHistory(clip.id, { start: nextStart });
    clampPlayheadToSelection();
  };

  const setClipOut = () => {
    if (!selectedClipIdRef.current) {
      return;
    }
    const clip = timelineClipsRef.current.find((item) => item.id === selectedClipIdRef.current);
    if (!clip) {
      return;
    }
    const localTime = clip.start + (playhead - clip.offset);
    const nextEnd = Math.max(clip.start + MIN_CLIP_LENGTH, Math.min(clip.duration, localTime));
    updateClipWithHistory(clip.id, { end: nextEnd });
    clampPlayheadToSelection();
  };

  const splitClipAtPlayhead = (head = playheadRef.current) => {
    const clip = getClipAtPlayhead(head, timelineClipsRef.current);
    if (!clip) {
      setTimelineError("Place the playhead over a clip to split.");
      return;
    }
    const time = clip.start + (head - clip.offset);
    if (time <= clip.start + MIN_CLIP_LENGTH || time >= clip.end - MIN_CLIP_LENGTH) {
      setTimelineError("Move the playhead within the clip to split.");
      return;
    }
    const firstClip = { ...clip, end: time };
    const secondClip: TimelineClip = {
      ...clip,
      id: makeId(),
      start: time,
      end: clip.end,
      offset: clip.offset + (time - clip.start),
    };
    pushHistoryFromCurrent();
    setTimelineClips((current) => {
      const next = current.map((item) => (item.id === clip.id ? firstClip : item));
      const insertIndex = next.findIndex((item) => item.id === clip.id);
      next.splice(insertIndex + 1, 0, secondClip);
      return next;
    });
    setSelectedClipId(secondClip.id);
    setPlayhead(head);
    syncPreviewToPlayhead(head);
  };

  const requestTrimSegment = async (file: File, start: number, end: number, reencode: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("keep_json", JSON.stringify([{ start, end }]));

    const headers: Record<string, string> = {};
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${apiBase}/video/trim?reencode=${reencode ? "1" : "0"}`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      throw new Error(detail);
    }

    return await response.blob();
  };

  const handleTimelineExport = async () => {
    setTimelineError(null);
    setTimelineResultUrl(null);
    if (timelineClips.length < 2) {
      setTimelineError("Add at least two clips to export.");
      return;
    }
    setTimelineBusy(true);
    try {
      const ordered = [...timelineClips].sort((a, b) => a.offset - b.offset);
      const preparedFiles: File[] = [];
      for (const clip of ordered) {
        const needsTrim =
          precisionMode ||
          clip.start > 0.01 ||
          clip.end < clip.duration - 0.01;
        if (!needsTrim) {
          preparedFiles.push(clip.file);
          continue;
        }
        const trimmedBlob = await requestTrimSegment(clip.file, clip.start, clip.end, precisionMode);
        const trimmedFile = new File([trimmedBlob], `trim-${clip.file.name}`, {
          type: precisionMode ? "video/mp4" : clip.file.type || "video/mp4",
        });
        preparedFiles.push(trimmedFile);
      }

      const formData = new FormData();
      preparedFiles.forEach((file) => formData.append("files", file));

      const headers: Record<string, string> = {};
      const token = localStorage.getItem("auth_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/video/concat`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        setTimelineError(detail);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTimelineResultUrl(url);
    } catch (error: any) {
      setTimelineError(error.message || "Timeline export failed.");
    } finally {
      setTimelineBusy(false);
    }
  };

  const timelineLength = useMemo(() => getTimelineLength(timelineClips), [timelineClips]);
  const timelineWidth = timelineLength * pixelsPerSecond;
  const tickStep = pixelsPerSecond < 60 ? 5 : pixelsPerSecond < 110 ? 2 : 1;
  const tickCount = Math.ceil(timelineLength / tickStep);

  useEffect(() => {
    if (playhead > timelineLength) {
      setPlayhead(timelineLength);
      setIsPlaying(false);
    }
    if (playheadFromPreviewRef.current) {
      playheadFromPreviewRef.current = false;
      return;
    }
    if (isSwitchingClipRef.current) {
      return;
    }
    syncPreviewToPlayhead(playhead);
  }, [playhead, timelineLength, isPlaying]);

  const selectedClip = useMemo(
    () => timelineClips.find((clip) => clip.id === selectedClipId) || null,
    [timelineClips, selectedClipId],
  );

  const libraryPreviewClip = libraryClips.find((clip) => clip.id === libraryPreviewId) || null;
  const previewSource = selectedClip?.url || libraryPreviewClip?.url || timelineClips[0]?.url || libraryClips[0]?.url || "";

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) {
      return;
    }
    isSwitchingSourceRef.current = true;
    if (isPlaying) {
      suppressNativeSyncRef.current = true;
      const playPromise = preview.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
      setTimeout(() => {
        suppressNativeSyncRef.current = false;
      }, 0);
    } else {
      suppressNativeSyncRef.current = true;
      preview.pause();
      setTimeout(() => {
        suppressNativeSyncRef.current = false;
      }, 0);
    }
  }, [isPlaying, previewSource]);

  useEffect(() => {
    if (!selectedClip || !previewRef.current) {
      return;
    }
    const pendingSeek = pendingSeekRef.current;

    const clipStartHead = selectedClip.offset;
    const clipEndHead = selectedClip.offset + (selectedClip.end - selectedClip.start);
    const head = playheadRef.current;

    if (pendingSeek !== null) {
      setPlayhead(selectedClip.offset + (pendingSeek - selectedClip.start));
      if (previewRef.current.readyState >= 1) {
        previewRef.current.currentTime = pendingSeek;
        if (isPlaying) {
          suppressNativeSyncRef.current = true;
          setTimeout(() => {
            suppressNativeSyncRef.current = false;
          }, 0);
        }
        pendingSeekRef.current = null;
        boundaryAdvanceLockRef.current = false;
        isSwitchingClipRef.current = false;
      }
      return;
    }
    if (head >= clipStartHead && head <= clipEndHead) {
      const timeInClip = selectedClip.start + (head - clipStartHead);
      previewRef.current.currentTime = Math.min(Math.max(timeInClip, selectedClip.start), selectedClip.end);
      if (isPlaying) {
        suppressNativeSyncRef.current = true;
        setTimeout(() => {
          suppressNativeSyncRef.current = false;
        }, 0);
      }
      boundaryAdvanceLockRef.current = false;
      isSwitchingClipRef.current = false;
      return;
    }
    previewRef.current.currentTime = selectedClip.start;
    setPlayhead(clipStartHead);
    if (isPlaying) {
      suppressNativeSyncRef.current = true;
      setTimeout(() => {
        suppressNativeSyncRef.current = false;
      }, 0);
    }
    boundaryAdvanceLockRef.current = false;
    isSwitchingClipRef.current = false;
  }, [selectedClipId]);

  const handlePreviewTimeUpdate = () => {
    if (!previewRef.current || !selectedClip || isSwitchingSourceRef.current) {
      return;
    }
    if (boundaryAdvanceLockRef.current) {
      return;
    }
    if (selectedClipIdRef.current !== selectedClip.id) {
      return;
    }
    if (pendingSeekRef.current !== null) {
      return;
    }
    if (previewRef.current.seeking) {
      return;
    }
    const currentTime = previewRef.current.currentTime;
    if (currentTime < selectedClip.start) {
      previewRef.current.currentTime = selectedClip.start;
      setPlayhead(selectedClip.offset);
      return;
    }
    if (currentTime >= selectedClip.end - 0.02) {
      if (isPlaying) {
        handlePreviewEnded();
      } else {
        previewRef.current.currentTime = selectedClip.end;
        setPlayhead(selectedClip.offset + (selectedClip.end - selectedClip.start));
      }
      return;
    }
    const nextHead = selectedClip.offset + (currentTime - selectedClip.start);
    if (Number.isFinite(nextHead)) {
      playheadFromPreviewRef.current = true;
      setPlayhead(Math.max(0, nextHead));
    }
  };

  const handlePreviewEnded = () => {
    if (!selectedClipIdRef.current) {
      setIsPlaying(false);
      return;
    }
    if (boundaryAdvanceLockRef.current) {
      return;
    }
    boundaryAdvanceLockRef.current = true;
    const nextClip = advanceToNextClip(selectedClipIdRef.current);
    if (nextClip) {
      setIsPlaying(true);
      return;
    }
    if (selectedClip) {
      setPlayhead(selectedClip.offset + (selectedClip.end - selectedClip.start));
    }
    setIsPlaying(false);
  };

  const handlePreviewMetadata = () => {
    const preview = previewRef.current;
    if (!preview) {
      return;
    }
    isSwitchingSourceRef.current = false;
    const ratio = preview.videoWidth && preview.videoHeight
      ? preview.videoWidth / preview.videoHeight
      : 16 / 9;
    setPreviewAspect(ratio);

    if (pendingSeekRef.current !== null) {
      preview.currentTime = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (isPlaying) {
        suppressNativeSyncRef.current = true;
        setTimeout(() => {
          suppressNativeSyncRef.current = false;
        }, 0);
      }
      boundaryAdvanceLockRef.current = false;
      isSwitchingClipRef.current = false;
    }
  };

  const handleDragStart = (event: React.DragEvent, clip: LibraryClip) => {
    event.dataTransfer.setData("text/plain", clip.id);
    setIsDraggingMedia(true);
  };

  const handleDragEnd = () => {
    setIsDraggingMedia(false);
  };

  const handleTimelineDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const clip = libraryClips.find((item) => item.id === id);
    if (!clip) {
      setIsDraggingMedia(false);
      return;
    }
    addClipToTimeline(clip);
    setIsDraggingMedia(false);
  };

  const handleTimelineDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };
  return (
    <Layout>
      <SEO
        title="Video Editor | Timeline Trim & Join"
        description="Drag clips onto a timeline, trim with handles, split with scissors, and export a joined video."
      />
      <div className="container mx-auto px-4 py-6">
        <section className="mb-4">
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={activePanel === "media" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActivePanel("media")}
              >
                Media
              </Button>
              <Button
                variant={activePanel === "audio" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActivePanel("audio")}
              >
                Audio
              </Button>
              <Button
                variant={activePanel === "text" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActivePanel("text")}
              >
                Text
              </Button>
              <div className="ml-auto flex items-center gap-3">
                <Badge variant="outline" className="border-primary/40 text-primary">
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  Lossless default
                </Badge>
                <Badge variant="outline" className="border-border/60 text-muted-foreground">
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  Precision toggle
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <FeatureGate feature="videoGeneration">
          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="grid w-full max-w-lg grid-cols-2">
              <TabsTrigger value="timeline" className="gap-2">
                <Scissors className="h-4 w-4" />
                Timeline Editor
              </TabsTrigger>
              <TabsTrigger value="trim" className="gap-2">
                <Scissors className="h-4 w-4" />
                Quick Trim
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <div className="flex flex-col gap-4">
                <div className="flex gap-0" ref={containerRef}>
                  <Card
                    className="flex shrink-0 flex-col bg-card/70 backdrop-blur-xl border-border/50"
                    style={{ width: leftWidth }}
                  >
                    <CardHeader className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Upload className="h-4 w-4 text-primary" />
                        Media Bin
                      </CardTitle>
                      <CardDescription>Import clips and add them to the timeline.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
                      {activePanel === "media" ? (
                        <>
                          <Input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={(event) => handleImportFiles(Array.from(event.target.files || []))}
                          />
                          <div className="flex-1 overflow-y-auto rounded-lg border border-border/40 bg-background/60 p-2">
                            {libraryClips.length === 0 && (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                Import clips to start.
                              </div>
                            )}
                            <div className="grid gap-2 md:grid-cols-2">
                              {libraryClips.map((clip) => (
                                <div
                                  key={clip.id}
                                  draggable
                                  onDragStart={(event) => handleDragStart(event, clip)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => {
                                    setSelectedClipId(null);
                                    setLibraryPreviewId(clip.id);
                                  }}
                                  className="cursor-grab rounded-lg border border-border/40 bg-background/80 p-2 text-xs active:cursor-grabbing"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="truncate text-sm font-medium text-foreground">
                                      {clip.file.name}
                                    </div>
                                    <span className="text-muted-foreground">{formatTime(clip.duration)}</span>
                                  </div>
                                  <div className="mt-2 overflow-hidden rounded-md border border-border/40 bg-black/70">
                                    {clip.thumbnail ? (
                                      <img
                                        src={clip.thumbnail}
                                        alt={`${clip.file.name} thumbnail`}
                                        className="h-20 w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-20 items-center justify-center text-[10px] text-muted-foreground">
                                        No thumbnail
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-muted-foreground">
                                    {(clip.file.size / (1024 * 1024)).toFixed(2)} MB
                                  </div>
                                  <Button
                                    className="mt-2 w-full"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      addClipToTimeline(clip);
                                    }}
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Add to Timeline
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/60 text-xs text-muted-foreground">
                          {activePanel === "audio" ? "Audio tools coming next." : "Text tools coming next."}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div
                    className="h-full w-3 cursor-col-resize bg-border/40 hover:bg-border/70 active:bg-border/90 select-none"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setResizing("left");
                    }}
                    aria-label="Resize media bin"
                  />
                  <Card className="flex flex-1 flex-col bg-card/70 backdrop-blur-xl border-border/50">
                    <CardHeader className="space-y-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Film className="h-4 w-4 text-primary" />
                          Player
                        </CardTitle>
                        <CardDescription>Preview the selected clip at the playhead.</CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant={tool === "select" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTool("select")}
                        >
                          <MousePointer2 className="mr-1 h-4 w-4" />
                          Select
                        </Button>
                        <Button
                          variant={tool === "cut" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTool("cut")}
                        >
                          <Scissors className="mr-1 h-4 w-4" />
                          Cut
                        </Button>
                        <div className="ml-auto flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => nudgePlayhead(-0.1)}>
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={handlePlayToggle}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => nudgePlayhead(0.1)}>
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">{formatTime(playhead)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 overflow-visible">
                      {previewSource ? (
                        <div
                          className="w-full rounded-xl border border-border/50 bg-black/70"
                          style={{ aspectRatio: previewAspect }}
                        >
                          <video
                            ref={previewRef}
                            src={previewSource}
                            controls
                            onLoadedMetadata={handlePreviewMetadata}
                            onTimeUpdate={handlePreviewTimeUpdate}
                            onEnded={handlePreviewEnded}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/50 text-sm text-muted-foreground"
                          style={{ aspectRatio: previewAspect }}
                        >
                          Import clips to preview.
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={setClipIn}>
                          Set In
                        </Button>
                        <Button variant="outline" size="sm" onClick={setClipOut}>
                          Set Out
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => splitClipAtPlayhead()}>
                          Split at Playhead
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => selectedClip && removeClip(selectedClip.id)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div
                    className="h-full w-3 cursor-col-resize bg-border/40 hover:bg-border/70 active:bg-border/90 select-none"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setResizing("right");
                    }}
                    aria-label="Resize details panel"
                  />
                  <Card
                    className="flex shrink-0 flex-col bg-card/70 backdrop-blur-xl border-border/50"
                    style={{ width: rightWidth }}
                  >
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base">Details</CardTitle>
                      <CardDescription>Selected clip info and export options.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
                      {selectedClip ? (
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div><span className="text-foreground">Name:</span> {selectedClip.file.name}</div>
                          <div><span className="text-foreground">Duration:</span> {formatTime(selectedClip.end - selectedClip.start)}</div>
                          <div><span className="text-foreground">In:</span> {selectedClip.start.toFixed(2)}s</div>
                          <div><span className="text-foreground">Out:</span> {selectedClip.end.toFixed(2)}s</div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Select a clip to see details.</div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Precision Mode</Label>
                          <Switch checked={precisionMode} onCheckedChange={setPrecisionMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Timeline Zoom</Label>
                          <Slider
                            value={[pixelsPerSecond]}
                            min={40}
                            max={180}
                            step={10}
                            onValueChange={(value) => setPixelsPerSecond(value[0])}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleUndo}
                            disabled={history.length === 0}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRedo}
                            disabled={future.length === 0}
                          >
                            <Redo2 className="h-4 w-4" />
                          </Button>
                          <Button
                            className="ml-auto"
                            onClick={handleTimelineExport}
                            disabled={timelineBusy || timelineClips.length < 2}
                          >
                            {timelineBusy ? "Exporting..." : "Export"}
                          </Button>
                        </div>
                        <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                          Lossless trims on keyframes. Enable precision for exact cuts (re-encode).
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="min-h-[200px] bg-card/70 backdrop-blur-xl border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Timeline</CardTitle>
                      <CardDescription>Click to move playhead. Drag clips to edit.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Tool:</span>
                      <span className="rounded-full border border-border/50 px-2 py-1 text-foreground">
                        {tool === "cut" ? "Cut" : "Select"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="h-full overflow-hidden">
                    <div
                      className={`relative h-full overflow-x-auto ${isDraggingMedia ? "ring-2 ring-primary/60" : ""}`}
                      onClick={setPlayheadFromEvent}
                      onDragOver={handleTimelineDragOver}
                      onDrop={handleTimelineDrop}
                    >
                      <div className="relative min-h-[160px]" style={{ width: timelineWidth }} ref={timelineRef}>
                        <div className="sticky left-0 flex gap-6 text-xs text-muted-foreground">
                          {Array.from({ length: tickCount + 1 }).map((_, index) => {
                            const time = index * tickStep;
                            return (
                              <div
                                key={`tick-${time}`}
                                className="flex flex-col items-start"
                                style={{ width: tickStep * pixelsPerSecond }}
                              >
                                <span>{formatTime(time)}</span>
                                <div className="h-3 w-px bg-border/60" />
                              </div>
                            );
                          })}
                        </div>

                        <div className="relative mt-4 h-20 rounded-lg border border-dashed border-border/60 bg-secondary/20">
                          <div
                            className="absolute -top-4 bottom-0 w-px bg-primary"
                            style={{ left: playhead * pixelsPerSecond }}
                          >
                            <div className="absolute -top-2 -ml-2 h-4 w-4 rotate-45 bg-primary" />
                          </div>
                          {timelineClips.length === 0 && (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              Add clips from the Media Bin.
                            </div>
                          )}
                          {timelineClips.map((clip) => {
                            const left = clip.offset * pixelsPerSecond;
                            const width = (clip.end - clip.start) * pixelsPerSecond;
                            const isSelected = clip.id === selectedClipId;
                            return (
                              <div
                                key={clip.id}
                                className={`absolute top-3 h-12 rounded-lg border ${isSelected ? "border-primary" : "border-border"} bg-gradient-to-r from-primary/30 to-accent/20 shadow-sm`}
                                style={{ left, width }}
                                onPointerDown={(event) => startDrag(event, clip, "move")}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setLibraryPreviewId(null);
                                  pendingSeekRef.current = clip.start;
                                  setSelectedClipId(clip.id);
                                  setPlayhead(clip.offset);
                                }}
                              >
                                <div
                                  className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-primary/40"
                                  onPointerDown={(event) => startDrag(event, clip, "trim-start")}
                                />
                                <div
                                  className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-primary/40"
                                  onPointerDown={(event) => startDrag(event, clip, "trim-end")}
                                />
                                <div className="flex h-full items-center justify-between px-3 text-xs font-semibold text-foreground">
                                  <span className="truncate">{clip.file.name}</span>
                                  <span>{formatTime(clip.end - clip.start)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {timelineError && (
                      <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-500">
                        {timelineError}
                      </div>
                    )}
                    {timelineResultUrl && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <video
                          src={timelineResultUrl}
                          controls
                          className="h-20 w-32 rounded border border-border/50 bg-black/70"
                        />
                        <Button asChild size="sm">
                          <a href={timelineResultUrl} download="timeline-export.mp4">
                            Download Export
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trim">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="bg-card/70 backdrop-blur-xl border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-primary" />
                      Trim with Keep Segments
                    </CardTitle>
                    <CardDescription>
                      Add one or more keep ranges. The server will stitch them together without re-encoding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="trim-file">Video file</Label>
                        <Input
                          id="trim-file"
                          type="file"
                          accept="video/*"
                          onChange={(event) => setTrimFile(event.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={addSegment}>
                          Add Segment
                        </Button>
                        <Button onClick={handleTrim} disabled={trimBusy}>
                          {trimBusy ? "Trimming..." : "Export Trim"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {segments.map((segment, index) => (
                        <div key={segment.id} className="rounded-xl border border-border/50 bg-background/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-foreground">
                              Segment {index + 1}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFromPlayer(segment.id, "start")}
                              >
                                Set Start
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFromPlayer(segment.id, "end")}
                              >
                                Set End
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSegment(segment.id)}
                                disabled={segments.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Start (seconds)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={segment.start}
                                onChange={(event) => updateSegment(segment.id, "start", event.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End (seconds)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={segment.end}
                                onChange={(event) => updateSegment(segment.id, "end", event.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {trimError && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {trimError}
                      </div>
                    )}

                    <div className="rounded-lg border border-border/40 bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
                      Copy mode preserves quality but trims only on keyframes. For frame-accurate cuts,
                      use precision mode from the timeline editor.
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/70 backdrop-blur-xl border-border/50">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>Use the player to scrub and set segment times.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trimPreviewUrl ? (
                      <video
                        ref={videoRef}
                        src={trimPreviewUrl}
                        controls
                        className="w-full rounded-xl border border-border/50 bg-black/70"
                      />
                    ) : (
                      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/50 text-sm text-muted-foreground">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload a video to preview it here.
                      </div>
                    )}

                    {trimResultUrl && (
                      <div className="space-y-3">
                        <video
                          src={trimResultUrl}
                          controls
                          className="w-full rounded-xl border border-border/50 bg-black/70"
                        />
                        <Button asChild className="w-full">
                          <a href={trimResultUrl} download="trimmed.mp4">
                            Download Trimmed Video
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </FeatureGate>
      </div>
    </Layout>
  );
};

export default VideoEditor;
