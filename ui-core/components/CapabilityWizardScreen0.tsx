/**
 * Screen 0: Upload & Auto-analysis
 * Handles model upload, analysis, and readiness confirmation
 */

import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { UploadState, ModelAnalysisResult, PartIdentity } from '../types-capability-wizard';

interface CapabilityWizardScreen0Props {
  onComplete: (
    modelUrl: string,
    analysisResult: ModelAnalysisResult,
    parts: PartIdentity[]
  ) => void;
  onBack?: () => void;
}

const CapabilityWizardScreen0: React.FC<CapabilityWizardScreen0Props> = ({
  onComplete,
  onBack,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('empty');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ModelAnalysisResult | null>(null);
  const [parts, setParts] = useState<PartIdentity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelViewerRef = useRef<any>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      alert('Please upload a .GLB or .GLTF file');
      return;
    }

    setModelFile(file);
    setUploadState('uploading');

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        startAnalysis(file);
      }
    }, 200);
  };

  // Analyze the uploaded model
  const startAnalysis = async (file: File) => {
    setUploadState('analyzing');

    // Create object URL for the model
    const url = URL.createObjectURL(file);
    setModelUrl(url);

    // Load and analyze the model using Three.js
    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          url,
          resolve,
          undefined,
          reject
        );
      });

      // Extract model information
      const scene = gltf.scene;
      const meshes: THREE.Mesh[] = [];
      const materials = new Set<THREE.Material>();

      scene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          meshes.push(node);
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => materials.add(mat));
          } else {
            materials.add(node.material);
          }
        }
      });

      // Check for UV mapping
      let hasUVMap = false;
      for (const mesh of meshes) {
        if (mesh.geometry.attributes.uv) {
          hasUVMap = true;
          break;
        }
      }

      // Create part identities
      const partsList: PartIdentity[] = meshes.map((mesh, index) => {
        // Calculate approximate surface area
        const geometry = mesh.geometry;
        const position = geometry.attributes.position;
        let area = 0;

        if (geometry.index) {
          const indices = geometry.index.array;
          for (let i = 0; i < indices.length; i += 3) {
            const v1 = new THREE.Vector3().fromBufferAttribute(position, indices[i]);
            const v2 = new THREE.Vector3().fromBufferAttribute(position, indices[i + 1]);
            const v3 = new THREE.Vector3().fromBufferAttribute(position, indices[i + 2]);
            const triangle = new THREE.Triangle(v1, v2, v3);
            area += triangle.getArea();
          }
        }

        return {
          id: `part-${index}`,
          label: `Part ${index + 1}`,
          meshName: mesh.name || undefined,
          materialIndex: Array.from(materials).indexOf(
            Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
          ),
          area,
        };
      });

      setParts(partsList);

      // Determine warnings
      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (!hasUVMap) {
        warnings.push('UV map missing — personalization features may be limited');
      }

      if (meshes.length > 50) {
        warnings.push('Model has many parts — consider optimizing for performance');
      }

      // Create analysis result
      const result: ModelAnalysisResult = {
        partsCount: meshes.length,
        materialsCount: materials.size,
        uvMapDetected: hasUVMap,
        warnings,
        recommendations,
      };

      setAnalysisResult(result);

      // Determine final state
      if (warnings.length > 0) {
        setUploadState('needs-attention');
      } else {
        setUploadState('ready');
      }
    } catch (error) {
      console.error('Error analyzing model:', error);
      alert('Error analyzing model. Please try a different file.');
      setUploadState('empty');
    }
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (modelUrl && analysisResult) {
      onComplete(modelUrl, analysisResult, parts);
    }
  };

  // Render based on state
  return (
    <div className="h-screen flex flex-col bg-desk">
      {/* Top Bar */}
      <div className="h-16 border-b border-charcoal/20 bg-cream flex items-center justify-between px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60 hover:text-charcoal transition-colors"
        >
          <span>←</span> Back
        </button>
        <div className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
          Step 1 of 3
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        {/* STATE: Empty */}
        {uploadState === 'empty' && (
          <div className="max-w-2xl w-full">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-charcoal/30 rounded-sm bg-cream hover:border-charcoal/60 hover:bg-white transition-all cursor-pointer p-12 md:p-16"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-6 text-center">
                <Upload size={48} className="text-charcoal/40" />
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl italic mb-2">
                    Upload your 3D model
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                    GLB or GLTF format
                  </p>
                </div>
                <button className="bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest py-3 px-8 hover:bg-charcoal/90 transition-colors">
                  Choose File
                </button>
                <p className="font-mono text-[9px] text-charcoal/40">
                  or drag and drop
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* STATE: Uploading */}
        {uploadState === 'uploading' && (
          <div className="max-w-xl w-full bg-cream border border-charcoal/20 rounded-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-charcoal" />
                <span className="font-mono text-sm">{modelFile?.name}</span>
              </div>
              <button
                onClick={() => setUploadState('empty')}
                className="p-2 hover:bg-charcoal/5 rounded-sm transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-2 bg-charcoal/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-charcoal transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="mt-2 font-mono text-[9px] text-charcoal/60 text-right">
              {uploadProgress}%
            </div>
          </div>
        )}

        {/* STATE: Analyzing */}
        {uploadState === 'analyzing' && (
          <div className="max-w-xl w-full bg-cream border border-charcoal/20 rounded-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <Loader2 size={24} className="animate-spin text-charcoal" />
              <h3 className="font-serif text-xl italic">Analyzing model...</h3>
            </div>
            <ul className="space-y-2 font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
              <li>→ Detecting parts</li>
              <li>→ Analyzing materials</li>
              <li>→ Checking UV mapping</li>
              <li>→ Calculating metrics</li>
            </ul>
          </div>
        )}

        {/* STATE: Ready / Needs Attention */}
        {(uploadState === 'ready' || uploadState === 'needs-attention') && analysisResult && (
          <div className="w-full h-full flex flex-col">
            {/* 3D Viewer */}
            <div className="flex-1 bg-charcoal/5 rounded-sm overflow-hidden mb-6">
              <model-viewer
                ref={modelViewerRef}
                src={modelUrl || ''}
                camera-controls
                touch-action="pan-y"
                style={{ width: '100%', height: '100%' }}
                className="w-full h-full"
              />
            </div>

            {/* Analysis Summary */}
            <div className="bg-cream border border-charcoal/20 rounded-sm p-6">
              {/* Summary Chips */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/20 rounded-sm">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                    Parts detected
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {analysisResult.partsCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/20 rounded-sm">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                    Materials
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {analysisResult.materialsCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/20 rounded-sm">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/60">
                    UV map
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {analysisResult.uvMapDetected ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <X size={16} className="text-charcoal/40" />
                    )}
                  </span>
                </div>
              </div>

              {/* Warnings (if any) */}
              {uploadState === 'needs-attention' && analysisResult.warnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-yellow-800 mb-2">
                        Needs attention
                      </div>
                      <ul className="space-y-1">
                        {analysisResult.warnings.map((warning, i) => (
                          <li key={i} className="font-mono text-xs text-yellow-700">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                {uploadState === 'needs-attention' && (
                  <button
                    onClick={() => {
                      setUploadState('empty');
                      setModelFile(null);
                      setModelUrl(null);
                      setAnalysisResult(null);
                    }}
                    className="border border-charcoal/30 font-mono text-[10px] uppercase tracking-widest py-3 px-6 hover:border-charcoal hover:bg-white transition-colors"
                  >
                    Fix & Re-upload
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  className="bg-charcoal text-cream font-mono text-[10px] uppercase tracking-widest py-3 px-8 hover:bg-charcoal/90 transition-colors"
                >
                  Continue {uploadState === 'needs-attention' && 'Anyway'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CapabilityWizardScreen0;
