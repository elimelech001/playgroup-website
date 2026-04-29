export function UnsupportedBrowserBlock() {
  return (
    <div className="fixed inset-0 bg-stone-50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-xl shadow-lg border border-stone-200 text-center">
        <div className="mb-6">
          <svg
            className="mx-auto mb-4 w-16 h-16 text-stone-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">
            דפדפן לא נתמך
          </h1>
          <p className="text-stone-500 text-sm mb-1">Unsupported Browser</p>
        </div>

        <p className="text-stone-700 mb-4 leading-relaxed">
          אפליקציה זו מצריכה <strong>Chrome</strong> או <strong>Edge</strong> בגרסה 110 ומעלה.
        </p>
        <p className="text-stone-500 text-sm mb-6">
          This app requires <strong>Google Chrome 110+</strong> or{' '}
          <strong>Microsoft Edge 110+</strong>.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://www.google.com/chrome/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 px-4 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
          >
            Download Google Chrome
          </a>
          <a
            href="https://www.microsoft.com/edge"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 px-4 bg-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-300 transition-colors"
          >
            Download Microsoft Edge
          </a>
        </div>

        <p className="mt-6 text-xs text-stone-400">
          גרסה נוכחית של הדפדפן שלך אינה תומכת ב-File System Access API הנדרש לאפליקציה.
        </p>
      </div>
    </div>
  );
}
