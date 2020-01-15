import React, { useCallback, useState } from 'react';
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
  tree: { id: generateId(), text: '' },
};

interface TreeViewProps {
  tree: Tree;
  onChange: (tree: Tree, text: string) => void;
}

function TreeView({ tree, onChange }: TreeViewProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const text = event.currentTarget.value;
      onChange(tree, text);
    },
    [tree, onChange],
  );

  return (
    <ul>
      <input type="text" value={tree.text} onChange={handleChange} />
      {(tree.children || []).map((child, i) => {
        return (
          <li key={i}>
            <TreeView tree={child} onChange={onChange} />
          </li>
        );
      })}
    </ul>
  );
}

function updateTree(tree: Tree, updateFn: (tree: Tree) => void): Tree {
  return produce(tree, (draft: Tree) => {
    updateTreeInner(draft, draft.id, updateFn);
  });
}

function updateTreeInner(
  tree: Tree,
  id: string,
  updateFn: (tree: Tree) => void,
): void {
  if (tree.id === id) {
    updateFn(tree);
  }

  if (tree.children) {
    tree.children.forEach(child => {
      updateTreeInner(child, id, updateFn);
    });
  }
}

export function App() {
  const [data, setData] = useState(initialData);
  const handleCopy = useCallback(() => {
    copyToClipboard(data);
  }, [data]);
  const handleChange = useCallback(
    (tree: Tree, text: string) => {
      const newTree = updateTree(tree, e => {
        e.text = text;
      });
      const newData = { ...data, tree: newTree };
      setData(newData);
    },
    [data],
  );

  return (
    <div>
      <TreeView tree={data.tree} onChange={handleChange} />
      <button onClick={handleCopy}>Copy</button>
    </div>
  );
}
