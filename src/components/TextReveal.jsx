// Masked text reveal — vanilla CSS transform + IntersectionObserver, no external motion lib.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "./TextReveal.css";

export default function TextReveal({
  as: Tag = "span",
  children,
  splitBy = "words",
  delay = 0,
  stagger = 0.06,
  className = "",
  wordClassName = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  const words = useMemo(
    () => (typeof children === "string" ? children.split(/\s+/).filter(Boolean) : []),
    [children]
  );

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
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (typeof children !== "string") {
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    );
  }

  if (splitBy === "lines") {
    return (
      <Tag ref={ref} className={`text-reveal-mask text-reveal-mask--lines ${className}`}>
        <span
          className={`text-reveal-mask__unit ${visible ? "text-reveal-mask__unit--visible" : ""}`}
          style={{ transitionDelay: `${delay}s` }}
        >
          {children}
        </span>
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={`text-reveal-mask ${className}`}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          // Lo spazio va FUORI dal box a larghezza automatica: dentro,
          // il browser lo tratta come whitespace di fine riga e lo
          // azzera, incollando le parole (bug verificato in Chromium).
          <Fragment key={i}>
            <span className="text-reveal-mask__word-wrap">
              <span
                className={`text-reveal-mask__unit ${wordClassName} ${
                  visible ? "text-reveal-mask__unit--visible" : ""
                }`}
                style={{ transitionDelay: `${delay + i * stagger}s` }}
              >
                {word}
              </span>
            </span>
            {!isLast && " "}
          </Fragment>
        );
      })}
    </Tag>
  );
}
