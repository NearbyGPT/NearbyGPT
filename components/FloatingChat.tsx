'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LocateFixed, Send } from 'lucide-react'
import { Input } from './ui/input'
import { useParams } from 'next/navigation'
import useGeneralStore from '@/store/generalStore'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export default function FloatingChat() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const params = useParams() as { id?: string }
  const resturantId = params?.id

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const flyToLocation = useGeneralStore((s) => s.flyToLocation)
  const setUserLocation = useGeneralStore((s) => s.setUserLocation)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const toggleSheet = () => setIsExpanded((prev) => !prev)

  // load persisted chat
  useEffect(() => {
    const key = resturantId ? `chat-resturant-${resturantId}` : 'chat-floating'
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          messages?: Message[]
          sessionId?: string | null
        }
        if (parsed.messages) setMessages(parsed.messages)
        if (parsed.sessionId) setSessionId(parsed.sessionId)
      }
    } catch {
      /* ignore */
    }
  }, [resturantId])

  // persist chat
  useEffect(() => {
    const key = resturantId ? `chat-resturant-${resturantId}` : 'chat-floating'
    try {
      localStorage.setItem(key, JSON.stringify({ messages, sessionId }))
    } catch {
      /* ignore */
    }
  }, [messages, sessionId, resturantId])

  // scroll to show the user's last message and the assistant reply below it
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const count = container.children.length
    if (count === 0) return

    const targetIndex = Math.max(0, count - 2)
    const target = container.children[targetIndex] as HTMLElement
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [messages.length])

  // collapse on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const chat = document.getElementById('floating-chat')
      if (chat && !chat.contains(e.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const newMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')
    setLoading(true)

    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/chat`

      const body: { message: string; resturantId?: string; session_id?: string } = {
        message: newMessage.text,
      }
      if (resturantId) body.resturantId = resturantId
      if (sessionId) body.session_id = sessionId

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`)
      }

      const data = (await res.json()) as {
        message?: string
        response?: string
        session_id?: string
      }

      if (data.session_id && !sessionId) setSessionId(data.session_id)

      const assistantText = data.message ?? data.response
      if (assistantText) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: assistantText,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      id="floating-chat"
      className="fixed left-1/2 w-full max-w-4xl rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-8 text-[var(--color-dark)] shadow-[0_-20px_60px_rgba(44,62,80,0.16)]"
      style={{
        bottom: 0,
        transform: `translate(-50%, ${isExpanded ? '0' : 'calc(100% - 63px)'})`,
        transition: 'transform 300ms ease',
        height: messages.length > 0 ? '50vh' : 'auto',
      }}
    >
      <div className="relative">
        <button
          type="button"
          className="absolute -top-18 -right-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-lg transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)]"
          onClick={(e) => {
            e.stopPropagation()
            if (navigator.geolocation && flyToLocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords
                  // Store user location in state
                  setUserLocation({ latitude, longitude })
                  // Fly to location on map
                  flyToLocation(longitude, latitude)
                },
                (err) => {
                  toast(`${err.message}`)
                },
                { enableHighAccuracy: true }
              )
            }
          }}
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      </div>

      {/* Handle */}
      <button
        type="button"
        className="mx-auto mb-4 block h-2 w-12 cursor-pointer rounded-full bg-[var(--color-gray)]/30"
        onClick={toggleSheet}
        aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
      ></button>

      <div className="flex items-center gap-x-2 mb-3">
        <span role="img" aria-label="waving hand" className="text-[20px] animate-wave">
          👋
        </span>

        <h3 className="text-lg font-medium text-[var(--color-dark)]">What&apos;s on your mind?</h3>
      </div>

      {/* Messages container */}
      <div className="mb-3 max-h-[70vh] overflow-y-auto pr-2">
        <div ref={scrollRef} className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-[80%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[var(--color-secondary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-dark)]'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-[var(--color-dark)]">{m.text}</div>
                ) : (
                  <div>{m.text}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-3 py-2">
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]"
                  style={{ animationDelay: '-0.3s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]"
                  style={{ animationDelay: '-0.15s' }}
                />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your question"
          className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-background-light)] pr-16 text-[var(--color-dark)] placeholder:text-[var(--color-gray)]"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-[var(--color-primary)] text-white shadow-md transition-colors hover:bg-[var(--color-primary-dark)]"
            onClick={handleSend}
            disabled={loading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
