import { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle2, AlertCircle, Copy, Code2, Sparkles, TerminalSquare, Zap } from 'lucide-react';
import './index.css';

// Converts **bold** and *italic* markdown to JSX
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Replace **text** with <strong>
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={j}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
    return <span key={i}>{rendered}{i < lines.length - 1 ? <br /> : null}</span>;
  });
}

function SkeletonCard({ lines = 3 }) {
  return (
    <div className="glass-panel animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton-text ${i === 0 ? '' : i === lines - 1 ? 'short' : 'medium'}`}
        />
      ))}
    </div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <h3 className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={20} color="var(--accent-secondary)" /> {label}
    </h3>
  );
}

// Parse "Clarity: ████░░ 80%" style lines from score report
function parseVisualBars(report) {
  const barLines = [];
  const barRegex = /(Clarity|Context|Structure)\s*:\s*([\█░▓▒]+)\s*(\d+%)/gi;
  let match;
  while ((match = barRegex.exec(report)) !== null) {
    barLines.push({ label: match[1], bar: match[2], pct: parseInt(match[3]) });
  }
  return barLines;
}

function VisualBar({ label, pct }) {
  const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '100px',
          transition: 'width 1s ease',
          boxShadow: `0 0 6px ${color}`,
        }} />
      </div>
    </div>
  );
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef(null);
  const autocompleteTimeoutRef = useRef(null);

  useEffect(() => {
    if (!prompt.trim() || prompt.length < 5 || loading) {
      setSuggestion("");
      return;
    }
    if (autocompleteTimeoutRef.current) clearTimeout(autocompleteTimeoutRef.current);
    autocompleteTimeoutRef.current = setTimeout(async () => {
      setIsAutocompleting(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/autocomplete-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.suggestion && data.suggestion.trim().toLowerCase() !== prompt.trim().toLowerCase()) {
            setSuggestion(data.suggestion);
          } else {
            setSuggestion("");
          }
        }
      } catch (e) {
        console.error("Autocomplete error:", e);
      } finally {
        setIsAutocompleting(false);
      }
    }, 1000);
    return () => clearTimeout(autocompleteTimeoutRef.current);
  }, [prompt]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applySuggestion = () => {
    if (suggestion) {
      setPrompt(suggestion);
      setSuggestion("");
    }
  };

  const submitPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSuggestion("");
    try {
      const response = await fetch('http://127.0.0.1:8000/debug-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      if (!response.ok) {
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setResult(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to connect to the debugger backend.');
    } finally {
      setLoading(false);
    }
  };

  let scoreMatch = 0;
  let issuesList = [];
  let promptType = '';
  let visualBars = [];

  if (result && result.score_report) {
    const scoreReg = result.score_report.match(/Score:\s*(\d+)/i);
    scoreMatch = scoreReg ? parseInt(scoreReg[1]) : 0;

    const typeReg = result.score_report.match(/Prompt Type:\s*(.+)/i);
    promptType = typeReg ? typeReg[1].trim() : '';

    visualBars = parseVisualBars(result.score_report);

    const splitIssues = result.score_report.split(/Issues detected:|Strengths:/i);
    if (splitIssues.length > 1) {
      issuesList = splitIssues[1]
        .split('\n')
        .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(l => l.length > 3);
    }
  }

  const scorePercent = (scoreMatch / 10) * 100;
  const scoreColor = scorePercent > 70 ? 'var(--success)' : scorePercent > 40 ? 'var(--warning)' : 'var(--danger)';

  // Split examples by numbered patterns like "**1." or "\n1."
  const parseExamples = (text) => {
    if (!text) return [];
    // Split on numbered list patterns
    const chunks = text.split(/\n+(?=\*?\*?\d+\.\s|\d+\.\s)/g).filter(Boolean);
    return chunks.length > 1 ? chunks : [text];
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="hero-header">
        <Sparkles size={40} className="mb-2" color="var(--accent-primary)" style={{ animation: 'pulse 2s infinite' }} />
        <h1>AI Prompt <span className="gradient-text">Debugger</span></h1>
        <p className="hero-subtitle">
          Write prompts that actually work. Our RAG-powered engine scores, analyzes, and reconstructs your inputs using the best practices in AI engineering.
        </p>
        <div className="badge-row">
          <span className="badge"><Zap size={12} /> Local LLM</span>
          <span className="badge"><Sparkles size={12} /> RAG-Powered</span>
          <span className="badge"><CheckCircle2 size={12} /> MCP Tools</span>
        </div>
      </header>

      {/* Input Section */}
      <section className="glass-panel" style={{ zIndex: 10 }}>
        <div className="input-group">
          <SectionLabel icon={TerminalSquare} label="Your Prompt" />
          <div className="textarea-wrapper">
            <textarea
              className="prompt-input"
              placeholder="Paste your prompt here... e.g. 'Write a python script to parse CSV files.'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              spellCheck={false}
            />
            {(isAutocompleting || suggestion) && (
              <div
                className="suggestion-bubble"
                onClick={applySuggestion}
                title="Click to apply this suggestion"
              >
                <div className="suggestion-header">
                  <Sparkles size={14} />
                  {isAutocompleting ? <span className="loading-dots">AI is thinking</span> : "AI Suggestion"}
                </div>
                <div className="suggestion-content">
                  {isAutocompleting ? "..." : suggestion}
                </div>
                {!isAutocompleting && (
                  <div className="suggestion-footer">↵ Click to apply suggestion</div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
            {error && (
              <span style={{ color: 'var(--danger)', marginRight: 'auto', display: 'flex', gap: '5px', alignItems: 'center', fontSize: '0.9rem' }}>
                <AlertCircle size={16} /> {error}
              </span>
            )}
            <button
              className="btn-primary"
              onClick={submitPrompt}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <><span className="spinner"><Sparkles size={18} /></span> Analyzing...</>
              ) : (
                <><Play size={18} fill="currentColor" /> Debug Prompt</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Loading Skeletons */}
      {loading && !result && (
        <div className="results-grid" ref={resultsRef}>
          <SkeletonCard lines={7} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SkeletonCard lines={5} />
            <SkeletonCard lines={6} />
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {result && !loading && (
        <div className="results-grid" ref={resultsRef}>

          {/* Left: Score Card */}
          <div className="glass-panel score-card animate-fade-in-up" style={{ animationDelay: '0.1s', alignSelf: 'start' }}>
            <SectionLabel icon={CheckCircle2} label="Analysis" />

            {promptType && (
              <div className="prompt-type-badge">{promptType}</div>
            )}

            <div
              className="score-circle mt-4"
              style={{ '--score-deg': `${(scoreMatch / 10) * 360}deg`, '--accent-primary': scoreColor }}
            >
              {scoreMatch}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/10</span>
            </div>

            {/* Visual Bars */}
            {visualBars.length > 0 && (
              <div style={{ width: '100%', marginTop: '1.5rem' }}>
                {visualBars.map((b, i) => <VisualBar key={i} label={b.label} pct={b.pct} />)}
              </div>
            )}

            {/* Issues List */}
            {issuesList.length > 0 && (
              <div className="issues-list" style={{ marginTop: '1.5rem' }}>
                <ul style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  {issuesList.map((item, idx) => (
                    <li key={idx} style={{
                      borderLeftColor: item.includes('✅') || item.toLowerCase().includes('strength') ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details style={{ marginTop: '1.5rem', width: '100%', textAlign: 'left', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              <summary style={{ userSelect: 'none' }}>View Raw Score Report</summary>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.75rem', borderRadius: '6px', lineHeight: '1.6' }}>
                {result.score_report}
              </pre>
            </details>
          </div>

          {/* Right: Improved Prompt + Alternatives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Improved Prompt */}
            <div className="glass-panel animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <SectionLabel icon={Sparkles} label="Improved Prompt (RAG)" />
                <button
                  className="btn-icon"
                  onClick={() => handleCopy(result.improved_prompt)}
                  title="Copy to clipboard"
                  style={{ flexShrink: 0 }}
                >
                  {copied ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="content-block" style={{ marginTop: 0 }}>
                <div className="prompt-text">
                  {renderMarkdown(result.improved_prompt)}
                </div>
              </div>
            </div>

            {/* Alternative Templates */}
            <div className="glass-panel animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <SectionLabel icon={Code2} label="Alternative Templates" />
              <div style={{ marginTop: '1rem' }}>
                {parseExamples(result.examples).map((example, idx) => (
                  <div key={idx} className="example-item">
                    <div style={{ fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      Template {idx + 1}
                    </div>
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                      {renderMarkdown(example.replace(/^\*?\*?\d+\.\s*/, '').trim())}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default App;
