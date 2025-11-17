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
  const userLocation = useGeneralStore((s) => s.userLocation)
  const activeChatPOI = useGeneralStore((s) => s.activeChatPOI)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const toggleSheet = () => setIsExpanded((prev) => !prev)

  // load persisted chat
  useEffect(() => {
    const businessId = activeChatPOI?.id || resturantId
    const key = businessId ? `chat-business-${businessId}` : 'chat-floating'
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
  }, [activeChatPOI?.id, resturantId])

  // persist chat
  useEffect(() => {
    const businessId = activeChatPOI?.id || resturantId
    const key = businessId ? `chat-business-${businessId}` : 'chat-floating'
    try {
      localStorage.setItem(key, JSON.stringify({ messages, sessionId }))
    } catch {
      /* ignore */
    }
  }, [messages, sessionId, activeChatPOI?.id, resturantId])

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

      const body: {
        message: string
        business_id?: string
        session_id?: string
        latitude?: number
        longitude?: number
        radius_meters?: number
        user_id?: string
      } = {
        message: newMessage.text,
      }

      // Use activeChatPOI id as business_id, fallback to resturantId from URL params
      const businessId = activeChatPOI?.id || resturantId
      if (businessId) body.business_id = businessId

      if (sessionId) body.session_id = sessionId
      if (userLocation) {
        body.latitude = userLocation.latitude
        body.longitude = userLocation.longitude
        body.radius_meters = 5000 // Default radius in meters
      }
      // Add user_id if needed (placeholder for now)
      body.user_id = 'user-default'

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
      className="fixed left-1/2 w-full max-w-4xl bg-[var(--color-dark)] text-white rounded-t-2xl p-4 pb-8"
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
          className="absolute -top-18 -right-4 bg-[var(--color-surface)] p-3 shadow-md hover:bg-[var(--color-background-light)] cursor-pointer"
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
          <LocateFixed className="text-[var(--color-dark)]" />
        </button>
      </div>

      {/* Handle */}
      <div className="w-12 h-2 bg-white/40 rounded-full mx-auto mb-4 cursor-pointer" onClick={toggleSheet}></div>

      <div className="flex items-center gap-x-2 mb-3">
        <span role="img" aria-label="waving hand" className="text-[20px] animate-wave">
          👋
        </span>

        <h3 className="text-white text-lg font-medium">What&apos;s on your mind?</h3>
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
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-2">
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
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
          className="w-full pr-16 bg-[var(--color-dark)] text-white placeholder-white/70 rounded-full border border-[var(--color-gray)]"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            className="!p-1.5 bg-transparent hover:!bg-transparent cursor-pointer"
            onClick={handleSend}
            disabled={loading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
