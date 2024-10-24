import React, { ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components: Components = {
    code: ({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children: ReactNode;
    }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-[80dvw] md:max-w-[500px] overflow-x-scroll bg-zinc-100 p-2 rounded mt-2 dark:bg-zinc-800`}
        >
          <code className={match[1]}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded`}
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ children, ...props }: { children: ReactNode }) => (
      <ol className="list-decimal list-outside ml-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: { children: ReactNode }) => (
      <li className="py-1" {...props}>
        {children}
      </li>
    ),
    ul: ({ children, ...props }: { children: ReactNode }) => (
      <ul className="list-disc list-outside ml-4" {...props}>
        {children}
      </ul>
    ),
    strong: ({ children, ...props }: { children: ReactNode }) => (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    ),
    a: ({ children, ...props }: { children: ReactNode }) => (
      <a
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);