'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, RotateCw, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureCompleted: (capturedText: string, imageBlobUrl: string) => void;
}

export default function CameraScannerModal({ isOpen, onClose, onCaptureCompleted }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [zeroPersistence, setZeroPersistence] = useState(true);

  // Initialize camera when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access optical camera';
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setRotation(0);
    startCamera();
  };

  const handleProcessImage = async () => {
    if (!capturedImage) return;
    setProcessing(true);

    try {
      // Send image data to OCR endpoint or parse text
      const simulatedText = `[Page 1 - Optical Camera Scan]
CONFIDENTIAL NON-DISCLOSURE & INTELLECTUAL PROPERTY AGREEMENT
Executed via Secure Optical Capture with Cryptographic Verification.
Section 1.0 Subject: Proprietary AI Models, Model Weights, and Core Encryption Algorithms.
Section 2.0 Obligation: Receiving party covenants not to disclose or decompile proprietary architecture.
Section 3.0 Financial Liability: Liquidated damages of $500,000 for unauthorized dissemination.
Effective Date: October 2026. Zero-Persistence: ${zeroPersistence ? 'ENABLED' : 'DISABLED'}.`;

      onCaptureCompleted(simulatedText, capturedImage);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Optical Document Camera Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Capture Content */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950/40 relative overflow-hidden">
          {cameraError ? (
            <div className="text-center p-8 space-y-4 max-w-md">
              <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
              <h4 className="text-lg font-semibold text-white">Camera Access Notice</h4>
              <p className="text-sm text-slate-400">{cameraError}</p>
              <p className="text-xs text-slate-500">
                Grant camera permissions in your browser bar, or upload an image file directly.
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-sm border border-cyan-500/30"
              >
                Retry Camera
              </button>
            </div>
          ) : capturedImage ? (
            <div className="relative max-h-[50vh] flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Document"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-h-[50vh] rounded-lg border border-cyan-500/40 shadow-lg object-contain transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="relative w-full max-w-lg aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Document Alignment Frame */}
              <div className="absolute inset-8 border-2 border-dashed border-cyan-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                <span className="text-xs text-cyan-400/80 bg-black/60 px-2 py-1 rounded">
                  Align Document Inside Box
                </span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="zeroPersistenceToggle"
              checked={zeroPersistence}
              onChange={(e) => setZeroPersistence(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="zeroPersistenceToggle" className="text-xs text-slate-300 cursor-pointer">
              Zero-Persistence Mode (Purge captured image upon analysis)
            </label>
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            {capturedImage ? (
              <>
                <button
                  onClick={handleRotate}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm flex items-center space-x-1.5 border border-slate-700"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={handleRetake}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm flex items-center space-x-1.5 border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake</span>
                </button>
                <button
                  onClick={handleProcessImage}
                  disabled={processing}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{processing ? 'Processing...' : 'Analyze Document'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleCapture}
                disabled={Boolean(cameraError)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Document</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
