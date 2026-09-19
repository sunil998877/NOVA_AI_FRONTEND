import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef(null);
  const fakeProgressRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  const start = () => {
    setWidth(0);
    setVisible(true);
    let current = 0;
    fakeProgressRef.current = setInterval(() => {
      current += current < 70 ? 8 : current < 85 ? 2 : 0.3;
      if (current > 85) current = 85;
      setWidth(current);
    }, 100);
  };

  const finish = () => {
    if (fakeProgressRef.current) clearInterval(fakeProgressRef.current);
    setWidth(100);
    setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 400);
  };

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;

    timerRef.current = setTimeout(() => {
      start();
    }, 120);

    const finishTimer = setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      finish();
    }, 600);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(finishTimer);
      if (fakeProgressRef.current) clearInterval(fakeProgressRef.current);
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, #00a884, #34d399, #00a884)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite",
          boxShadow: "0 0 10px rgba(0, 168, 132, 0.7), 0 0 4px rgba(52, 211, 153, 0.5)",
          transition: width === 100 ? "width 300ms ease-out" : "width 200ms ease-out",
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
