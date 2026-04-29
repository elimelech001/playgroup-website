import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  pickNewDataFile,
  commitNewDataFile,
  openDataFile,
  restoreDataFile,
  getLastFileName,
  PersistenceError,
} from '@/lib/persistence';
import { hydrateStore } from '@/store';

interface DataFilePromptProps {
  onReady: () => void;
}

export function DataFilePrompt({ onReady }: DataFilePromptProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pending handle that needs overwrite confirmation
  const [pendingHandle, setPendingHandle] = useState<FileSystemFileHandle | null>(null);
  const lastFileName = getLastFileName();
  const isFirstRun = !lastFileName;
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function tryRestore() {
      try {
        const state = await restoreDataFile();
        if (state) {
          hydrateStore(state);
          onReady();
          return;
        }
      } catch { /* fall through to manual prompt */ }
      setLoading(false);
      setTimeout(() => primaryRef.current?.focus(), 0);
    }
    tryRestore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleOpenFile() {
    setLoading(true);
    setError(null);
    try {
      const state = await openDataFile();
      hydrateStore(state);
      onReady();
    } catch (err) {
      if (err instanceof PersistenceError && err.type === 'read') {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Could not open file.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFile() {
    setLoading(true);
    setError(null);
    setPendingHandle(null);
    try {
      const { handle, hasContent } = await pickNewDataFile();
      if (hasContent) {
        setPendingHandle(handle);
        setLoading(false);
      } else {
        await commitNewDataFile(handle);
        setLoading(false);
        onReady();
      }
    } catch (err) {
      if (err instanceof PersistenceError && err.type === 'write') {
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Could not create file.');
      }
      setLoading(false);
    }
  }

  async function handleConfirmOverwrite() {
    if (!pendingHandle) return;
    setLoading(true);
    setError(null);
    try {
      await commitNewDataFile(pendingHandle);
      setLoading(false);
      onReady();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not write file.');
      setLoading(false);
    }
  }

  function handleCancelOverwrite() {
    setPendingHandle(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <span className="animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Overwrite confirmation screen
  if (pendingHandle) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-sm border border-stone-200">
          <h1 className="text-xl font-semibold text-stone-800 mb-2">Overwrite existing file?</h1>
          <p className="text-stone-500 text-sm mb-4">
            The file <span className="font-medium text-stone-700">{pendingHandle.name}</span> already
            contains data. Creating a new data file here will permanently erase all existing content.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConfirmOverwrite}
              className="w-full bg-rose-600 text-white hover:bg-rose-700"
            >
              Yes, overwrite and start fresh
            </Button>
            <Button
              onClick={handleCancelOverwrite}
              variant="outline"
              className="w-full border-stone-300 text-stone-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-sm border border-stone-200">
        <h1 className="text-xl font-semibold text-stone-800 mb-2">
          {isFirstRun ? 'ברוכים הבאים לגן' : 'פתח את קובץ הנתונים'}
        </h1>

        {isFirstRun ? (
          <p className="text-stone-500 text-sm mb-6">
            Choose a location on your PC to save your kindergarten data.
          </p>
        ) : (
          <div className="mb-6 space-y-1">
            <p className="text-stone-500 text-sm">
              Your session data is saved locally. Re-open it to continue.
            </p>
            {lastFileName && (
              <p className="text-sm text-stone-700 font-medium bg-stone-50 border border-stone-200 rounded-md px-3 py-2 truncate">
                📄 {lastFileName}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-rose-600 text-sm mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {isFirstRun ? (
            <Button
              ref={primaryRef}
              onClick={handleCreateFile}
              disabled={loading}
              className="w-full bg-teal-700 text-white hover:bg-teal-800"
            >
              {loading ? 'Creating...' : 'Create Data File'}
            </Button>
          ) : (
            <>
              <Button
                ref={primaryRef}
                onClick={handleOpenFile}
                disabled={loading}
                className="w-full bg-teal-700 text-white hover:bg-teal-800"
              >
                {loading ? 'Opening...' : 'Open Data File'}
              </Button>
              <Button
                onClick={handleCreateFile}
                disabled={loading}
                variant="outline"
                className="w-full border-stone-300 text-stone-700"
              >
                Create New File
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
