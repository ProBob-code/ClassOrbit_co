// Lightweight markdown renderer for blog posts.
// Shared between the public blog post page and the admin blog preview so
// authors see exactly how a post will render before publishing.

const inlineMd = (text: string) =>
  text
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

const splitTableRow = (line: string) => line.split('|').slice(1, -1).map((c) => c.trim());

export default function BlogContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-display text-[20px] font-bold text-white mt-8 mb-3">{line.slice(4)}</h3>);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-display text-[26px] font-bold text-white mt-10 mb-4">{line.slice(3)}</h2>);
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
        <div key={i} className="my-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="bg-white/[0.04]">
                {header.map((cell, hi) => (
                  <th key={hi} className="px-4 py-3 font-bold text-white border-b border-border whitespace-nowrap" dangerouslySetInnerHTML={{ __html: inlineMd(cell) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-text-muted" dangerouslySetInnerHTML={{ __html: inlineMd(cell) }} />
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
      elements.push(<hr key={i} className="border-border my-8" />);
      i++;
      continue;
    }

    if (line.startsWith('*[')) {
      const match = line.match(/\*\[(.+?)\]\((.+?)\)\*/);
      if (match) {
        elements.push(
          <p key={i} className="mt-6 text-[15px] text-text-muted italic">
            [<a href={match[2]} className="text-primary hover:underline">{match[1]}</a>]
          </p>
        );
        i++;
        continue;
      }
    }

    if (/^\d+\.\s/.test(line)) {
      elements.push(<p key={i} className="text-[16px] text-text-muted leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: inlineMd(line.replace(/^\d+\.\s/, '')) }} />);
      i++;
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} className="h-3" />);
      i++;
      continue;
    }

    elements.push(<p key={i} className="text-[16px] text-text-muted leading-relaxed my-1.5" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />);
    i++;
  }

  return <div className="prose-custom">{elements}</div>;
}
