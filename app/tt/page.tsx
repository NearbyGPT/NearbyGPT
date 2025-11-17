'use client'

import React, { useState } from 'react'
import { BottomSheet } from '@/components/BottomSheet'

export default function TtPage() {
  const [sheetOpen, setSheetOpen] = useState(true)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="space-y-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Bottom Sheet (App Router)</h1>
        <p className="text-sm text-slate-300">Drag the sheet handle up to maximize, drag down to minimize/close.</p>

        <button
          className="mt-4 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 shadow"
          onClick={() => setSheetOpen(true)}
        >
          Open sheet
        </button>
      </div>

      {sheetOpen && (
        <BottomSheet
          initialSnap={65} // start in "peek" mode
          snapPoints={[100, 65, 0]} // hidden / peek / full
          onClose={() => setSheetOpen(false)}
        >
          <h2 className="mt-2 text-lg font-semibold">Native-like bottom sheet 👋</h2>
          <p className="mt-2 text-sm text-gray-600">Behaves like a mobile app:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
            <li>Drag up to open fully</li>
            <li>Drag down to minimize or close</li>
            <li>Tap on the dark backdrop to close</li>
          </ul>

          <div className="mt-4 space-y-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                List item {i + 1}
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
