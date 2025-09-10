import { useRef, useEffect, useState } from "react";

import { useFileUploadContext } from "@/components/context";
import { type DetectState, type ApiResp } from "@/hooks/types";
import { computeBoxes } from "@/lib/compute-boxes";

export const useObjectDetect = () => {
  const [state, setState] = useState<DetectState>({ status: "idle" });

  const {
    state: { files },
  } = useFileUploadContext();

  const abortRef = useRef<AbortController | null>(null);
  const startedForIdRef = useRef<string | null>(null);

  const [file] = files;

  useEffect(() => {
    // Only start detection when we have dimensions so normalization works.
    if (!file?.file || !file?.preview) return;
    if (!file?.width || !file?.height) return; // wait until hook populates
    if (startedForIdRef.current === file.id) return; // already started for this file

    startedForIdRef.current = file.id;
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    (async () => {
      try {
        console.log("Preparing file for detection", file);

        let uploadFile: File;
        if (file.file instanceof File) {
          uploadFile = file.file;
        } else {
          throw new Error("Unsupported file object");
        }

        // Build multipart form so we can append more fields later
        const form = new FormData();
        form.append("file", uploadFile, uploadFile.name);

        console.log("Starting detection (multipart)", {
          name: uploadFile.name,
          type: uploadFile.type,
          size: uploadFile.size,
          width: file.width,
          height: file.height,
        });

        const resp = await fetch("/api/detect", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`Detection failed (${resp.status}) ${text}`);
        }

        const { detections: rawDetections } = (await resp.json()) as ApiResp;

        console.log("Raw detections from API", { rawDetections });

        const detections = computeBoxes({ rawDetections, file });

        setState({
          status: "success",
          detections,
        });
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setState({
          status: "error",
          error: (error as Error)?.message || String(error),
        });
      }
    })();

    return () => {
      controller.abort();
    };
  }, [file]);

  return state;
};
