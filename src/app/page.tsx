'use client';

import CameraCapture from '@/components/CameraCapture';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Camera Capture App
          </h1>
          <p className="text-lg text-gray-600">
            Select your camera, take photos at maximum resolution, and download them instantly
          </p>
        </div>
        
        <CameraCapture />
      </div>
    </main>
  );
}
