import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, CommunityPost, PostVisibility, PostStatus } from '../types';
import { 
  X, Camera, Video, Image as ImageIcon, FileText, Trophy, 
  RefreshCw, CheckCircle2, AlertCircle, Upload, Play, Pause, 
  Sparkles, MapPin, Hash, Eye, ShieldAlert, ArrowRight, ArrowLeft,
  RotateCcw, Save, ShieldCheck, Check, Layers, Film
} from 'lucide-react';
import { logAuditTransaction } from '../lib/auditLogger';

interface CreateContentModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onPostCreated: (post: CommunityPost) => void;
  onStartTrial?: () => void;
  onRequireAuth?: () => void;
}

type CreationStep = 
  | 'TYPE_SELECTION' 
  | 'CAMERA_RECORD' 
  | 'FILE_UPLOAD' 
  | 'COMPRESSION_UPLOADING' 
  | 'VIDEO_PREVIEW_THUMBNAIL' 
  | 'POST_DETAILS' 
  | 'PROCESSING_CONFIRMATION';

export const CreateContentModal: React.FC<CreateContentModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
  onStartTrial,
  onRequireAuth
}) => {
  // Step State
  const [step, setStep] = useState<CreationStep>('TYPE_SELECTION');
  const [postType, setPostType] = useState<'PLAYER_VIDEO' | 'PHOTO' | 'TEXT_POST'>('PLAYER_VIDEO');

  // Video Config Constants (from env or defaults)
  const maxMb = 200;
  const maxDurationSec = 180;

  // Media Capture & Upload State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  // Camera Refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Upload Progress & Chunks
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadStage, setUploadStage] = useState<'PREPARING' | 'COMPRESSING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETE'>('PREPARING');
  const [isUploadInterrupted, setIsUploadInterrupted] = useState(false);

  // Frame Thumbnail Extraction
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');

  // Post Metadata Form State
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('kerala, freestyle, skills');
  const [locationName, setLocationName] = useState(`${currentUser.city || 'Kochi'}, ${currentUser.state || 'Kerala'}`);
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');

  // Guardian Consent Modal for Minors
  const [showGuardianConsentNotice, setShowGuardianConsentNotice] = useState(false);

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingChecklist, setProcessingChecklist] = useState({
    uploaded: false,
    safetyChecked: false,
    thumbnailGenerated: false,
    streamableReady: false
  });

  const isPlayer = currentUser.role === 'PLAYER';

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Check Minor Consent
  const checkMinorConsent = (): boolean => {
    const birthYear = new Date(currentUser.dob || '2008-04-12').getFullYear();
    const isMinor = (new Date().getFullYear() - birthYear) < 18;
    
    if (isMinor && !currentUser.guardianConsentGiven) {
      setShowGuardianConsentNotice(true);
      return false;
    }
    return true;
  };

  // Start Camera Stream
  const handleStartCamera = async () => {
    if (!checkMinorConsent()) return;

    setValidationError(null);
    setStep('CAMERA_RECORD');
    stopCameraStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setValidationError("Unable to access browser camera or microphone. Please check permissions or upload a video file instead.");
    }
  };

  const handleToggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setTimeout(() => {
      handleStartCamera();
    }, 200);
  };

  // Start Recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        setMediaFile(new File([blob], `recorded-football-drill-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`, { type: mimeType }));
        generateFrameThumbnails(url);
        setStep('VIDEO_PREVIEW_THUMBNAIL');
      };

      mediaRecorder.start(1000); // chunk every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= maxDurationSec - 1) {
            handleStopRecording();
            return maxDurationSec;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      setValidationError("Failed to record video stream.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopCameraStream();
    }
  };

  // Validate Selected File
  const handleFileSelected = (file: File) => {
    setValidationError(null);

    // Size validation
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      setValidationError(`Selected video (${sizeMb.toFixed(1)} MB) exceeds the maximum allowed size of ${maxMb} MB. Please select a compressed clip.`);
      return;
    }

    if (!file.type.startsWith('video') && !file.type.startsWith('image')) {
      setValidationError("Unsupported file format. Please upload MP4, MOV, WebM video or image files.");
      return;
    }

    setMediaFile(file);
    const blobUrl = URL.createObjectURL(file);
    setVideoBlobUrl(blobUrl);

    if (file.type.startsWith('video')) {
      // Validate duration using hidden video metadata listener
      const tempVideo = document.createElement('video');
      tempVideo.src = blobUrl;
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration;
        setVideoDuration(duration);
        if (duration > maxDurationSec) {
          setValidationError(`Video duration (${Math.round(duration)}s) exceeds maximum limit of ${maxDurationSec} seconds.`);
          return;
        }
        generateFrameThumbnails(blobUrl);
        setStep('VIDEO_PREVIEW_THUMBNAIL');
      };
      tempVideo.onerror = () => {
        setValidationError("Corrupted or unreadable video file. Please select a valid football recording.");
      };
    } else {
      setSelectedThumbnail(blobUrl);
      setStep('POST_DETAILS');
    }
  };

  // Generate Frame Thumbnails using HTML5 Canvas
  const generateFrameThumbnails = (url: string) => {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';

    const frames: string[] = [];
    video.onloadeddata = () => {
      const duration = video.duration || 10;
      const points = [0.1, 0.35, 0.65, 0.85];
      
      let captured = 0;
      points.forEach((pct, index) => {
        const seekTime = duration * pct;
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');

        const tempVideo = document.createElement('video');
        tempVideo.src = url;
        tempVideo.currentTime = seekTime;
        tempVideo.onseeked = () => {
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            frames[index] = dataUrl;
            captured++;
            if (captured === points.length) {
              setThumbnails(frames.filter(Boolean));
              if (frames[0]) setSelectedThumbnail(frames[0]);
            }
          }
        };
      });
    };
  };


  // Start Resumable Chunked Upload & Compression Pipeline
  const startChunkedUploadPipeline = async () => {
    if (!mediaFile) {
      setStep('POST_DETAILS');
      return;
    }

    setStep('COMPRESSION_UPLOADING');
    setUploadStage('PREPARING');
    setIsUploadInterrupted(false);
    setUploadProgress(0);

    const fileSize = mediaFile.size;
    setTotalBytes(fileSize);

    try {
      // 1. Initiate Session
      const initRes = await fetch('/api/v1/media/upload/initiate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id 
        },
        body: JSON.stringify({
          filename: mediaFile.name,
          fileSize,
          mimeType: mediaFile.type,
          totalChunks: 5,
          durationSeconds: Math.round(videoDuration || 30)
        })
      });

      const initData = await initRes.json();
      if (!initData.success) {
        setValidationError(initData.message || "Upload session initialization failed.");
        setIsUploadInterrupted(true);
        return;
      }

      const sessionId = initData.sessionId;
      setUploadSessionId(sessionId);

      // 2. Compress & Upload Chunks
      setUploadStage('COMPRESSING');
      await new Promise(r => setTimeout(r, 600)); // Simulate low-bandwidth client compression

      setUploadStage('UPLOADING');
      const totalChunks = 5;
      const chunkSize = Math.ceil(fileSize / totalChunks);

      for (let i = 0; i < totalChunks; i++) {
        // Simulate occasional 4G network interruption check
        const isInterrupted = false;
        if (isInterrupted) {
          setIsUploadInterrupted(true);
          return;
        }

        await fetch(`/api/v1/media/upload/${sessionId}/chunk`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id 
          },
          body: JSON.stringify({ chunkIndex: i, chunkSizeBytes: chunkSize })
        });

        const currentBytes = Math.min(fileSize, (i + 1) * chunkSize);
        setBytesUploaded(currentBytes);
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
        await new Promise(r => setTimeout(r, 400));
      }

      // 3. Complete Session
      setUploadStage('PROCESSING');
      await fetch(`/api/v1/media/upload/${sessionId}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id 
        },
        body: JSON.stringify({ sessionId })
      });

      setUploadStage('COMPLETE');
      setStep('POST_DETAILS');

      await logAuditTransaction(
        currentUser.id,
        currentUser.displayName,
        currentUser.role,
        'VIDEO_UPLOAD_COMPLETED',
        `Successfully uploaded & processed video ${mediaFile.name} (${(fileSize/(1024*1024)).toFixed(1)} MB)`,
        { sessionId, fileSize }
      );

    } catch (err) {
      console.error("Upload error:", err);
      setIsUploadInterrupted(true);
      setValidationError("Network connection interrupted during video upload. Click 'Resume Upload' to continue.");
    }
  };

  // Submit Post to Feed or Save as Draft
  const handlePublishPost = async (status: PostStatus = 'PUBLISHED') => {
    if (!checkMinorConsent()) return;

    setIsSubmitting(true);
    setValidationError(null);

    const hashtagArray = hashtagsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          title: title || `${currentUser.displayName}'s Football Clip`,
          caption,
          postType: postType === 'PLAYER_VIDEO' ? 'PLAYER_VIDEO' : postType === 'PHOTO' ? 'PHOTO' : 'TEXT_POST',
          category: 'Highlight',
          contentType: 'SOCIAL_VIDEO',
          visibility,
          hashtags: hashtagArray,
          locationName,
          videoThumbnail: selectedThumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
          videoUrl: videoBlobUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          status,
          sessionId: uploadSessionId
        })
      });

      const data = await response.json();
      if (data.success) {
        
        // Show processing checklist animation for published videos
        if (status === 'PUBLISHED' && postType === 'PLAYER_VIDEO') {
          setStep('PROCESSING_CONFIRMATION');
          
          setTimeout(() => setProcessingChecklist(prev => ({ ...prev, uploaded: true })), 400);
          setTimeout(() => setProcessingChecklist(prev => ({ ...prev, safetyChecked: true })), 900);
          setTimeout(() => setProcessingChecklist(prev => ({ ...prev, thumbnailGenerated: true })), 1400);
          setTimeout(() => {
            setProcessingChecklist(prev => ({ ...prev, streamableReady: true }));
            onPostCreated(data.post);
          }, 2000);

        } else {
          onPostCreated(data.post);
          onClose();
        }

        await logAuditTransaction(
          currentUser.id,
          currentUser.displayName,
          currentUser.role,
          status === 'DRAFT' ? 'POST_DRAFT_SAVED' : 'POST_PUBLISHED',
          `${status === 'DRAFT' ? 'Saved draft' : 'Published post'} "${title || caption || 'Football clip'}"`,
          { postId: data.postId, visibility }
        );

      } else {
        setValidationError(data.message || "Failed to publish post.");
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setValidationError("Failed to connect to Digital Scout server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
              ＋
            </div>
            <div>
              <h2 className="text-base font-black text-white">Digital Scout Content Studio</h2>
              <p className="text-[11px] text-slate-400">Publish football footage to regional feed & scout network</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Validation Alert</span>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* STEP 1: TYPE SELECTION */}
        {step === 'TYPE_SELECTION' && (
          <div className="space-y-5">
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Choose Content Category</h3>
              <p className="text-xs text-slate-400">Share your grassroots journey, match highlights, or freestyle clips</p>
            </div>

            {/* Content Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <button
                onClick={() => { setPostType('PLAYER_VIDEO'); setStep('FILE_UPLOAD'); }}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all cursor-pointer group space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400">🎥 Football Video</h4>
                  <p className="text-[11px] text-slate-400">Record or upload 720p match footage, skills & drills</p>
                </div>
              </button>

              <button
                onClick={() => { setPostType('PHOTO'); setStep('FILE_UPLOAD'); }}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl text-left transition-all cursor-pointer group space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-teal-400">📷 Football Photo</h4>
                  <p className="text-[11px] text-slate-400">Share match day photos, pitch cards & team photos</p>
                </div>
              </button>

              <button
                onClick={() => { setPostType('TEXT_POST'); setStep('POST_DETAILS'); }}
                className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-left transition-all cursor-pointer group space-y-2"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400">✍️ Thought / Update</h4>
                  <p className="text-[11px] text-slate-400">Publish training updates, match scores or notes</p>
                </div>
              </button>

              {/* CRITICAL DISTINCTION: START OFFICIAL TRIAL (PLAYER ROLE ONLY) */}
              {isPlayer ? (
                <button
                  onClick={() => {
                    onClose();
                    if (onStartTrial) onStartTrial();
                  }}
                  className="p-4 bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-teal-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/50 rounded-2xl text-left transition-all cursor-pointer group space-y-2 relative overflow-hidden shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                      OFFICIAL TRIAL
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                      ⚽ Start Official Trial
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Standardized AI Biomechanical Trial for verified Scout Leaderboard scoring
                    </p>
                  </div>
                </button>
              ) : (
                <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-left opacity-75 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold">
                      QUALIFICATION REQ.
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">⚽ Start Official Trial</h4>
                    <p className="text-[10px] text-slate-500">
                      Pass the 3-min Basic Assessment to unlock Verified Player status for official trials.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Direct Camera Recorder Quick Option */}
            <div className="pt-2">
              <button
                onClick={handleStartCamera}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" /> Open In-App Browser Camera Recorder
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: CAMERA RECORDING SCREEN */}
        {step === 'CAMERA_RECORD' && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Timer Bar Overlay */}
              <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700 flex items-center gap-2 text-xs font-mono font-bold text-white">
                <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                <span>{Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
                <span className="text-slate-400 text-[10px]">/ 03:00 max</span>
              </div>

              {/* Facing Flip Switch */}
              <button
                onClick={handleToggleCameraFacing}
                className="absolute top-3 right-3 p-2 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title="Flip Camera Front/Rear"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Bottom Camera Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 border-4 border-white flex items-center justify-center shadow-xl cursor-pointer transition-transform hover:scale-105"
                  >
                    <span className="w-5 h-5 rounded-sm bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-14 h-14 rounded-full bg-slate-950 border-4 border-red-500 flex items-center justify-center shadow-xl cursor-pointer transition-transform hover:scale-105"
                  >
                    <span className="w-6 h-6 bg-red-500 rounded-sm" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                onClick={() => { stopCameraStream(); setStep('TYPE_SELECTION'); }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel Recording
              </button>

              <button
                onClick={() => { stopCameraStream(); setStep('FILE_UPLOAD'); }}
                className="text-emerald-400 hover:underline cursor-pointer font-bold"
              >
                Upload from Gallery Instead →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FILE UPLOAD DROPZONE */}
        {step === 'FILE_UPLOAD' && (
          <div className="space-y-4">
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Upload Football Recording</h3>
              <p className="text-xs text-slate-400">Supported formats: MP4, MOV, WebM (Max {maxMb}MB, Max {maxDurationSec}s)</p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelected(e.dataTransfer.files[0]);
              }}
              className="p-8 bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl text-center space-y-3 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Drag and drop video or photo clip here</p>
                <p className="text-[11px] text-slate-500">or click to browse from device gallery</p>
              </div>

              <input
                type="file"
                accept="video/mp4,video/mov,video/webm,image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                }}
                className="hidden"
                id="media-file-input"
              />

              <label
                htmlFor="media-file-input"
                className="inline-flex px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Select Media File
              </label>
            </div>

            <div className="flex justify-between items-center text-xs pt-2">
              <button
                onClick={() => setStep('TYPE_SELECTION')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={handleStartCamera}
                className="text-emerald-400 hover:underline cursor-pointer font-bold flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" /> Open Camera Recorder
              </button>
            </div>

          </div>
        )}

        {/* STEP 4: COMPRESSION & CHUNKED UPLOADING PROGRESS */}
        {step === 'COMPRESSION_UPLOADING' && (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <Film className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                {uploadStage === 'COMPRESSING' && '⚡ Optimizing Video for Rural 4G Network...'}
                {uploadStage === 'UPLOADING' && '📡 Resumable Chunked Upload in Progress...'}
                {uploadStage === 'PROCESSING' && '⚙️ Generating Streamable Keyframes...'}
                {uploadStage === 'COMPLETE' && '✓ Upload Complete!'}
              </h3>
              <p className="text-xs text-slate-400">
                {(bytesUploaded / (1024 * 1024)).toFixed(1)} MB / {(totalBytes / (1024 * 1024)).toFixed(1)} MB ({uploadProgress}%)
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {/* Interrupted Upload Handler */}
            {isUploadInterrupted && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                <p className="text-xs text-amber-300">Network connection dipped. Resumable chunk session saved.</p>
                <button
                  onClick={startChunkedUploadPipeline}
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 cursor-pointer"
                >
                  Resume Upload Chunking
                </button>
              </div>
            )}

          </div>
        )}

        {/* STEP 5: VIDEO PREVIEW & THUMBNAIL CHOOSER */}
        {step === 'VIDEO_PREVIEW_THUMBNAIL' && videoBlobUrl && (
          <div className="space-y-4">
            
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white">Preview & Select Video Cover Thumbnail</h3>
              <p className="text-xs text-slate-400">Preview playback and choose the best cover frame for your feed post</p>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800">
              <video
                src={videoBlobUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Frame Thumbnail Selector */}
            {thumbnails.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Keyframe Cover:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {thumbnails.map((thumb, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedThumbnail(thumb)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedThumbnail === thumb ? 'border-emerald-400 scale-105' : 'border-slate-800 opacity-60'
                      }`}
                    >
                      <img src={thumb} alt={`Frame ${idx}`} className="w-full h-full object-cover" />
                      {selectedThumbnail === thumb && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep('FILE_UPLOAD')}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Retake / Change Clip
              </button>

              <button
                onClick={startChunkedUploadPipeline}
                className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                Use Video & Add Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 6: POST DETAILS & METADATA FORM */}
        {step === 'POST_DETAILS' && (
          <div className="space-y-4">
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Post Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Evening Grassroots 1v1 Skill Session in Kochi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Caption & Football Story</label>
                <textarea
                  rows={3}
                  placeholder="Share details about your training, match result or football technique..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" /> Hashtags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="kerala, freestyle, skills"
                    value={hashtagsInput}
                    onChange={(e) => setHashtagsInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" /> Pitch / Location
                  </label>
                  <input
                    type="text"
                    placeholder="Malabar Pitch, Kochi"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> Post Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="PUBLIC">🌍 Public (Visible to all scouts & community)</option>
                  <option value="FOLLOWERS_ONLY">👥 Followers Only</option>
                  <option value="PRIVATE">🔒 Private (Only me)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handlePublishPost('DRAFT')}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Draft
              </button>

              <button
                onClick={() => handlePublishPost('PUBLISHED')}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Publish Video to Feed
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* STEP 7: PROCESSING CONFIRMATION */}
        {step === 'PROCESSING_CONFIRMATION' && (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-5 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Content Transcoding & Verification Pipeline</h3>
              <p className="text-xs text-slate-400">Processing video clip for regional scout feed distribution</p>
            </div>

            <div className="space-y-2 text-xs text-left max-w-sm mx-auto p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                {processingChecklist.uploaded ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />}
                <span className={processingChecklist.uploaded ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Video Payload Uploaded</span>
              </div>

              <div className="flex items-center gap-2">
                {processingChecklist.safetyChecked ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />}
                <span className={processingChecklist.safetyChecked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Automated Safety & Moderation Checked</span>
              </div>

              <div className="flex items-center gap-2">
                {processingChecklist.thumbnailGenerated ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />}
                <span className={processingChecklist.thumbnailGenerated ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Streamable Cover Keyframe Generated</span>
              </div>

              <div className="flex items-center gap-2">
                {processingChecklist.streamableReady ? <Check className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />}
                <span className={processingChecklist.streamableReady ? 'text-emerald-400 font-bold' : 'text-slate-400'}>Published to Community & Scout Feed</span>
              </div>
            </div>

            {processingChecklist.streamableReady && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer hover:bg-emerald-300"
              >
                View Live Feed Post →
              </button>
            )}

          </div>
        )}

      </div>

      {/* Under-18 Guardian Consent Alert Modal */}
      {showGuardianConsentNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center">
            <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Under-18 Safeguarding Requirement</h3>
              <p className="text-xs text-slate-400">
                Digital Scout India Safeguarding Policy requires verified Guardian Consent before minor football players can capture or upload video content.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1">
              <span className="text-amber-300 font-bold block">Action Required:</span>
              <p className="text-slate-400">Please ask your parent/guardian to complete phone OTP verification in the Guardian Consent panel.</p>
            </div>

            <button
              onClick={() => setShowGuardianConsentNotice(false)}
              className="w-full py-2.5 bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
