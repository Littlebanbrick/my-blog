import { useState, useEffect, useRef } from "react";
import { authFetch } from "../utils";

function SongCard() {
  const [song, setSong] = useState(null);
  const containerRef = useRef(null);
  const apRef = useRef(null);

  useEffect(() => {
    authFetch("/api/song")
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.url) setSong(data.data);
      });
  }, []);

  useEffect(() => {
    if (!song || !containerRef.current) return;
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    const load = () => {
      if (window.APlayer) return Promise.resolve();
      return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/lib/APlayer.min.css";
        document.head.appendChild(link);
        const script = document.createElement("script");
        script.src = "/lib/APlayer.min.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });
    };

    load().then(() => {
      apRef.current = new window.APlayer({
        container: containerRef.current,
        fixed: false,
        autoplay: false,
        theme: "#1a365d",
        audio: [
          {
            name: song.title || "Music",
            artist: song.artist || "Unknown",
            url: song.url,
            cover: song.cover || "",
            lrc: song.lrc || "",
          },
        ],
      });

      setTimeout(() => {
        const musicInfoDiv = document.querySelector('.aplayer-info .aplayer-music');
        if (!musicInfoDiv) return;
        musicInfoDiv.innerHTML = '';

        const fullText = `${song.title} - ${song.artist}`;
        const gapWidth = '2rem';

        // 外层容器（限制宽度，隐藏溢出）
        const outer = document.createElement('div');
        outer.style.overflow = 'hidden';
        outer.style.whiteSpace = 'nowrap';
        outer.style.width = '100%';
        outer.style.marginTop = '-4px';

        // 内容包装器（总宽度为单份内容的两倍）
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-block';
        wrapper.style.whiteSpace = 'nowrap';

        // 构建两份内容：文本 + 空白
        const buildSegment = () => {
          const textSpan = document.createElement('span');
          textSpan.innerText = fullText;
          const gapSpan = document.createElement('span');
          gapSpan.style.display = 'inline-block';
          gapSpan.style.width = gapWidth;
          gapSpan.innerHTML = '&nbsp;';
          return [textSpan, gapSpan];
        };

        const [text1, gap1] = buildSegment();
        const [text2, gap2] = buildSegment();
        wrapper.appendChild(text1);
        wrapper.appendChild(gap1);
        wrapper.appendChild(text2);
        wrapper.appendChild(gap2);

        outer.appendChild(wrapper);
        musicInfoDiv.appendChild(outer);

        // 检测溢出并控制动画
        const checkOverflow = () => {
          if (wrapper.scrollWidth > outer.clientWidth) {
            wrapper.style.animation = 'marquee 15s linear infinite';
          } else {
            wrapper.style.animation = 'none';
          }
        };
        checkOverflow();

        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(outer);
        window.addEventListener('resize', checkOverflow);

        // 悬停暂停/恢复（不会瞬移）
        outer.addEventListener('mouseenter', () => {
          if (wrapper.style.animation !== 'none') {
            wrapper.style.animationPlayState = 'paused';
          }
        });
        outer.addEventListener('mouseleave', () => {
          if (wrapper.style.animation !== 'none') {
            wrapper.style.animationPlayState = 'running';
          }
        });

        apRef.current._marqueeCleanup = () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', checkOverflow);
        };
      }, 200);
    });

    return () => {
      if (apRef.current) {
        if (apRef.current._marqueeCleanup) apRef.current._marqueeCleanup();
        apRef.current.destroy();
      }
    };
  }, [song]);

  if (!song) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: "0.5rem" }}>
        <div ref={containerRef} style={{ minHeight: "90px" }} />
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default SongCard;