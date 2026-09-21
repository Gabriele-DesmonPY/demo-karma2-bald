import { useEffect, useRef, useState } from "react";
import "./LineReveal.css";

export default function LineReveal({
  as: Tag = "span",
  children,
  delay = 0,
  className = "",
  lineClassName = "",
  style,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const text = typeof children === "string" ? children : "";
  const isHeading = /^h[1-6]$/i.test(Tag);

  const lines = isHeading
    ? text.split(/\n|<br\s*\/?>/i).filter(Boolean)
    : [text];

  if (!text) {
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={`line-reveal ${className}`}
      style={{ "--line-reveal-delay": `${delay}ms`, ...style }}
    >
      {lines.map((line, i) => (
        <span key={i} className={`line-reveal__line ${lineClassName}`}>
          <span
            className={`line-reveal__inner ${
              visible ? "line-reveal__inner--visible" : ""
            }`}
          >
            {line.trim()}
          </span>
        </span>
      ))}
    </Tag>
  );
}
