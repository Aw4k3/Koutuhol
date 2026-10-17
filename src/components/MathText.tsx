'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export default function MathText({ text, className = '' }: MathTextProps) {
  const parts = useMemo(() => {
    if (!text) return [];
    // Split by $$...$$ (display math) or $...$ (inline math)
    const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
    return text.split(regex).map((segment, index) => {
      if (segment.startsWith('$$') && segment.endsWith('$$')) {
        const math = segment.slice(2, -2).trim();
        const html = katex.renderToString(math, {
          displayMode: true,
          throwOnError: false,
          trust: false,
        });
        return <span key={index} className="block my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      if (segment.startsWith('$') && segment.endsWith('$')) {
        const math = segment.slice(1, -1).trim();
        const html = katex.renderToString(math, {
          displayMode: false,
          throwOnError: false,
          trust: false,
        });
        return <span key={index} className="inline-block mx-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <span key={index}>{segment}</span>;
    });
  }, [text]);

  return <span className={`leading-relaxed ${className}`}>{parts}</span>;
}