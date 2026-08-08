import React from 'react';
import clsx from 'clsx';

export function MarkdownViewer({ content = '', className }) {
  // Simple markdown renderer for completion - in production use react-markdown
  const renderContent = (md) => {
    if (!md) return null;
    return md
      .replace(
        /^### (.*$)/gim,
        '<h3 className="text-xl font-semibold mt-4 mb-2 text-white">$1</h3>'
      )
      .replace(/^## (.*$)/gim, '<h2 className="text-2xl font-bold mt-6 mb-3 text-white">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 className="text-3xl font-bold mt-8 mb-4 text-white">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong className="font-bold text-white">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em className="italic">$1</em>')
      .replace(
        /\[(.*)\]\((.*)\)/gim,
        '<a href="$2" className="text-primary hover:underline">$1</a>'
      )
      .replace(/\n/gim, '<br />');
  };

  return (
    <div
      className={clsx('prose prose-invert prose-neutral max-w-none text-neutral-300', className)}
      dangerouslySetInnerHTML={{ __html: renderContent(content) }}
    />
  );
}
