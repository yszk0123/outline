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

function createTree(text: string, children?: Tree[]): Tree {
  return {
    id: generateId(),
    text,
    children,
  };
}

const initialData: Data = {
  version: VERSION,
  tree: {
    id: generateId(),
    text: 'parent',
    children: [
      { id: generateId(), text: 'child-1' },
      { id: generateId(), text: 'child-2' },
      { id: generateId(), text: 'child-3' },
    ],
  },
};

interface TreeViewProps {
  tree: Tree;
  onChange: (tree: Tree, text: string) => void;
  onMoveUp: (tree: Tree) => void;
  onMoveDown: (tree: Tree) => void;
  onAdd: (tree: Tree) => void;
  onRemove: (tree: Tree) => void;
}

function TreeView({
  tree,
  onChange,
  onMoveUp,
  onMoveDown,
  onAdd,
  onRemove,
}: TreeViewProps) {
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
  const handleMoveDown = useCallback(
    (_event: React.MouseEvent) => {
      onMoveDown(tree);
    },
    [tree, onMoveDown],
  );
  const handleAdd = useCallback(
    (_event: React.MouseEvent) => {
      onAdd(tree);
    },
    [tree, onAdd],
  );
  const handleRemove = useCallback(
    (_event: React.MouseEvent) => {
      onRemove(tree);
    },
    [tree, onRemove],
  );

  return (
    <ul>
      <input type="text" value={tree.text} onChange={handleChange} />
      <button onClick={handleMoveUp}>↑</button>
      <button onClick={handleMoveDown}>↓</button>
      <button onClick={handleAdd}>+</button>
      <button onClick={handleRemove}>-</button>
      {(tree.children || []).map((child, i) => {
        return (
          <li key={i}>
            <TreeView
              tree={child}
              onChange={onChange}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAdd={onAdd}
              onRemove={onRemove}
            />
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
  MOVE_DOWN = 'MOVE_DOWN',
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

type Action =
  | {
      type: ActionType.TEXT_CHANGED;
      payload: { id: string; text: string };
    }
  | {
      type: ActionType.MOVE_UP;
      payload: { id: string };
    }
  | {
      type: ActionType.MOVE_DOWN;
      payload: { id: string };
    }
  | {
      type: ActionType.ADDED;
      payload: { id: string };
    }
  | {
      type: ActionType.REMOVED;
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
      case ActionType.MOVE_DOWN: {
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
          if (index < 0 || index === children.length - 1) {
            return;
          }

          parent.children = [
            ...children.slice(0, index),
            children[index + 1],
            tree,
            ...children.slice(index + 2),
          ];
        });
        return;
      }
      case ActionType.ADDED: {
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
          if (index < 0) {
            return;
          }

          const newTree = createTree('');

          parent.children = [
            ...children.slice(0, index + 1),
            newTree,
            ...children.slice(index + 1),
          ];
        });
        return;
      }
      case ActionType.REMOVED: {
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
          if (index < 0) {
            return;
          }

          children.splice(index, 1);
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
  const handleMoveDown = useCallback((tree: Tree) => {
    dispatch({ type: ActionType.MOVE_DOWN, payload: { id: tree.id } });
  }, []);
  const handleAdd = useCallback((tree: Tree) => {
    dispatch({ type: ActionType.ADDED, payload: { id: tree.id } });
  }, []);
  const handleRemove = useCallback((tree: Tree) => {
    dispatch({ type: ActionType.REMOVED, payload: { id: tree.id } });
  }, []);

  return (
    <div>
      <TreeView
        tree={data.tree}
        onChange={handleChange}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
      <button onClick={handleCopy}>Copy</button>
    </div>
  );
}
