import React from "react";
import { cn } from "../../lib/utils";

export function LandingFeatureCard({ dark, acc, image, imageAlt }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[2rem] sm:rounded-[40px]",
        acc.bg
      )}
    >
      <img
        src={image}
        alt={imageAlt}
        className={cn(
          "block h-[320px] w-full object-cover sm:h-[400px] md:h-[460px] lg:h-[520px]",
          dark && "opacity-95"
        )}
      />
    </div>
  );
}
