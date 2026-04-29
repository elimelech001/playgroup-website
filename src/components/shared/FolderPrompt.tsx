interface FolderPromptProps {
  message: string;
  buttonLabel: string;
  onAction: () => void;
}

export function FolderPrompt({ message, buttonLabel, onAction }: FolderPromptProps) {
  return (
    <div
      role="status"
      className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex items-center justify-between gap-4"
    >
      <p className="text-sm">{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
