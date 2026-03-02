"use client";

import { useEffect, useRef } from "react";
import type { UnsplashPhoto } from "@/lib/unsplash";

interface UnsplashBackgroundProps {
  photo: UnsplashPhoto;
}

export function UnsplashBackground({ photo }: UnsplashBackgroundProps) {
  const trackedRef = useRef(false);

  // Trigger Unsplash download tracking via server-side proxy
  useEffect(() => {
    if (trackedRef.current || !photo.downloadLocation) return;
    trackedRef.current = true;

    fetch("/api/unsplash/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
    }).catch(() => {
      // Silently ignore — tracking is best-effort
    });
  }, [photo.downloadLocation]);

  return (
    <>
      {/* Full-page blurred background wash */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative blurred bg, Image optimization not beneficial */}
        <img
          src={photo.imageUrl}
          alt=""
          className="h-full w-full scale-110 object-cover"
          style={{ filter: "blur(30px)", opacity: 0.12 }}
          loading="eager"
        />
      </div>

      {/* Attribution — fixed bottom-right */}
      <div className="fixed bottom-2 right-4 z-10 pointer-events-auto">
        <p className="text-[10px] text-foreground/30">
          Photo by{" "}
          <a
            href={photo.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground/50"
          >
            {photo.photographerName}
          </a>
          {" "}on{" "}
          <a
            href="https://unsplash.com?utm_source=bookburr&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground/50"
          >
            Unsplash
          </a>
        </p>
      </div>
    </>
  );
}
