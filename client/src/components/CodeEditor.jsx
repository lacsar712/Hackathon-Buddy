import React from 'react';
import Editor from '@monaco-editor/react';

/**
 * Modern Monaco-based Code Editor
 */
export default function CodeEditor({ code, onChange, language = 'javascript', onCursorChange }) {
  const handleEditorChange = (value) => {
    if (onChange) onChange(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Custom theme for better integration
    monaco.editor.defineTheme('hb-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d0d15',
        'editor.lineHighlightBackground': '#1a1a25',
        'editorLineNumber.foreground': '#333345',
        'editorLineNumber.activeForeground': '#6366f1',
        'editorIndentGuide.background': '#1a1a25',
        'editor.selectionBackground': '#6366f133',
      },
    });
    
    monaco.editor.setTheme('hb-theme');

    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position);
      }
    });
  };

  return (
    <div className="h-full w-full bg-[#0d0d15]">
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: true, scale: 0.75, renderCharacters: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'none',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 20, bottom: 20 },
          folding: true,
          glyphMargin: false,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}
