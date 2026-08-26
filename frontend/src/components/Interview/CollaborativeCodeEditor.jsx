import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Terminal, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python 3' },
  { id: 'cpp', name: 'C++' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
];

export function CollaborativeCodeEditor({
  code,
  language = 'javascript',
  onChange,
  onCursorMove,
  onLanguageChange,
  onRunCode,
  isExecuting = false,
  output = null,
  remoteCursors = {},
}) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  // Monaco mount handler
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Listen for cursor position and selection changes
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorMove) {
        const position = { lineNumber: e.position.lineNumber, column: e.position.column };
        const selection = editor.getSelection();
        onCursorMove(position, selection);
      }
    });
  };

  // Render remote cursor decorations inside Monaco Editor
  useEffect(() => {
    if (!editorRef.current || !window.monaco) return;

    const editor = editorRef.current;
    const monaco = window.monaco;

    const newDecorations = [];

    Object.entries(remoteCursors).forEach(([socketId, cursorData]) => {
      if (!cursorData || !cursorData.position) return;
      const { position, user, color = '#3b82f6' } = cursorData;

      newDecorations.push({
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + 1
        ),
        options: {
          className: `remote-cursor-${socketId.replace(/[^a-zA-Z0-9]/g, '')}`,
          hoverMessage: { value: `**${user?.name || 'Peer'}** (${user?.role || 'user'})` },
          beforeContentClassName: 'remote-cursor-line-indicator',
        },
      });
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [remoteCursors]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Editor Control Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Language:
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onRunCode && onRunCode(code)}
          disabled={isExecuting}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-md ${
            isExecuting
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/20 active:scale-95'
          }`}
        >
          {isExecuting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Pane */}
      <div className="flex-1 relative min-h-[350px]">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          theme="vs-dark"
          onChange={(val) => onChange && onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            lineNumbersMinChars: 3,
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 space-x-2 font-mono text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Initializing Monaco Editor...</span>
            </div>
          }
        />
      </div>

      {/* Console Output Drawer */}
      <div className="bg-slate-950 border-t border-slate-800 flex flex-col max-h-[220px]">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">CONSOLE OUTPUT</span>
          </div>

          {output && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {output.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className={output.success ? 'text-emerald-400' : 'text-rose-400'}>
                  {output.success ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{output.executionTimeMs}ms</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 font-mono text-xs overflow-y-auto min-h-[80px] max-h-[160px] bg-slate-950 text-slate-200">
          {isExecuting ? (
            <div className="flex items-center space-x-2 text-indigo-400 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running code in sandbox environment...</span>
            </div>
          ) : output ? (
            <div>
              {output.stdout && (
                <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">
                  {output.stdout}
                </pre>
              )}
              {output.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-1">
                  {output.stderr}
                </pre>
              )}
              {!output.stdout && !output.stderr && (
                <span className="text-slate-500 italic">Program executed with no console output.</span>
              )}
            </div>
          ) : (
            <span className="text-slate-600 italic">
              Click &quot;Run Code&quot; to execute your solution and see instant output here.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
