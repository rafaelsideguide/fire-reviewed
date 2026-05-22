'use client'

import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-black text-white leading-tight mb-6 mt-2 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-black text-orange-400 mt-10 mb-4 uppercase tracking-wide border-b border-orange-900 pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-gray-200 mt-6 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-300 leading-relaxed mb-5 text-base">
      {children}
    </p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-4 border-orange-500 pl-6 py-1">
      <div className="text-xl text-orange-200 italic font-medium leading-relaxed">
        {children}
      </div>
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-bold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-orange-300 not-italic font-medium">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 space-y-2 ml-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 space-y-2 ml-4 list-decimal marker:text-orange-500">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-300 leading-relaxed flex gap-3">
      <span className="text-orange-500 mt-1.5 flex-shrink-0 text-xs">▸</span>
      <span>{children}</span>
    </li>
  ),
  hr: () => (
    <div className="my-10 flex items-center gap-4">
      <div className="flex-1 h-px bg-gray-800" />
      <span className="text-gray-700 text-xs tracking-widest uppercase">◆</span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  ),
  code: ({ children }) => (
    <code className="bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-400 underline underline-offset-2 hover:text-orange-300 transition-colors"
    >
      {children}
    </a>
  ),
}

interface Props {
  content: string | null
  onClose: () => void
}

export default function BlogPost({ content, onClose }: Props) {
  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          className="fixed inset-0 z-40 bg-gray-950 overflow-auto"
        >
          <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="flex items-center justify-between mb-10">
              <div className="text-xs text-gray-600 uppercase tracking-widest font-bold">
                Peer Reviewed — Investigation Report
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-white transition-colors text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="mb-8 inline-block bg-red-950 border border-red-800 text-red-400 text-xs font-bold px-3 py-1 rounded tracking-widest uppercase">
              AI Convinced ✓
            </div>

            <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
