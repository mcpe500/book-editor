import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User } from 'lucide-react'
import { useAIStore } from '../../stores/aiStore'
import { useBookStore } from '../../stores/bookStore'
import { useEditorStore } from '../../stores/editorStore'
import type { AIMessage } from '../../types'
import { renderMarkdown } from '../../lib/markdown'

export default function AIChatPanel() {
  const { isOpen, closePanel, currentConversation, streamingContent, isStreaming, sendMessage, cancelStreaming, selectOption } = useAIStore()
  const { currentBook, currentChapter } = useBookStore()
  const { setContent, content, cursorPosition } = useEditorStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages, streamingContent])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || !currentBook || !currentChapter) return
    const message = input.trim()
    setInput('')
    await sendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertAtCursor = (text: string) => {
    const before = content.slice(0, cursorPosition)
    const after = content.slice(cursorPosition)
    setContent(before + text + after)
  }

  const handleOptionSelect = (optionContent: string) => {
    insertAtCursor(optionContent)
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">AI Assistant</h2>
        </div>
        <button
          onClick={closePanel}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {!currentBook || !currentChapter ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <p>Select a book and chapter to start chatting</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {currentConversation?.messages.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Bot size={32} className="mx-auto mb-2 opacity-50" />
                <p>Ask me anything about your book!</p>
                <p className="text-sm mt-2">I can help with writing, editing, and brainstorming.</p>
              </div>
            )}

            {currentConversation?.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onOptionSelect={(messageId, optionLabel, optionContent) => {
                  handleOptionSelect(optionContent)
                  selectOption(messageId, optionLabel)
                }}
              />
            ))}

            {isStreaming && streamingContent && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Bot size={16} />
                  <span className="text-sm">Thinking...</span>
                </div>
                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {streamingContent}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            {isStreaming ? (
              <button
                onClick={cancelStreaming}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <X size={18} />
                Stop
              </button>
            ) : (
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the AI..."
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg resize-none bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: AIMessage
  onOptionSelect: (messageId: string, optionLabel: 'A' | 'B' | 'C', content: string) => void
}

function MessageBubble({ message, onOptionSelect }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const assistantHtml = !isUser ? renderMarkdown(message.content) : ''

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600 dark:text-slate-300" />}
        </div>

        <div className="space-y-2">
          <div className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div
                className="prose dark:prose-invert max-w-none prose-sm"
                dangerouslySetInnerHTML={{ __html: assistantHtml }}
              />
            )}
          </div>

          {message.options && message.options.length > 0 && (
            <div className="space-y-2">
              {message.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onOptionSelect(message.id, option.label, option.content)}
                  className={`w-full text-left rounded-lg px-4 py-3 border-2 transition-colors ${
                    option.selected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  <span className={`inline-block w-6 h-6 rounded-full text-center text-sm font-medium mr-2 ${
                    option.selected
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{option.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}