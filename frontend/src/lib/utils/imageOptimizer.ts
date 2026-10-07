/**
 * Image optimization utility for compressing images before upload
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.7,
  maxSizeKB: 500,
};

/**
 * Compress and optimize image before upload
 */
export async function compressImage(
  file: File,
  options: ImageOptimizationOptions = {},
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (
          width > (config.maxWidth || 1920) ||
          height > (config.maxHeight || 1920)
        ) {
          const ratio = Math.min(
            (config.maxWidth || 1920) / width,
            (config.maxHeight || 1920) / height,
          );
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        // JPEG has no transparency; without this, transparent PNGs go black.
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to base64
        let quality = config.quality || 0.7;
        let base64: string;

        // Iteratively reduce quality until size is acceptable
        do {
          base64 = canvas.toDataURL("image/jpeg", quality);
          const sizeKB = (base64.length * 3) / 4 / 1024; // Rough estimation

          if (sizeKB <= (config.maxSizeKB || 500)) {
            break;
          }

          quality -= 0.1;
        } while (quality > 0.1);

        resolve(base64);
      };

      img.onerror = () => {
        reject(
          new Error(
            "This browser can't open this image format (e.g. HEIC). Please convert it to JPG or PNG.",
          ),
        );
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file before processing
 */
export function validateImage(
  file: File,
  maxSizeMB: number = 10,
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Some systems leave the type empty (HEIC, AVIF), so fall back to the name.
  const looksLikeImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|svg|heic|heif|ico)$/i.test(file.name);
  if (!looksLikeImage) {
    return { valid: false, error: "File must be an image" };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Batch compress multiple images
 */
export async function compressMultipleImages(
  files: File[],
  options: ImageOptimizationOptions = {},
): Promise<string[]> {
  const results: string[] = [];

  for (const file of files) {
    const validation = validateImage(file);
    if (!validation.valid) {
      console.warn(`Skipping file: ${validation.error}`);
      continue;
    }

    try {
      const compressed = await compressImage(file, options);
      results.push(compressed);
    } catch (error) {
      console.error(`Error compressing image: ${error}`);
    }
  }

  return results;
}
