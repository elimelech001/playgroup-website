export interface FileEntry {
  name: string;
  lastModified: Date;
  handle: FileSystemFileHandle;
}

export interface FolderNode {
  name: string;
  handle: FileSystemDirectoryHandle;
  files: FileEntry[];
  subfolders: FolderNode[];
}

export class FileSystemError extends Error {
  type: 'expired' | 'permission' | 'notFound';

  constructor(type: 'expired' | 'permission' | 'notFound', message: string, cause?: unknown) {
    super(message);
    this.name = 'FileSystemError';
    this.type = type;
    if (cause) {
      this.cause = cause;
    }
  }
}

let _directoryHandle: FileSystemDirectoryHandle | null = null;

const LAST_FOLDER_KEY = 'gan:lastNewsletterFolder';

// IndexedDB helpers for persisting the FileSystemDirectoryHandle across sessions
const IDB_NAME = 'gan-website';
const IDB_STORE = 'handles';
const IDB_KEY = 'newsletterFolder';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Non-fatal — session will just require re-picking
  }
}

async function loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function clearHandleFromIDB(): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Non-fatal
  }
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls']);

export function getCurrentHandle(): FileSystemDirectoryHandle | null {
  return _directoryHandle;
}

export async function getFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'read' });
    _directoryHandle = handle;
    localStorage.setItem(LAST_FOLDER_KEY, handle.name);
    await saveHandleToIDB(handle);
    return handle;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null;
    }
    throw new FileSystemError('permission', 'Permission to access the folder was denied.', err);
  }
}

/**
 * Try to restore the previously selected folder from IndexedDB.
 * Returns true if the handle was restored and permission is still granted.
 */
export async function restoreFolderHandle(): Promise<boolean> {
  const handle = await loadHandleFromIDB();
  if (!handle) return false;
  const ok = await verifyHandle(handle);
  if (ok) {
    _directoryHandle = handle;
    return true;
  }
  return false;
}

export async function verifyHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      return true;
    }
    if (permission === 'prompt') {
      const requested = await handle.requestPermission({ mode: 'read' });
      return requested === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

/** Recursively scan a directory handle and return a FolderNode tree. */
export async function scanFolder(handle: FileSystemDirectoryHandle): Promise<FolderNode> {
  return scanFolderRecursive(handle, handle.name);
}

async function scanFolderRecursive(
  handle: FileSystemDirectoryHandle,
  name: string
): Promise<FolderNode> {
  const files: FileEntry[] = [];
  const subfolders: FolderNode[] = [];

  try {
    for await (const [entryName, entry] of handle.entries()) {
      if (entry.kind === 'directory') {
        const sub = await scanFolderRecursive(
          entry as FileSystemDirectoryHandle,
          entryName
        );
        // Only include non-empty folders (files or nested subfolders)
        if (sub.files.length > 0 || sub.subfolders.length > 0) {
          subfolders.push(sub);
        }
      } else if (entry.kind === 'file') {
        const ext = entryName.substring(entryName.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) continue;
        const file = await (entry as FileSystemFileHandle).getFile();
        files.push({
          name: entryName,
          lastModified: new Date(file.lastModified),
          handle: entry as FileSystemFileHandle,
        });
      }
    }
  } catch (err) {
    const error = err as DOMException;
    if (error.name === 'NotFoundError') {
      throw new FileSystemError('notFound', 'The folder could not be found. It may have been moved or deleted.', err);
    }
    if (error.name === 'NotAllowedError') {
      throw new FileSystemError('expired', 'Permission to access the folder has expired.', err);
    }
    throw new FileSystemError('expired', 'Failed to read the folder contents.', err);
  }

  // Sort files newest-first, subfolders alphabetically
  files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  subfolders.sort((a, b) => a.name.localeCompare(b.name));

  return { name, handle, files, subfolders };
}

export async function getFileBlob(fileHandle: FileSystemFileHandle): Promise<{ file: File; url: string }> {
  let file: File;
  try {
    file = await fileHandle.getFile();
  } catch (err) {
    throw new FileSystemError('expired', 'Could not read the file. Permission may have expired.', err);
  }
  const url = URL.createObjectURL(file);
  return { file, url };
}

export async function downloadFile(fileHandle: FileSystemFileHandle): Promise<void> {
  const { file, url } = await getFileBlob(fileHandle);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function getFilePath(fileHandle: FileSystemFileHandle): Promise<string[]> {
  const root = _directoryHandle;
  if (!root) return [fileHandle.name];
  try {
    const segments = await root.resolve(fileHandle);
    return segments ?? [fileHandle.name];
  } catch {
    return [fileHandle.name];
  }
}

export async function openFile(fileHandle: FileSystemFileHandle): Promise<void> {
  const { url } = await getFileBlob(fileHandle);
  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newTab) {
    await downloadFile(fileHandle);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function getLastFolderName(): string | null {
  return localStorage.getItem(LAST_FOLDER_KEY);
}

export function clearFolderHandle(): void {
  _directoryHandle = null;
  void clearHandleFromIDB();
  localStorage.removeItem(LAST_FOLDER_KEY);
}
