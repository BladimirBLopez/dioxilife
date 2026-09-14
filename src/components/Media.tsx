import Image from "next/image";
import { esVideo } from "@/lib/media";

/**
 * Renderiza una imagen o un video de forma transparente según la URL.
 * - variant="thumb": para miniaturas/grillas -> video en loop, muteado, sin controles.
 * - variant="full": para la imagen/video principal -> video con controles, sin autoplay.
 */
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
    // Para video usamos object-contain (nunca recortar) con fondo negro,
    // en vez del object-cover que se usa para imágenes.
    const base = fill ? "absolute inset-0 w-full h-full" : "";
    const videoClassName = `${base} object-contain bg-black`.trim();

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
