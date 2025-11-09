import Map from '@/components/Map'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* <div className="absolute top-16 left-2 z-[50]">
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div> */}
      <Map />
    </div>
  )
}
