import * as THREE from 'three';
import type { ViewLayer } from '../types';

export function makeStableId(mesh: THREE.Object3D, parser: any, fallbackIndex: number): string {
  // Prefer glTF node association for cross-loader determinism (PatternView <-> ProductStage).
  const assoc = parser?.associations?.get?.(mesh);
  const name = (mesh as any)?.name || 'mesh';
  if (assoc && typeof assoc.type === 'string' && assoc.index !== undefined) {
    return `${name}__${assoc.type}_${assoc.index}`;
  }
  return `${name}_${fallbackIndex}`;
}

export function classifyLayerByNormals(mesh: THREE.Mesh, modelCenterWorld: THREE.Vector3): ViewLayer {
  const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
  if (!geometry?.attributes?.position) return 'outer';

  // Ensure normals exist for models missing them.
  if (!geometry.attributes.normal) {
    geometry.computeVertexNormals();
  }

  mesh.updateMatrixWorld(true);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const indexAttr = geometry.index;

  const totalTris = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(pos.count / 3);
  if (totalTris <= 0) return 'outer';

  // Sample up to N triangles for speed.
  const MAX_TRIS = 600;
  const stride = Math.max(1, Math.floor(totalTris / MAX_TRIS));

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();
  const centroid = new THREE.Vector3();
  const radial = new THREE.Vector3();

  let sum = 0;
  let samples = 0;

  for (let t = 0; t < totalTris; t += stride) {
    let ia: number, ib: number, ic: number;
    if (indexAttr) {
      ia = indexAttr.getX(t * 3 + 0);
      ib = indexAttr.getX(t * 3 + 1);
      ic = indexAttr.getX(t * 3 + 2);
    } else {
      ia = t * 3 + 0;
      ib = t * 3 + 1;
      ic = t * 3 + 2;
    }

    a.fromBufferAttribute(pos, ia).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(pos, ib).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(pos, ic).applyMatrix4(mesh.matrixWorld);

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    faceNormal.crossVectors(ab, ac).normalize();
    if (!Number.isFinite(faceNormal.x) || !Number.isFinite(faceNormal.y) || !Number.isFinite(faceNormal.z)) continue;

    centroid.addVectors(a, b).add(c).multiplyScalar(1 / 3);
    radial.subVectors(centroid, modelCenterWorld);

    sum += faceNormal.dot(radial);
    samples++;
  }

  // Negative means normals point mostly toward the center (inner surface / lining).
  if (samples === 0) return 'outer';
  return sum < 0 ? 'inner' : 'outer';
}



