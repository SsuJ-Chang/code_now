import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { Socket } from 'socket.io-client';
import { EditorView, Decoration, WidgetType } from '@codemirror/view';
import { StateField, StateEffect, RangeSet, Compartment, Range } from '@codemirror/state';

type RemoteSelection = { userId: string; ranges: { from: number; to: number; }[]; color: string; }; // Added color

type Props = {
  language: string;
  code: string;
  onCodeChange: (code: string) => void;
  socket: Socket | null;
  canEdit: boolean; // 新增 canEdit 屬性
};

// Define a custom widget for the remote cursor
class RemoteCursorWidget extends WidgetType {
  constructor(readonly color: string) { super(); }

  eq(other: RemoteCursorWidget) { return other.color === this.color; }

  toDOM() {
    const cursor = document.createElement('span');
    cursor.style.borderLeft = `1px solid ${this.color}`;
    cursor.style.height = '1.2em'; // Original height
    cursor.style.position = 'absolute';
    cursor.style.animation = 'blink 1s infinite'; // Original animation
    return cursor;
  }

  ignoreEvent() { return true; }
}

const Editor: React.FC<Props> = ({ language, code, onCodeChange, socket, canEdit }) => { // 接收 canEdit
  const [remoteSelections, setRemoteSelections] = useState<Record<string, RemoteSelection>>({});
  const editorViewRef = useRef<EditorView | null>(null);
  const cursorTimers = useRef<Map<string, number>>(new Map());

  const extensions = language === 'javascript' ? [javascript({ jsx: true })] : [python()];

  // Compartment for dynamically updating decorations
  const remoteSelectionCompartment = new Compartment();

  // State field to hold the remote selections
  const remoteSelectionField = StateField.define<RangeSet<Decoration>>({
    create() { return Decoration.none; },
    update(decorations, tr) {
      decorations = decorations.map(tr.changes); // Apply local changes first
      for (let effect of tr.effects) {
        if (effect.is(updateRemoteSelectionsEffect)) {
          return effect.value; // Replace with the new decorations from the effect
        }
      }
      return decorations; // No relevant effect, return current decorations
    },
    provide: f => EditorView.decorations.from(f)
  });

  // Effect to update the remote selections state field
  const updateRemoteSelectionsEffect = StateEffect.define<RangeSet<Decoration>>();

  useEffect(() => {
    if (!socket) return;

    socket.on('cursor-selection-update', (data: RemoteSelection) => {
      setRemoteSelections(prev => ({
        ...prev,
        [data.userId]: data,
      }));

      // Clear existing timer and set a new one for this user
      if (cursorTimers.current.has(data.userId)) {
        clearTimeout(cursorTimers.current.get(data.userId)!);
      }
      const timer = setTimeout(() => {
        setRemoteSelections(prev => {
          const newSelections = { ...prev };
          delete newSelections[data.userId];
          return newSelections;
        });
        cursorTimers.current.delete(data.userId);
      }, 3000); // Disappear after 3 seconds of inactivity
      cursorTimers.current.set(data.userId, timer);
    });

    socket.on('user-disconnected', (userId: string) => {
      setRemoteSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[userId];
        return newSelections;
      });
      // Clear timer if user disconnects
      if (cursorTimers.current.has(userId)) {
        clearTimeout(cursorTimers.current.get(userId)!);
        cursorTimers.current.delete(userId);
      }
    });

    // Handle initial remote selections when a new user connects
    socket.on('current-remote-selections', (data: Record<string, RemoteSelection>) => {
      setRemoteSelections(data);
      // Set timers for initial selections as well
      for (const userId in data) {
        if (cursorTimers.current.has(userId)) {
          clearTimeout(cursorTimers.current.get(userId)!);
        }
        const timer = setTimeout(() => {
          setRemoteSelections(prev => {
            const newSelections = { ...prev };
            delete newSelections[userId];
            return newSelections;
          });
          cursorTimers.current.delete(userId);
        }, 3000);
        cursorTimers.current.set(userId, timer);
      }
    });

    return () => {
      socket.off('cursor-selection-update');
      socket.off('user-disconnected');
      socket.off('current-remote-selections');
      // Clear all timers on unmount
      cursorTimers.current.forEach(timer => clearTimeout(timer));
      cursorTimers.current.clear();
    };
  }, [socket]);

  useEffect(() => {
    if (editorViewRef.current) {
      const newDecorations: Range<Decoration>[] = [];

      for (const userId in remoteSelections) {
        const selection = remoteSelections[userId];
        const color = selection.color;

        selection.ranges.forEach(range => {
          // Add selection decoration
          if (range.from !== range.to) {
            newDecorations.push(Decoration.mark({
              attributes: { style: `background-color: rgba(200, 200, 200, 0.3);` }
            }).range(range.from, range.to));
          }
          // Add cursor decoration
          newDecorations.push(Decoration.widget({
            widget: new RemoteCursorWidget(color),
            side: 1
          }).range(range.to));
        });
      }

      const transaction = editorViewRef.current.state.update({
        effects: updateRemoteSelectionsEffect.of(Decoration.set(newDecorations))
      });
      editorViewRef.current.dispatch(transaction);
    }
  }, [remoteSelections]);

  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (data: { language: string, code: string }) => {
      if (data.language === language && editorViewRef.current) {
        const view = editorViewRef.current;
        if (view.state.doc.toString() !== data.code) {
          const transaction = view.state.update({
            changes: { from: 0, to: view.state.doc.length, insert: data.code },
            selection: view.state.selection, // Preserve selection
            scrollIntoView: false, // Prevent scrolling
          });
          view.dispatch(transaction);
        }
      }
    };

    socket.on('code-update', handleCodeUpdate);

    return () => {
      socket.off('code-update', handleCodeUpdate);
    };
  }, [socket, language]);

  const throttleTimeout = useRef<number | null>(null);

  const handleEditorUpdate = (viewUpdate: any) => {
    // 只有在 canEdit 為 true 時才發送游標和選取範圍更新
    if (canEdit && viewUpdate.selectionSet && socket) {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
      throttleTimeout.current = setTimeout(() => {
        const selectionRanges = viewUpdate.view.state.selection.ranges.map((range: any) => ({
          from: range.from,
          to: range.to,
        }));
        socket.emit('cursor-selection-update', { ranges: selectionRanges });
        throttleTimeout.current = null;
      }, 50);
    }
  };

  const memoizedExtensions = React.useMemo(() => {
    return [
      ...extensions,
      remoteSelectionCompartment.of([remoteSelectionField]),
      EditorView.updateListener.of(handleEditorUpdate)
    ];
  }, [extensions, remoteSelectionCompartment, remoteSelectionField, handleEditorUpdate]);

  return (
    <CodeMirror
      value={code}
      height="calc(100vh - 70px)"
      theme={okaidia}
      extensions={memoizedExtensions}
      onChange={(value) => {
        if (canEdit) { // 只有在 canEdit 為 true 時才允許修改程式碼
          onCodeChange(value);
        }
      }}
      onCreateEditor={(view) => {
        editorViewRef.current = view;
      }}
      className="text-lg"
      readOnly={!canEdit} // 根據 canEdit 屬性設定 readOnly
    />
  );
};

export default React.memo(Editor);