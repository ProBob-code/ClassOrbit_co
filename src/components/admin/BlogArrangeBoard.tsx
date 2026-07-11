'use client';

// Visual arranger for the admin blog editor. The markdown content is split
// into blocks on blank lines; every block can be dragged into a new position,
// and image blocks expose placement / caption / delete controls plus insert
// points between blocks — no hand-editing of markdown needed. Dropping an
// image file anywhere on the board uploads it via the existing crop flow.

import { useMemo, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, ImagePlus, Trash2 } from 'lucide-react';
import BlogContent from '@/components/blog/BlogContent';

const IMAGE_BLOCK = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;

type Placement = 'full' | 'left' | 'right';

interface Block {
  id: string;
  text: string;
}

let blockSeq = 0;
const toBlocks = (content: string): Block[] =>
  content
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ id: `blk-${++blockSeq}`, text }));

const joinBlocks = (blocks: Block[]) => blocks.map((b) => b.text).join('\n\n');

function parseImageBlock(text: string): { url: string; caption: string; placement: Placement } | null {
  const match = text.match(IMAGE_BLOCK);
  if (!match) return null;
  const parts = match[1].split('|').map((p) => p.trim());
  let placement: Placement = 'full';
  const last = parts[parts.length - 1]?.toLowerCase();
  if (parts.length > 1 && (last === 'left' || last === 'right' || last === 'full')) {
    placement = last;
    parts.pop();
  }
  return { url: match[2], caption: parts.join('|').trim(), placement };
}

const imageMarkdown = (url: string, caption: string, placement: Placement) =>
  `![${caption}${placement !== 'full' ? `|${placement}` : ''}](${url})`;

interface BoardProps {
  content: string;
  onChange: (content: string) => void;
  /** Ask the parent to open the image picker and insert the result at this block index. */
  onInsertImage: (index: number) => void;
  /** An image file was dropped on the board; parent uploads it and appends at this index. */
  onDropFile: (file: File, index: number) => void;
}

function InsertPoint({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center py-0.5">
      <button
        onClick={onClick}
        title="Insert image here"
        className="flex items-center gap-1.5 text-[10px] font-bold text-text-subtle hover:text-primary opacity-40 hover:opacity-100 transition-all cursor-pointer px-3 py-1 rounded-full hover:bg-primary/10"
      >
        <ImagePlus size={12} /> image
      </button>
    </div>
  );
}

function ArrangeItem({
  block,
  onUpdate,
  onRemove,
  onInsertBelow,
}: {
  block: Block;
  onUpdate: (text: string) => void;
  onRemove: () => void;
  onInsertBelow: () => void;
}) {
  const controls = useDragControls();
  const image = parseImageBlock(block.text);

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className="relative"
      whileDrag={{ scale: 1.01, zIndex: 30, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
    >
      <div className={`flex items-start gap-2.5 rounded-xl border p-3 bg-background/80 backdrop-blur-sm ${image ? 'border-primary/25' : 'border-border'}`}>
        <button
          onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
          title="Drag to move"
          className="mt-1 shrink-0 text-text-subtle hover:text-text-main cursor-grab active:cursor-grabbing touch-none p-0.5"
        >
          <GripVertical size={16} />
        </button>

        {image ? (
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="w-28 h-[72px] shrink-0 rounded-lg object-cover border border-border" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex gap-1 bg-surface border border-border rounded-lg p-0.5 w-fit">
                {(['full', 'left', 'right'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => onUpdate(imageMarkdown(image.url, image.caption, p))}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      image.placement === p ? 'bg-primary text-white shadow-glow' : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {p === 'full' ? 'Full width' : `Float ${p}`}
                  </button>
                ))}
              </div>
              <input
                value={image.caption}
                onChange={(e) => onUpdate(imageMarkdown(image.url, e.target.value.replace(/[[\]()]/g, ''), image.placement))}
                placeholder="Caption (optional)"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-[12px] text-text-main placeholder:text-text-subtle focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={onRemove}
              title="Remove image"
              className="shrink-0 self-start text-red-400/70 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0 max-h-[88px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)] pointer-events-none select-none">
            <BlogContent content={block.text} />
          </div>
        )}
      </div>
      <InsertPoint onClick={onInsertBelow} />
    </Reorder.Item>
  );
}

export default function BlogArrangeBoard({ content, onChange, onInsertImage, onDropFile }: BoardProps) {
  const [localBlocks, setLocalBlocks] = useState<Block[] | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const dragDepth = useRef(0);

  // Keep our block ids stable while edits originate here, but re-derive the
  // blocks whenever the content changes from outside the board (e.g. an image
  // upload finished and was inserted by the parent).
  const blocks = useMemo(
    () => (localBlocks && joinBlocks(localBlocks) === content ? localBlocks : toBlocks(content)),
    [localBlocks, content]
  );

  const commit = (next: Block[]) => {
    setLocalBlocks(next);
    onChange(joinBlocks(next));
  };

  const handleDrop = (e: React.DragEvent) => {
    dragDepth.current = 0;
    setFileOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    e.preventDefault();
    onDropFile(file, blocks.length);
  };

  if (blocks.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted text-[13px] border border-dashed border-border rounded-2xl">
        Nothing to arrange yet — write some content in the Edit tab first, or
        <button onClick={() => onInsertImage(0)} className="text-primary font-bold hover:underline cursor-pointer ml-1">add an image</button>.
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); }}
      onDragEnter={(e) => { if (e.dataTransfer.types.includes('Files')) { dragDepth.current++; setFileOver(true); } }}
      onDragLeave={() => { if (--dragDepth.current <= 0) { dragDepth.current = 0; setFileOver(false); } }}
      onDrop={handleDrop}
      className={`rounded-2xl transition-all ${fileOver ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-surface bg-primary/5' : ''}`}
    >
      <p className="text-[11px] text-text-subtle mb-3">
        Drag any block to reorder. Use the <span className="text-primary font-bold">image</span> insert points to add an image at that exact spot,
        or drop an image file anywhere on this panel.
      </p>

      <InsertPoint onClick={() => onInsertImage(0)} />
      <Reorder.Group axis="y" values={blocks} onReorder={commit} layoutScroll className="space-y-1">
        {blocks.map((block, i) => (
          <ArrangeItem
            key={block.id}
            block={block}
            onUpdate={(text) => commit(blocks.map((b) => (b.id === block.id ? { ...b, text } : b)))}
            onRemove={() => commit(blocks.filter((b) => b.id !== block.id))}
            onInsertBelow={() => onInsertImage(i + 1)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
