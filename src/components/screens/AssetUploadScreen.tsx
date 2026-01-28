import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCanvasStore } from '../../stores/canvasStore';
import { validateGLTF, getPerformanceRating } from '../../utils/gltfLoader';
import { generateModelPreview } from '../../utils/modelPreview';
import type { Asset, ModelAsset } from '../../types/assets';
import StandardLayout, { FooterInfoItem, StandardButton } from '../layout/StandardLayout';

interface AssetUploadScreenProps {
  onNext: () => void;
  onBack: () => void;
}

const AssetUploadScreen: React.FC<AssetUploadScreenProps> = ({ onNext, onBack }) => {
  const { assets, addAsset, removeAsset, selectedProduct } = useCanvasStore();
  const [uploading, setUploading] = useState(false);
  const [validationResults, setValidationResults] = useState<
    Map<string, ModelAsset['validation']>
  >(new Map());

  const allAssets = [
    ...assets.models,
    ...assets.textures,
    ...assets.images,
    ...assets.fonts,
  ];

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);

      for (const file of acceptedFiles) {
        try {
          const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const url = URL.createObjectURL(file);

          // Determine asset type
          let assetType: Asset['type'] = 'image';
          if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
            assetType = 'model';
          } else if (
            file.name.toLowerCase().endsWith('.ttf') ||
            file.name.toLowerCase().endsWith('.otf')
          ) {
            assetType = 'font';
          } else if (
            file.name.toLowerCase().endsWith('.png') ||
            file.name.toLowerCase().endsWith('.jpg') ||
            file.name.toLowerCase().endsWith('.jpeg') ||
            file.name.toLowerCase().endsWith('.webp') ||
            file.name.toLowerCase().endsWith('.svg')
          ) {
            // Images default to 'image' type (can be used for print capabilities)
            // They can also be used as textures for materials
            assetType = 'image';
          }
          const asset: Asset = {
            id: assetId,
            type: assetType,
            name: file.name,
            file,
            url,
            size: file.size,
            uploadedAt: Date.now(),
            used: false,
          };

          // Validate 3D models and generate preview
          if (assetType === 'model') {
            const validation = await validateGLTF(file);
            const modelAsset = asset as ModelAsset;
            modelAsset.meshCount = validation.meshCount;
            modelAsset.hasUV = validation.hasUV;
            modelAsset.uvMeshCount = validation.uvMeshCount;
            modelAsset.validation = {
              loads: validation.loads,
              errors: validation.errors,
              warnings: validation.warnings,
            };

            // Generate preview thumbnail
            if (validation.loads && url) {
              try {
                const previewUrl = await generateModelPreview(url, 128);
                if (previewUrl) {
                  modelAsset.previewUrl = previewUrl;
                }
              } catch (error) {
                console.error('Error generating model preview:', error);
              }
            }

            setValidationResults((prev) => {
              const next = new Map(prev);
              next.set(assetId, modelAsset.validation);
              return next;
            });
          }

          addAsset(asset);
        } catch (error) {
          console.error('Error processing file:', file.name, error);
        }
      }

      setUploading(false);
    },
    [addAsset]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
      'font/*': ['.ttf', '.otf'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB total (will be checked per file)
  });

  const handleRemove = (assetId: string) => {
    removeAsset(assetId);
    setValidationResults((prev) => {
      const next = new Map(prev);
      next.delete(assetId);
      return next;
    });
  };

  const handleClearAll = () => {
    if (confirm('Clear all uploaded assets?')) {
      allAssets.forEach((asset) => removeAsset(asset.id));
      setValidationResults(new Map());
    }
  };

  const handleContinue = () => {
    if (assets.models.length > 0) {
      onNext();
    }
  };

  const canContinue = assets.models.length > 0;

  return (
    <StandardLayout
      header={{
        title: 'Upload your product assets',
        showBack: true,
        onBack: onBack,
      }}
      footer={{
        containerClassName: 'h-[80px] overflow-hidden',
        leftContent: (
          <>
            <FooterInfoItem label="ASSETS" value={allAssets.length} />
            <FooterInfoItem label="MODELS" value={assets.models.length} />
          </>
        ),
        rightContent: (
          <StandardButton
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue →
          </StandardButton>
        ),
      }}
      stickyContent={
        <div className="mb-2.5">
          <p className="text-mono-body text-charcoal">
            3D models, textures, images — all at once
          </p>
        </div>
      }
    >
      {/* Content */}
      <div className="max-w-2xl mx-auto">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`border border-dashed border-charcoal rounded-[24px] p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'bg-desk'
                  : 'bg-cream/80 hover:bg-desk'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="text-4xl">⬆</div>
                <div>
                  <p className="font-serif text-xl mb-2">Drop files here</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 mb-4">
                    or{' '}
                    <span className="underline underline-offset-4 text-charcoal">Browse files</span>
                  </p>
                </div>
                <div className="font-mono text-[10px] lg:font-light uppercase tracking-widest text-charcoal/60">
                  Supported: GLB, GLTF, PNG, JPG, WEBP, SVG, TTF, OTF
                  <br />
                  Max total: 100MB
                </div>
              </div>
            </div>

            {uploading && (
              <div className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                Uploading...
              </div>
            )}

            {/* Uploaded Assets */}
            {allAssets.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.3em]">
                    UPLOADED ASSETS ({allAssets.length})
                  </h3>
                  <button
                    onClick={handleClearAll}
                    className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                  >
                    Clear all
                  </button>
                </div>

                {/* 3D Models */}
                {assets.models.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3">
                      3D MODELS ({assets.models.length})
                    </h4>
                    <div className="space-y-4">
                      {assets.models.map((model) => {
                        const validation = validationResults.get(model.id);
                        const modelAsset = model as ModelAsset;
                        return (
                          <div
                            key={model.id}
                            className="border border-charcoal rounded-[18px] p-4 bg-cream"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-[12px] border border-charcoal/40 bg-desk flex items-center justify-center">
                                  <span className="text-xl">📦</span>
                                </div>
                                <div>
                                  <p className="font-serif text-lg">{model.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {validation?.loads && (
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-green-600">
                                        ✓ Valid
                                      </span>
                                    )}
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                                      {(model.size / 1024 / 1024).toFixed(2)}MB
                                    </span>
                                    {modelAsset.meshCount !== undefined && (
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                                        {modelAsset.meshCount} meshes
                                      </span>
                                    )}
                                    {modelAsset.hasUV && (
                                      <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/60">
                                        UV: {modelAsset.uvMeshCount}/{modelAsset.meshCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemove(model.id)}
                                className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                              >
                                Remove
                              </button>
                            </div>

                            {/* Validation Panel */}
                            {validation && (
                              <div className="border-t border-charcoal/20 pt-3 mt-3">
                                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
                                  3D MODEL HEALTH CHECK
                                </div>
                                <div className="space-y-1">
                                  {validation.loads && (
                                    <div className="text-green-600 font-mono text-xs">
                                      ✓ File loads correctly
                                    </div>
                                  )}
                                  {modelAsset.meshCount !== undefined && (
                                    <div className="text-green-600 font-mono text-xs">
                                      ✓ {modelAsset.meshCount} meshes detected
                                    </div>
                                  )}
                                  {model.size < 50 * 1024 * 1024 && (
                                    <div className="text-green-600 font-mono text-xs">
                                      ✓ File size OK ({(model.size / 1024 / 1024).toFixed(1)}MB)
                                    </div>
                                  )}
                                  {modelAsset.hasUV && modelAsset.uvMeshCount !== undefined && (
                                    <div className="text-yellow-600 font-mono text-xs">
                                      ⚠ UV mapping: {modelAsset.uvMeshCount}/{modelAsset.meshCount}{' '}
                                      meshes have UV
                                    </div>
                                  )}
                                  {validation.warnings.map((warning, i) => (
                                    <div key={i} className="text-yellow-600 font-mono text-xs">
                                      ⚠ {warning}
                                    </div>
                                  ))}
                                  {validation.errors.map((error, i) => (
                                    <div key={i} className="text-red-600 font-mono text-xs">
                                      ✗ {error}
                                    </div>
                                  ))}
                                  {modelAsset.meshCount !== undefined && (
                                    <div className="text-green-600 font-mono text-xs">
                                      ✓ Performance:{' '}
                                      {getPerformanceRating(modelAsset.meshCount, model.size)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Textures */}
                {assets.textures.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3">
                      TEXTURES ({assets.textures.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {assets.textures.map((texture) => (
                        <div
                          key={texture.id}
                          className="border border-charcoal rounded-[12px] p-2 bg-cream relative group"
                        >
                          {texture.url && (
                            <img
                              src={texture.url}
                              alt={texture.name}
                              className="w-full aspect-square object-cover rounded-[8px] mb-2"
                            />
                          )}
                          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 truncate">
                            {texture.name}
                          </p>
                          <button
                            onClick={() => handleRemove(texture.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal text-cream opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images */}
                {assets.images.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3">
                      IMAGES ({assets.images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {assets.images.map((image) => (
                        <div
                          key={image.id}
                          className="border border-charcoal rounded-[12px] p-2 bg-cream relative group"
                        >
                          {image.url && (
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full aspect-square object-cover rounded-[8px] mb-2"
                            />
                          )}
                          <p className="font-mono text-[10px] uppercase tracking-widest text-charcoal/70 truncate">
                            {image.name}
                          </p>
                          <button
                            onClick={() => handleRemove(image.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal text-cream opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fonts */}
                {assets.fonts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3">
                      FONTS ({assets.fonts.length})
                    </h4>
                    <div className="space-y-2">
                      {assets.fonts.map((font) => (
                        <div
                          key={font.id}
                          className="border border-charcoal rounded-[12px] p-3 bg-cream flex items-center justify-between group"
                        >
                          <span className="font-mono text-xs uppercase tracking-widest">
                            Aa {font.name}
                          </span>
                          <button
                            onClick={() => handleRemove(font.id)}
                            className="font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-accent"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
      </div>
    </StandardLayout>
  );
};

export default AssetUploadScreen;

