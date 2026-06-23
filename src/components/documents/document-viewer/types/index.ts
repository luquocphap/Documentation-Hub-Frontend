export interface DocumentViewerHandle {
  startContentEdit: () => void;
  endContentEdit: () => void;
  isContentEditActive: () => boolean;
  openCommentPanel: () => void;
}

export interface DocumentViewerProps {
  documentId: string;
  publicId: string;
  initialTitle: string;
  onViewerInit?: (handle: DocumentViewerHandle) => void;
  onTitleUpdate?: (newTitle: string) => void;
  onSaveSuccess?: () => void;
}

export interface SelectedTextInfo {
  quads: unknown[];
  text: string;
  pageNumber: number;
}

export interface FloatPosition {
  top: number;
  left: number;
}

export type FloatingPlacement = "button" | "input" | "anchor";
export type CommentCoordinateMode = "content" | "window" | "viewer";

// area of annotation (highligt comment) save in db
export interface QuadLike {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
}

export interface ApryseAnnotation {
  Id: string;
  PageNumber?: number;
  Subject?: string;
  Author?: string;
  Color?: unknown;
  Opacity?: number;
  getCustomData?: (key: string) => string;
  setQuads?: (quads: unknown[]) => void;
  setContents: (value: string) => void;
  setCustomData?: (key: string, value: string) => void;
  setModified?: () => void;
}

export interface ApryseAnnotationManager {
  addAnnotation: (annotation: ApryseAnnotation) => void;
  deleteAnnotation: (annotation: ApryseAnnotation, options?: { force?: boolean }) => void;
  drawAnnotationsFromList: (annotation: ApryseAnnotation) => Promise<unknown>;
  getAnnotationById: (id: string) => ApryseAnnotation | null;
  getSelectedAnnotations: () => ApryseAnnotation[];
  jumpToAnnotation: (annotation: ApryseAnnotation, options?: { isSmoothScroll?: boolean }) => void;
  selectAnnotation?: (annotation: ApryseAnnotation) => void;
  updateAnnotation: (annotation: ApryseAnnotation) => void;
  addEventListener?: (
    event: "annotationSelected",
    callback: (annotations: ApryseAnnotation[], action: "selected" | "deselected") => void
  ) => void;
}

export interface ApryseContentBox {
  isEditing: () => boolean;
  stopContentEditing: () => void;
}

export interface ApryseContentEditManager {
  startContentEditMode: () => Promise<void>;
  endContentEditMode: () => void;
  getContentBoxById: (id: string) => ApryseContentBox;
  addEventListener(
    event: "contentBoxEditEnded",
    callback: () => void
  ): void;
  removeEventListener(
    event: "contentBoxEditEnded",
    callback: () => void
  ): void;
}

export interface ApryseDocument {
  getFileData: (options?: { flatten?: boolean }) => Promise<ArrayBuffer | Uint8Array>;
}

export interface ToolModeViewer {
  getTool: (name: unknown) => unknown;
  setToolMode: (tool: unknown) => void;
}

export interface ApryseDisplayMode {
  pageToWindow: (pagePt: { x: number; y: number }, pageNumber: number) => { x: number; y: number };
}

export interface ApryseDisplayModeManager {
  getDisplayMode: () => ApryseDisplayMode;
}

export interface ApryseDocumentViewer extends ToolModeViewer {
  addEventListener(event: "documentLoaded", callback: () => void): void;
  addEventListener(event: "zoomUpdated", callback: (zoom: number) => void): void;
  addEventListener(
    event: "pageComplete",
    callback: (pageNumber: number, canvas: HTMLCanvasElement) => void
  ): void;
  addEventListener(event: "pageNumberUpdated", callback: (page: number) => void): void;
  addEventListener(event: "textSelected", callback: (quads: unknown[], text: string, pageNumber: number) => void): void;
  dispose?: () => void;
  enableAnnotations: () => void;
  getAnnotationManager: () => ApryseAnnotationManager;
  getContentEditManager: () => ApryseContentEditManager;
  getCurrentPage?: () => number;
  getDisplayModeManager: () => ApryseDisplayModeManager;
  getDocument: () => ApryseDocument;
  getPageCount: () => number;
  getPageWidth: (pageNumber: number) => number;
  getSelectedText?: (pageNumber?: number) => string;
  getSelectedTextQuads?: (pageNumber?: number) => unknown;
  loadDocument: (url: string) => Promise<unknown>;
  setCurrentPage: (page: number) => void;
  setScrollViewElement: (element: HTMLElement | null) => void;
  setViewerElement: (element: HTMLElement | null) => void;
  zoomTo: (zoom: number) => void;
}

export interface ApryseCore {
  Annotations: {
    Color: new (red: number, green: number, blue: number, alpha?: number) => unknown;
    TextHighlightAnnotation: new () => ApryseAnnotation;
  };
  ContentEdit?: {
    preloadWorker?: (viewer: ApryseDocumentViewer) => Promise<unknown> | unknown;
  };
  DocumentViewer: new (options: { licenseKey: string }) => ApryseDocumentViewer;
  Tools: {
    ToolNames: {
      CONTENT_EDIT: string;
      TEXT_SELECT: string;
    };
  };
  setWorkerPath: (path: string) => void;
}

declare global {
  interface Window {
    Core: ApryseCore;
  }
}
