"use client";
import Image from "next/image";
import { XIcon } from "lucide-react";
import { useId, useState } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useObjectDetect } from "@/hooks/use-object-detect";
import { useFileUploadContext } from "@/components/context";
import { Button } from "@/components/ui/button";
import { StatusUpdates } from "@/components/status-updates";

export const ImageObject = () => {
  const {
    state: { files },
    options: { removeFile },
  } = useFileUploadContext();
  const [showDetections, setShowDetections] = useState<boolean>(true);

  const state = useObjectDetect();
  const switchId = useId();

  console.log("detection state", state);

  const [file] = files;
  if (!file?.preview) {
    return null;
  }
  const aspectRatio = `${file.width || 1} / ${file.height || 1}`;
  const previewUrl = file.preview;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={showDetections}
          onCheckedChange={setShowDetections}
        />
        <Label htmlFor={switchId}>Show Objects</Label>
      </div>
      <div
        className="flex flex-col gap-2 relative rounded-xl"
        style={{ aspectRatio }}
      >
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-20 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetections(true);
            removeFile(file.id);
          }}
          aria-label="Remove file"
        >
          <XIcon className="size-5" />
        </Button>
        <div className="relative w-full h-full">
          <Image
            fill
            src={previewUrl}
            alt="Uploaded image"
            className="object-fill w-full h-full select-none"
            draggable={false}
          />
          <StatusUpdates state={state} showDetections={showDetections} />
        </div>
      </div>
    </div>
  );
};
