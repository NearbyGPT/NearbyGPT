import FloatingChat from '@/components/FloatingChat'
import Map from '@/components/Map'
import RestaurantPanel from '@/components/RestaurantPanel'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Map />
      <RestaurantPanel />
      <div className="z-10">
        <FloatingChat />
      </div>
    </div>
  )
}
