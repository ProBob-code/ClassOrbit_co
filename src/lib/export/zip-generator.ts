import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ExportFile {
  name: string;
  url?: string;
  content?: string;
}

export async function exportLessonPackage(
  folderName: string,
  files: ExportFile[],
  onProgress?: (progress: number) => void
) {
  const zip = new JSZip();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.url) {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
      } catch {
        // If fetch fails, add a placeholder
        zip.file(file.name, `[Failed to download: ${file.url}]`);
      }
    } else if (file.content) {
      zip.file(file.name, file.content);
    }

    onProgress?.(((i + 1) / total) * 100);
  }

  // Add manifest
  const manifest = {
    folderName,
    fileCount: files.length,
    exportedAt: new Date().toISOString(),
    files: files.map((f) => f.name),
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName.replace(/\s+/g, '_')}_teaching_package.zip`);
}
