import FloatingChat from '@/components/FloatingChat'
import Map from '@/components/Map'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Map />
      <div className="z-10">
        <FloatingChat />
      </div>
    </div>
  )
}
