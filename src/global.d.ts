// Ambient declarations for the custom globals our client scripts attach to
// `window` (module-scoped state shared across component instances).
export {};

declare global {
  interface Window {
    __ywsModalState?: WeakMap<object, { opener: Element | null }>;
    __ywsModalControllerReady?: boolean;
    YWSPipeda?: Record<string, unknown>;
  }
}
