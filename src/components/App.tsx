import React, { useCallback, useReducer } from 'react';
import produce from 'immer';

type Version = '0.1.0';

const VERSION: Version = '0.1.0';

function copyToClipboard(data: Data) {
  const formattedData = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(formattedData);
}

type Tree = { id: string; text: string; children?: Tree[] };

type Data = { version: Version; tree: Tree };

function generateId(): string {
  return `${Math.random() * 1000 * 1000 + Date.now()}`;
}

const initialData: Data = {
  version: VERSION,
  tree: {
    id: generateId(),
    text: 'parent',
    children: [
      { id: generateId(), text: 'child-1' },
      { id: generateId(), text: 'child-2' },
    ],
  },
};

interface TreeViewProps {
  tree: Tree;
  onChange: (tree: Tree, text: string) => void;
  onMoveUp: (tree: Tree) => void;
}

function TreeView({ tree, onChange, onMoveUp }: TreeViewProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.currentTarget.value;
      onChange(tree, text);
    },
    [tree, onChange],
  );
  const handleMoveUp = useCallback(
    (_event: React.MouseEvent) => {
      onMoveUp(tree);
    },
    [tree, onMoveUp],
  );

  return (
    <ul>
      <input type="text" value={tree.text} onChange={handleChange} />
      <button onClick={handleMoveUp}>Up</button>
      {(tree.children || []).map((child, i) => {
        return (
          <li key={i}>
            <TreeView tree={child} onChange={onChange} onMoveUp={onMoveUp} />
          </li>
        );
      })}
    </ul>
  );
}

function updateTree(
  tree: Tree,
  id: string,
  updateFn: (tree: Tree, parent: Tree | undefined) => void,
  parent?: Tree,
): void {
  if (tree.id === id) {
    updateFn(tree, parent);
  }

  if (tree.children) {
    tree.children.forEach(child => {
      updateTree(child, id, updateFn, tree);
    });
  }
}

enum ActionType {
  TEXT_CHANGED = 'TEXT_CHANGED',
  MOVE_UP = 'MOVE_UP',
}

type Action =
  | {
      type: ActionType.TEXT_CHANGED;
      payload: { id: string; text: string };
    }
  | {
      type: ActionType.MOVE_UP;
      payload: { id: string };
    };

function reducer(state: Data, action: Action): Data {
  return produce(state, (data: Data) => {
    switch (action.type) {
      case ActionType.TEXT_CHANGED: {
        const { id, text } = action.payload;
        updateTree(data.tree, id, tree => {
          tree.text = text;
        });
        return;
      }
      case ActionType.MOVE_UP: {
        const { id } = action.payload;
        updateTree(data.tree, id, (tree, parent) => {
          if (!parent) {
            return;
          }

          const children = parent.children;
          if (!children) {
            return;
          }

          const index = children.findIndex(e => e.id === tree.id);
          if (index <= 0) {
            return;
          }

          parent.children = [
            ...children.slice(0, index - 1),
            tree,
            children[index - 1],
            ...children.slice(index + 1),
          ];
        });
        return;
      }
    }
  });
}

export function App() {
  const [data, dispatch] = useReducer(reducer, initialData);
  const handleCopy = useCallback(() => {
    copyToClipboard(data);
  }, [data]);
  const handleChange = useCallback((tree: Tree, text: string) => {
    dispatch({ type: ActionType.TEXT_CHANGED, payload: { id: tree.id, text } });
  }, []);
  const handleMoveUp = useCallback((tree: Tree) => {
    dispatch({ type: ActionType.MOVE_UP, payload: { id: tree.id } });
  }, []);

  return (
    <div>
      <TreeView
        tree={data.tree}
        onChange={handleChange}
        onMoveUp={handleMoveUp}
      />
      <button onClick={handleCopy}>Copy</button>
    </div>
  );
}
