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
`Hi! It's Johnny here.\n` + 
`Keywords: Zhejiang Univ, Python, Computer Science, freshman, Photography, Minecraft, KARDS\n\n` +
`About Me\n` +
`I'm a freshman majoring in Computer Science at Zhejiang University. I started learning programming once I attended college and gradually developed a strong interest in building things with Python and exploring how software works under the hood.\n` +
`I enjoy creating small but practical projects, experimenting with new ideas, and improving my problem-solving skills through hands-on development. Recently, I've been exploring broader areas in computer science and llms while building a solid technical foundation.\n\n` +
`Hobbies\n` +
`Outside of academics, I have a strong interest in photography, where I enjoy capturing everyday moments and experimenting with composition and light.\n` +
`I love the scenery there in my hometown, Shenzhen (in Guangdong Province, China), which is a beautiful city with kind people around me.\n` +
`I also spend time playing games like Minecraft and KARDS, which are two of my few favorite games.\n\n` +
`I'm currently focused on learning, building, and gradually growing into a developer capable of creating meaningful and well-designed products.`
  },
  clear: {
    description: 'Clear the terminal',
    handler: () => null
  }
};

function CliChatBot() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', text: 'Welcome to my CLI ChatBot.' },
    { type: 'output', text: 'Type "help" for available commands.' }
  ]);

  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (trimmed === '') return;
    // 添加到命令历史
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    // 添加输入行到终端历史
    setHistory(prev => [...prev, { type: 'input', text: `Littlebanbrick $ ${trimmed}` }]);

    const lower = trimmed.toLowerCase();
    if (COMMANDS[lower]) {
      const result = COMMANDS[lower].handler();
      if (result === null) {
        // clear 命令
        setHistory([]);
        return;
      }
      setHistory(prev => [...prev, { type: 'output', text: result }]);
    } else {
      setHistory(prev => [...prev, { type: 'output', text: `What do you mean? Ask "help" for help!` }]);
    }
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCommand(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // 如果还没有历史记录，直接返回
      if (commandHistory.length === 0) return;
      let newIndex = historyIndex === -1 ? commandHistory.length - 1 : historyIndex - 1;
      if (newIndex < 0) newIndex = 0;
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex] || '');
      }
    }
  };

  return (
    <section
      className="has-navbar-fixed-top"
      style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 全屏终端窗口 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111',
          margin: 0,
          borderRadius: 0,
          boxShadow: 'none',
          height: 'calc(100vh - 3.25rem)'
        }}
      >
        {/* 标题栏 */}
        <div style={{ backgroundColor: '#333', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#ccc', fontSize: '0.9rem', fontFamily: 'monospace' }}>CLI ChatBot</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
        </div>
        </div>

        {/* 终端内容区（可滚动，隐藏滚动条） */}
        <div
          ref={terminalRef}
          className="cli-terminal-container"
          style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            fontFamily: "'Cascadia Code', 'Fira Code', monospace",
            color: '#0f0',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            wordBreak: 'break-word'
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((item, index) => (
            <div key={index} style={{ whiteSpace: 'pre-wrap', color: item.type === 'input' ? '#0f0' : '#aaa' }}>
              {item.text}
            </div>
          ))}
          {/* 输入行 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
            <span style={{ color: '#0f0', fontFamily: "'Cascadia Code', 'Fira Code', monospace" }}>Littlebanbrick $&nbsp;</span>
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
                fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                fontSize: '0.95rem',
                caretColor: '#0f0'
              }}
              autoFocus
            />
          </form>
        </div>
      </div>
    </section>
  );
}

export default CliChatBot;