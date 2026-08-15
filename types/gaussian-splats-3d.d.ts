declare module "@mkkellogg/gaussian-splats-3d" {
  export class Viewer {
    constructor(options: {
      rootElement: HTMLElement;
      cameraUp?: [number, number, number];
      initialCameraPosition?: [number, number, number];
      initialCameraLookAt?: [number, number, number];
      controls?: {
        autoRotate?: boolean;
        autoRotateSpeed?: number;
        minDistance?: number;
        maxDistance?: number;
      };
      sceneRevealMode?: number;
      sharedMemoryForWorkers?: boolean;
      useBuiltInControls?: boolean;
      ignoreDevicePixelRatio?: boolean;
      gpuAcceleratedSort?: boolean;
      optimizeSplatData?: boolean;
      freeIntermediateSplatData?: boolean;
      focalAdjustment?: number;
      maxScreenSpaceSplatSize?: number;
      renderMode?: number;
      sphericalHarmonicsDegree?: number;
      logLevel?: number;
    });

    addSplatScene(
      path: string,
      options?: {
        showLoadingUI?: boolean;
        position?: [number, number, number];
        rotation?: [number, number, number] | [number, number, number, number];
        scale?: [number, number, number];
        format?: number;
        progressiveLoad?: boolean;
        splatAlphaRemovalThreshold?: number;
        onProgress?: (
          pct: number,
          label?: string,
          loaderStatus?: number
        ) => void;
        headers?: Record<string, string>;
      }
    ): Promise<void>;

    dispose(): void;
    start(): void;
    stop(): void;
  }

  export const SceneRevealMode: {
    Default: number;
    Instant: number;
    Gradual: number;
  };

  export const RenderMode: {
    Always: number;
    OnChange: number;
  };

  export const SceneFormat: {
    Ply: number;
    Splat: number;
    KSplat: number;
    Spz: number;
  };

  export class SpzLoader {
    static loadAsync(
      path: string,
      onProgress?: (pct: number) => void
    ): Promise<unknown>;
  }

  export class PlyLoader {
    static loadAsync(
      path: string,
      onProgress?: (pct: number) => void
    ): Promise<unknown>;
  }

  export class SplatLoader {
    static loadAsync(
      path: string,
      onProgress?: (pct: number) => void
    ): Promise<unknown>;
  }

  export class OrbitControls {
    constructor(camera: unknown, element: HTMLElement);
  }

  export const LogLevel: {
    None: number;
    Error: number;
    Warning: number;
    Info: number;
    Debug: number;
  };
}
