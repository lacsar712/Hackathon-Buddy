import { useState, useRef } from 'react';

/**
 * TagInput - lets users type comma-separated tags and see them as chips
 * Props: tags (array), onChange (fn), suggestions (array), placeholder
 */
export default function TagInput({ tags = [], onChange, suggestions = [], placeholder = 'Add tag...' }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const addTags = (inputString) => {
    // Split by comma, trim each tag, remove empty strings and duplicates
    const newTags = inputString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '' && !tags.includes(tag));

    if (newTags.length > 0) {
      onChange([...tags, ...newTags]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTags(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    // Add remaining input as tags when blurring
    if (input.trim()) {
      addTags(input);
    }
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div className="relative">
      <div 
        className="input flex flex-wrap gap-1 min-h-[42px] cursor-text items-center" 
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="tag flex items-center gap-1 bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded text-xs border border-indigo-700/50">
            {tag}
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }} 
              className="text-indigo-400 hover:text-white ml-1 font-bold"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKey}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent outline-none text-sm flex-1 min-w-[120px] text-gray-100 placeholder-gray-500 py-1"
        />
      </div>
      {showSuggestions && input && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTags(s); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
