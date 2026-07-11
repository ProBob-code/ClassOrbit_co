'use client';

// Crop dialog for admin blog images (cover + body). Pan/zoom crop via
// react-easy-crop, then the selection is rendered to a canvas, downscaled
// and compressed so the upload stays under the worker's ~1MB cap.

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { motion } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';

export interface CroppedImage {
  dataBase64: string;
  mime: string;
  placement?: 'full' | 'left' | 'right';
  caption?: string;
}

interface Props {
  src: string; // object URL of the picked file
  title: string;
  aspects: { label: string; value: number }[];
  /** Body images: also ask for placement + caption to build the markdown tag. */
  withPlacement?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onApply: (result: CroppedImage) => void;
}

// Worker rejects payloads over 11M base64 chars (~8MB binary); stay under
// with margin. Bytes land in R2, not a D1 row, so this is just a sanity
// cap — not a hard storage constraint.
const MAX_B64_CHARS = 5_500_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// toDataURL silently falls back to image/png for unsupported mimes, so we
// verify the returned data URL really carries the format we asked for.
function canEncode(mime: string): boolean {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.toDataURL(mime).startsWith(`data:${mime}`);
}

// Renders the crop to a canvas and re-encodes it as a compressed image — we
// ALWAYS store this downscaled/compressed version, never the original upload.
// Prefers WebP (smallest, keeps text crisp, preserves alpha) and falls back to
// JPEG, shrinking width/quality until the payload is under the worker's cap.
async function cropToBase64(src: string, area: Area): Promise<{ dataBase64: string; mime: string } | null> {
  const img = await loadImage(src);
  const webp = canEncode('image/webp');

  const attempts: { maxW: number; mime: string; quality: number }[] = [];
  for (const maxW of [2000, 1600, 1400, 1200, 1024]) {
    if (webp) attempts.push({ maxW, mime: 'image/webp', quality: 0.82 });
    attempts.push({ maxW, mime: 'image/jpeg', quality: 0.82 });
  }

  for (const { maxW, mime, quality } of attempts) {
    const scale = Math.min(1, maxW / area.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(area.width * scale);
    canvas.height = Math.round(area.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mime === 'image/jpeg') {
      // JPEG has no alpha; flatten any transparency onto white.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(mime, quality);
    const dataBase64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    if (dataBase64.length <= MAX_B64_CHARS) return { dataBase64, mime };
  }
  return null;
}

export default function ImageCropModal({ src, title, aspects, withPlacement, busy, onCancel, onApply }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(aspects[0].value);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [placement, setPlacement] = useState<'full' | 'left' | 'right'>('full');
  const [caption, setCaption] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

  const apply = async () => {
    if (!areaPixels) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await cropToBase64(src, areaPixels);
      if (!result) {
        setError('Could not compress the image enough. Try a smaller crop.');
        return;
      }
      onApply({
        ...result,
        ...(withPlacement ? { placement, caption: caption.trim() || undefined } : {}),
      });
    } catch {
      setError('Failed to crop the image. Try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  const working = processing || busy;

  return (
    <div className="fixed inset-0 bg-[#06040F]/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface border border-border rounded-[28px] w-full max-w-[640px] p-6 md:p-7 shadow-2xl relative my-8 text-left"
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-[18px] font-bold text-text-main">{title}</h3>
          <button onClick={onCancel} disabled={working} className="text-text-subtle hover:text-text-main transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04] disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="relative w-full h-[340px] rounded-2xl overflow-hidden bg-background border border-border">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Aspect</span>
              <div className="flex gap-1 bg-background/60 border border-border rounded-xl p-1">
                {aspects.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => setAspect(a.value)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                      aspect === a.value ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--color-primary,#F59E0B)] cursor-pointer"
              />
            </div>
          </div>

          {withPlacement && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Placement in text</label>
                <div className="flex gap-1 bg-background/60 border border-border rounded-xl p-1 w-fit">
                  {(['full', 'left', 'right'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlacement(p)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-all cursor-pointer ${
                        placement === p ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {p === 'full' ? 'Full width' : `Float ${p}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-2">Caption (optional)</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Shown under the image"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-[13px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          )}

          {error && <p className="text-[12px] text-red-400 font-medium">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
          <button onClick={onCancel} disabled={working} className="px-5 py-2.5 rounded-xl font-bold text-[13px] text-text-muted hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={working || !areaPixels}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-[13px] transition-colors shadow-glow flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {working ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {busy ? 'Uploading…' : 'Crop & Use'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
