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
`I enjoy creating small but practical projects, experimenting with new ideas, and improving my problem-solving skills through hands-on development. Recently, I've been exploring broader areas in computer science and llms while building a solid technical foundation.\n` +
`Hobbies\n` +
`Outside of academics, I have a strong interest in photography, where I enjoy capturing everyday moments and experimenting with composition and light.\n` +
`I love the scenery there in my hometown, Shenzhen (in Guangdong Province, China), which is a beautiful city with kind people around me.\n` +
`I also spend time playing games like Minecraft and KARDS, which are two of my few favorite games.\n` +
`I'm currently focused on learning, building, and gradually growing into a developer capable of creating meaningful and well-designed products.`
  },
  clear: {
    description: 'Clear the terminal',
    handler: () => null  // 特殊标记
  }
};

function CliChatBot() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', text: 'Welcome to my CLI ChatBot.' },
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
        {/* 标题栏 */}
          <div style={{ backgroundColor: '#333', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#ccc', fontSize: '0.9rem', fontFamily: 'monospace' }}>CLI ChatBot</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
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