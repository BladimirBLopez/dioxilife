import Image from "next/image";
import { esVideo } from "@/lib/media";

export default function Media({
  src,
  alt,
  fill,
  width,
  height,
  className,
  variant = "thumb",
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  variant?: "thumb" | "full";
}) {
  if (esVideo(src)) {
    const videoClassName = fill
      ? `absolute inset-0 w-full h-full ${className ?? ""}`
      : className;

    return variant === "full" ? (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className={videoClassName}
      />
    ) : (
      <video
        src={src}
        muted
        autoPlay
        loop
        playsInline
        className={videoClassName}
      />
    );
  }

  return fill ? (
    <Image src={src} alt={alt} fill className={className} />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width as number}
      height={height as number}
      className={className}
    />
  );
}
