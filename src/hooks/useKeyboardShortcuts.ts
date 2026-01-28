import { useEffect } from 'react';
import { useCanvasStore } from '../stores/canvasStore';

export const useKeyboardShortcuts = () => {
  const { undo, redo, setOverlay, selectedPartId, selectPart, parts, removePart, saveDraft } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl modifier
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: ⌘Z / Ctrl+Z
      if (modifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: ⌘⇧Z / Ctrl+Shift+Z
      if (modifier && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: ⌘S / Ctrl+S
      if (modifier && e.key === 's') {
        e.preventDefault();
        saveDraft();
        return;
      }

      // Escape: Close overlay / Deselect
      if (e.key === 'Escape') {
        setOverlay(null);
        selectPart(null);
        return;
      }

      // Delete: Remove selected part
      if (e.key === 'Delete' && selectedPartId) {
        if (selectedPartId) {
          removePart(selectedPartId);
          selectPart(null);
        }
        return;
      }

      // Space: Reset 3D view (only if not in input/textarea)
      if (e.key === ' ' && (e.target === document.body || (e.target as HTMLElement).tagName === 'DIV')) {
        e.preventDefault();
        // Reset 3D view - this would need to be passed from Viewport3D
        // For now, just prevent default scroll
        return;
      }

      // 1-9: Select part by index
      if (e.key >= '1' && e.key <= '9' && !modifier) {
        const index = parseInt(e.key) - 1;
        if (index < parts.length) {
          selectPart(parts[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setOverlay, selectedPartId, selectPart, parts, removePart, saveDraft]);
};

