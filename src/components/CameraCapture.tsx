'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraCapabilities {
  width: number;
  height: number;
}

export default function CameraCapture() {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraCapabilities, setCameraCapabilities] = useState<CameraCapabilities | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices.map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`
        })));
        
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError('Failed to enumerate cameras');
        console.error('Error enumerating cameras:', err);
      }
    };

    getCameras();
  }, []);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1920 }, // Request maximum resolution
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Get camera capabilities
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      console.log(capabilities);
      if (capabilities.width && capabilities.height) {
        setCameraCapabilities({
          width: capabilities.width.max || 1920,
          height: capabilities.height.max || 1080
        });
      }

    } catch (err) {
      setError('Failed to start camera');
      console.error('Error starting camera:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCamera, stream]);

  // Start camera stream when camera is selected
  useEffect(() => {
    if (selectedCamera) {
      startCamera();
    }
  }, [selectedCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas to maximum camera resolution
    if (cameraCapabilities) {
      canvas.width = cameraCapabilities.width;
      canvas.height = cameraCapabilities.height;
    } else {
      // Fallback to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw the video frame to canvas at maximum resolution
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(imageDataUrl);
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.download = `camera-capture-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = capturedImage;
    link.click();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Camera Selection */}
      <div className="mb-6">
        <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Camera
        </label>
        <select
          id="camera-select"
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {cameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label}
            </option>
          ))}
        </select>
      </div>

      {/* Camera Capabilities Display */}
      {cameraCapabilities && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Maximum Resolution: {cameraCapabilities.width} × {cameraCapabilities.height}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Camera View */}
      <div className="mb-6">
        {!capturedImage ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-96 bg-gray-900 rounded-lg object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-lg">Starting camera...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-96 bg-gray-900 rounded-lg object-contain"
            />
          </div>
        )}
      </div>

      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!capturedImage ? (
          <>
            <button
              onClick={capturePhoto}
              disabled={!stream || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📸 Take Photo
            </button>
            <button
              onClick={stopCamera}
              disabled={!stream}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              🛑 Stop Camera
            </button>
          </>
        ) : (
          <>
            <button
              onClick={downloadPhoto}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              💾 Download Photo
            </button>
            <button
              onClick={retakePhoto}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Retake Photo
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">Instructions:</h3>
                 <ul className="text-sm text-gray-600 space-y-1">
           <li>• Select your preferred camera from the dropdown</li>
           <li>• The camera will automatically start at maximum resolution</li>
           <li>• Click &quot;Take Photo&quot; to capture an image</li>
           <li>• Download the photo or retake if needed</li>
           <li>• Photos are captured at the camera&apos;s native maximum resolution</li>
         </ul>
      </div>
    </div>
  );
}
