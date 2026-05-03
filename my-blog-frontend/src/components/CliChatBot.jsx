import { useState, useRef, useEffect } from 'react';

const COMMANDS = {
  help: {
    handler: () =>
      `Available commands:\n` +
      `  help     - Show this message\n` +
      `  whoami   - Display information about the blog owner\n` +
      `  clear    - Clear the terminal screen\n`
  },
  whoami: {
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
    handler: () => null   // 特殊标记，清屏
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
  const contentRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd) => {
    const trimmed = cmd.trim();
    if (trimmed === '') return;
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setHistory(prev => [...prev, { type: 'input', text: `Littlebanbrick $ ${trimmed}` }]);

    const lower = trimmed.toLowerCase();
    if (COMMANDS[lower]) {
      const result = COMMANDS[lower].handler();
        if (result === null) {
        setHistory([
            { type: 'output', text: 'Welcome to my CLI ChatBot.' },
            { type: 'output', text: 'Type "help" for available commands.' }
        ]);
        setInput('');
        setCommandHistory([]);
        setHistoryIndex(-1);
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
    <div className="cli-fullscreen">
      {/* 背景装饰 */}
      <div className="cli-bg-grid" />
      <div className="cli-circle-container">
        <div className="cli-circle" id="cli-circle1" />
        <div className="cli-circle" id="cli-circle2" />
        <div className="cli-circle" id="cli-circle3" />
      </div>

      {/* 终端主体 */}
      <div className="cli-terminal">
        {/* 窗口按钮 */}
        <div className="cli-terminal-header">
          <span className="cli-dot cli-dot-red" />
          <span className="cli-dot cli-dot-yellow" />
          <span className="cli-dot cli-dot-green" />
        </div>

        {/* 输出历史 */}
        <div className="cli-terminal-content" ref={contentRef}>
          {history.map((item, idx) => (
            <div
              key={idx}
              className={`cli-line ${item.type === 'input' ? 'cli-input-line' : 'cli-output-line'}`}
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* 输入行 */}
        <form className="cli-prompt" onSubmit={handleSubmit}>
        <span className="cli-username">/littlebanbrick</span>
        <span className="cli-separator">$</span>
        <span className="cli-input-container">
            <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="cli-input"
            autoFocus
            spellCheck="false"
            />
        </span>
        </form>
      </div>
    </div>
  );
}

export default CliChatBot;