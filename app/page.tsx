import Map from '@/components/Map'
import { SignedIn, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <div className="absolute top-16 left-2 z-[50]">
        <SignedIn>
          <UserButton />
        </SignedIn>

        <div className=" mt-4">
          <Link href={'/restaurants/manage'} prefetch={false} className="bg-gray-300 text-black rounded p-2">
            Add restaurant
          </Link>
        </div>
      </div>
      <Map />
    </div>
  )
}
