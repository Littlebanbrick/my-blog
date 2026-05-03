import { useState, useRef, useEffect } from 'react';

const COMMANDS = {
  help: {
    description: 'Show all available commands',
    handler: () =>
      `Available commands:\n` +
      `  help     - Show this message\n` +
      `  whoami   - Display information about the blog owner\n` +
      `  clear    - Clear the terminal screen\n`
  },
  whoami: {
    description: 'Who is the blog owner',
    handler: () =>
      `Name: Johnny Wang\n` +
      `Motto: Be unique, be yourself, be a monster!\n` +
      `Location: Hangzhou, China\n` +
      `GitHub: https://github.com/Littlebanbrick`
  },
  clear: {
    description: 'Clear the terminal',
    handler: () => null  // 特殊标记
  }
};

function CliChatBot() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', text: 'Welcome to Littlebanbrick CLI ChatBot.' },
    { type: 'output', text: 'Type "help" for available commands.' }
  ]);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // 自动聚焦输入框
    inputRef.current?.focus();
    // 滚动到底部
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [history]);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    // 添加用户输入到历史
    setHistory(prev => [...prev, { type: 'input', text: `Littlebanbrick $ ${cmd}` }]);

    if (COMMANDS[trimmed]) {
      const result = COMMANDS[trimmed].handler();
      if (result === null) {
        // clear 命令：清空终端
        setHistory([]);
        return;
      }
      setHistory(prev => [...prev, { type: 'output', text: result }]);
    } else {
      setHistory(prev => [...prev, { type: 'output', text: `What do you mean? Ask "help" for help!` }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    handleCommand(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <section className="section has-navbar-fixed-top" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="terminal-window" style={{ backgroundColor: '#111', borderRadius: '8px', padding: '0', overflow: 'hidden', boxShadow: '0 0 20px rgba(0,255,0,0.1)' }}>
        {/* 标题栏 - Windows PowerShell 风格 */}
        <div style={{
            backgroundColor: '#012456',    // Windows 深蓝
            padding: '0.4rem 1rem',
            display: 'flex',
            alignItems: 'center',
            fontFamily: "'Cascadia Code', monospace"
            }}>
        <span style={{ color: '#fff', fontSize: '0.9rem' }}>Windows PowerShell</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.8rem' }}>
            <span style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: 1, cursor: 'default', userSelect: 'none' }}>─</span>
            <span style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: 1, cursor: 'default', userSelect: 'none' }}>□</span>
            <span style={{ color: '#ccc', fontSize: '0.75rem', lineHeight: 1, cursor: 'default', userSelect: 'none' }}>✕</span>
        </div>
        </div>
          {/* 终端内容区 */}
            <div
            ref={terminalRef}
            style={{
                padding: '1rem',
                height: 'calc(100vh - 12rem)',
                overflowY: 'auto',
                fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                color: '#0f0',
                fontSize: '0.95rem',
                lineHeight: '1.6'
            }}
            onClick={() => inputRef.current?.focus()}
            >
            {history.map((item, index) => (
              <div key={index} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: item.type === 'input' ? '#0f0' : '#aaa' }}>
                {item.text}
              </div>
            ))}
            {/* 输入行 */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ color: '#0f0' }}>Littlebanbrick $&nbsp;</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0f0',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  caretColor: '#0f0'
                }}
                autoFocus
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CliChatBot;