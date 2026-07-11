// Lightweight markdown renderer for blog posts.
// Shared between the public blog post page (light) and the admin blog preview (dark)
// so authors see exactly how a post will render before publishing.

export const slugifyHeading = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export interface BlogHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

// Extracts ## / ### headings with the same ids the renderer assigns,
// so a table of contents can deep-link into the article.
export function extractHeadings(content: string): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const seen = new Map<string, number>();
  for (const line of content.split('\n')) {
    const match = line.match(/^(##|###) (.+)/);
    if (!match) continue;
    const text = match[2].trim();
    let id = slugifyHeading(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    headings.push({ id, text, level: match[1] === '##' ? 2 : 3 });
  }
  return headings;
}

const inlineMd = (text: string, strongClass: string) =>
  text
    // Images before links, or the link regex would swallow the [alt](src) part.
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="inline-block max-w-full rounded-lg align-middle" loading="lazy" />')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, `<strong class="${strongClass} font-bold">$1</strong>`)
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

// A line holding nothing but an image: ![caption](url) with an optional
// placement suffix in the caption — ![caption|left](url), |right or |full.
const BLOCK_IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;

function BlockImage({ line, borderClass, captionClass }: { line: string; borderClass: string; captionClass: string }) {
  const match = line.match(BLOCK_IMAGE)!;
  const url = match[2];
  const parts = match[1].split('|').map((p) => p.trim());
  let placement: 'full' | 'left' | 'right' = 'full';
  const last = parts[parts.length - 1]?.toLowerCase();
  if (parts.length > 1 && (last === 'left' || last === 'right' || last === 'full')) {
    placement = last;
    parts.pop();
  }
  const caption = parts.join('|').trim();

  // Floats are half-width on sm+ so text flows beside them without ever
  // overlapping (headings/tables/hr clear floats, and the prose container
  // is flow-root). On mobile every image is full-width.
  const layout =
    placement === 'left'
      ? 'my-6 w-full sm:float-left sm:w-[46%] sm:mr-7 sm:my-2 sm:mb-4'
      : placement === 'right'
        ? 'my-6 w-full sm:float-right sm:w-[46%] sm:ml-7 sm:my-2 sm:mb-4'
        : 'my-8 clear-both';

  return (
    <figure className={layout}>
      <div className={`rounded-2xl overflow-hidden border ${borderClass} bg-black/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={caption} className="w-full h-auto block" loading="lazy" />
      </div>
      {caption && (
        <figcaption className={`mt-2.5 text-center text-[13px] ${captionClass} italic`}>{caption}</figcaption>
      )}
    </figure>
  );
}

const splitTableRow = (line: string) => line.split('|').slice(1, -1).map((c) => c.trim());

export default function BlogContent({ content, theme = 'dark' }: { content: string; theme?: 'light' | 'dark' }) {
  const light = theme === 'light';
  const c = {
    heading: light ? 'text-slate-900' : 'text-white',
    strong: light ? 'text-slate-900' : 'text-white',
    body: light ? 'text-slate-600' : 'text-text-muted',
    border: light ? 'border-slate-200' : 'border-border',
    borderSoft: light ? 'border-slate-100' : 'border-border/50',
    tableHead: light ? 'bg-slate-50' : 'bg-white/[0.04]',
    rowHover: light ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]',
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Heading ids must match extractHeadings(), including dedup suffixes.
  const seenSlugs = new Map<string, number>();
  const headingId = (text: string) => {
    let id = slugifyHeading(text.trim());
    const count = seenSlugs.get(id) ?? 0;
    seenSlugs.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    return id;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (BLOCK_IMAGE.test(line)) {
      elements.push(<BlockImage key={i} line={line} borderClass={c.border} captionClass={c.body} />);
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} id={headingId(line.slice(4))} className={`clear-both scroll-mt-28 font-display text-[20px] font-bold ${c.heading} mt-8 mb-3`}>{line.slice(4)}</h3>);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} id={headingId(line.slice(3))} className={`clear-both scroll-mt-28 font-display text-[26px] font-bold ${c.heading} mt-9 mb-3`}>{line.slice(3)}</h2>);
      i++;
      continue;
    }

    if (line.startsWith('|') && /^\|[\s:-|]+\|$/.test(lines[i + 1] ?? '')) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      const header = splitTableRow(tableLines[0]);
      const body = tableLines.slice(2).map(splitTableRow);
      elements.push(
        <div key={i} className={`clear-both my-6 overflow-x-auto rounded-2xl border ${c.border}`}>
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className={c.tableHead}>
                {header.map((cell, hi) => (
                  <th key={hi} className={`px-4 py-3 font-bold ${c.heading} border-b ${c.border} whitespace-nowrap`} dangerouslySetInnerHTML={{ __html: inlineMd(cell, c.strong) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className={`border-b ${c.borderSoft} last:border-0 ${c.rowHover} transition-colors`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-4 py-3 ${c.body}`} dangerouslySetInnerHTML={{ __html: inlineMd(cell, c.strong) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    if (line.startsWith('---')) {
      elements.push(<hr key={i} className={`clear-both ${c.border} my-8`} />);
      i++;
      continue;
    }

    if (line.startsWith('*[')) {
      const match = line.match(/\*\[(.+?)\]\((.+?)\)\*/);
      if (match) {
        elements.push(
          <p key={i} className={`mt-6 text-[15px] ${c.body} italic`}>
            [<a href={match[2]} className="text-primary hover:underline">{match[1]}</a>]
          </p>
        );
        i++;
        continue;
      }
    }

    if (/^\d+\.\s/.test(line)) {
      elements.push(<p key={i} className={`text-[16px] ${c.body} leading-relaxed my-2`} dangerouslySetInnerHTML={{ __html: inlineMd(line.replace(/^\d+\.\s/, ''), c.strong) }} />);
      i++;
      continue;
    }

    if (line.trim() === '') {
      // Collapse any run of blank lines into a single small spacer so extra
      // newlines in the source never stack up into large empty gaps.
      const start = i;
      while (i < lines.length && lines[i].trim() === '') i++;
      elements.push(<div key={start} className="h-2.5" />);
      continue;
    }

    elements.push(<p key={i} className={`text-[16px] ${c.body} leading-relaxed my-1.5`} dangerouslySetInnerHTML={{ __html: inlineMd(line, c.strong) }} />);
    i++;
  }

  // flow-root contains floated images so they can never spill past the
  // article into the CTA/footer below.
  return <div className="prose-custom flow-root">{elements}</div>;
}
