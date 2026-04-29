import type { AppState } from '../types';

export class PersistenceError extends Error {
  type: 'read' | 'write' | 'corrupt';

  constructor(type: 'read' | 'write' | 'corrupt', message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
    this.type = type;
    if (cause) {
      this.cause = cause;
    }
  }
}

let _fileHandle: FileSystemFileHandle | null = null;

const LAST_FILE_KEY = 'gan:lastDataFile';

// IndexedDB helpers for persisting the FileSystemFileHandle across sessions
const IDB_NAME = 'gan-website';
const IDB_STORE = 'handles';
const IDB_KEY = 'dataFile';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToIDB(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* non-fatal */ }
}

async function loadHandleFromIDB(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

function emptyState(): AppState {
  return {
    version: 1,
    schoolYears: [],
    children: [],
    payments: [],
    calendar: null,
  };
}

function validateAppState(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) {
    throw new PersistenceError('corrupt', 'Data file is not a valid JSON object.');
  }

  const obj = raw as Record<string, unknown>;

  if (obj['version'] !== 1) {
    throw new PersistenceError('corrupt', `Unsupported data version: ${obj['version']}. Expected 1.`);
  }

  if (!Array.isArray(obj['schoolYears'])) {
    throw new PersistenceError('corrupt', 'Missing or invalid "schoolYears" array.');
  }

  if (!Array.isArray(obj['children'])) {
    throw new PersistenceError('corrupt', 'Missing or invalid "children" array.');
  }

  if (!Array.isArray(obj['payments'])) {
    throw new PersistenceError('corrupt', 'Missing or invalid "payments" array.');
  }

  if (obj['calendar'] !== null && typeof obj['calendar'] !== 'object') {
    throw new PersistenceError('corrupt', 'Invalid "calendar" field.');
  }

  return obj as unknown as AppState;
}

export function getLastFileName(): string | null {
  return localStorage.getItem(LAST_FILE_KEY);
}

export async function initDataFile(): Promise<void> {
  let handle: FileSystemFileHandle;

  try {
    handle = await window.showSaveFilePicker({
      suggestedName: 'gan-data.json',
      types: [
        {
          description: 'Kindergarten Data File',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
  } catch (err) {
    throw new PersistenceError('write', 'File picker was cancelled or denied.', err);
  }

  _fileHandle = handle;
  localStorage.setItem(LAST_FILE_KEY, handle.name);
  await saveHandleToIDB(handle);

  await saveData(emptyState());
}

export async function openDataFile(): Promise<AppState> {
  let handle: FileSystemFileHandle;

  try {
    const handles = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'Kindergarten Data File',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    handle = handles[0];
  } catch (err) {
    throw new PersistenceError('read', 'File picker was cancelled or denied.', err);
  }

  let text: string;
  try {
    const file = await handle.getFile();
    text = await file.text();
  } catch (err) {
    throw new PersistenceError('read', 'Could not read file contents.', err);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new PersistenceError('corrupt', 'Data file contains invalid JSON.', err);
  }

  const state = validateAppState(parsed);

  _fileHandle = handle;
  localStorage.setItem(LAST_FILE_KEY, handle.name);
  await saveHandleToIDB(handle);

  return state;
}

/**
 * Try to restore the previously opened data file from IndexedDB.
 * Returns the app state if successful, null if the handle is gone or permission denied.
 */
export async function restoreDataFile(): Promise<AppState | null> {
  const handle = await loadHandleFromIDB();
  if (!handle) return null;

  try {
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    let granted = permission === 'granted';
    if (!granted && permission === 'prompt') {
      const requested = await handle.requestPermission({ mode: 'readwrite' });
      granted = requested === 'granted';
    }
    if (!granted) return null;

    const file = await handle.getFile();
    const text = await file.text();
    const parsed = JSON.parse(text);
    const state = validateAppState(parsed);

    _fileHandle = handle;
    localStorage.setItem(LAST_FILE_KEY, handle.name);
    return state;
  } catch {
    return null;
  }
}

export async function loadData(): Promise<AppState> {
  if (!_fileHandle) {
    throw new PersistenceError('read', 'No data file is open. Call initDataFile() or openDataFile() first.');
  }

  let text: string;
  try {
    const file = await _fileHandle.getFile();
    text = await file.text();
  } catch (err) {
    throw new PersistenceError('read', 'Failed to read data file.', err);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new PersistenceError('corrupt', 'Data file contains invalid JSON.', err);
  }

  return validateAppState(parsed);
}

export async function saveData(state: AppState): Promise<void> {
  if (!_fileHandle) {
    throw new PersistenceError('write', 'No data file is open. Call initDataFile() or openDataFile() first.');
  }

  const json = JSON.stringify(state, null, 2);

  let writable: FileSystemWritableFileStream;
  try {
    writable = await _fileHandle.createWritable({ keepExistingData: false });
  } catch (err) {
    throw new PersistenceError('write', 'Failed to open file for writing.', err);
  }

  try {
    await writable.write(json);
    await writable.close();
  } catch (err) {
    try { await writable.close(); } catch { /* ignore */ }
    throw new PersistenceError('write', 'Failed to write data to file.', err);
  }
}

export function isFileOpen(): boolean {
  return _fileHandle !== null;
}

export function clearHandle(): void {
  _fileHandle = null;
  localStorage.removeItem(LAST_FILE_KEY);
  void (async () => {
    try {
      const db = await openIDB();
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
    } catch { /* non-fatal */ }
  })();
}
