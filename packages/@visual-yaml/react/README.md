# @visual-yaml/react

React UI components for [visual-yaml](https://github.com/vercel-labs/visual-yaml) — the visual YAML editor. Schema-aware, embeddable, extensible.

Tree view, form view, diff view, search, breadcrumbs, and more — all themeable via CSS custom properties.

## Install

```bash
npm install @visual-yaml/react @visual-yaml/core
```

**Peer dependency:** React 18 or 19.

## Quick start

`YamlEditor` is the batteries-included component — it bundles a tree sidebar, form editor, search bar, and keyboard navigation.

```tsx
import { useState } from "react";
import { YamlEditor } from "@visual-yaml/react";

function App() {
  const [value, setValue] = useState({ hello: "world" });
  return <YamlEditor value={value} onChange={setValue} />;
}
```

### Props

<table>
  <thead>
    <tr>
      <th>Prop</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>value</code></td>
      <td><code>YamlValue</code></td>
      <td>Controlled YAML value</td>
    </tr>
    <tr>
      <td><code>defaultValue</code></td>
      <td><code>YamlValue</code></td>
      <td>Uncontrolled initial value</td>
    </tr>
    <tr>
      <td><code>onChange</code></td>
      <td><code>(value: YamlValue) =&gt; void</code></td>
      <td>Change callback</td>
    </tr>
    <tr>
      <td><code>schema</code></td>
      <td><code>YamlSchema | null</code></td>
      <td>Optional YAML schema for validation and hints</td>
    </tr>
    <tr>
      <td><code>readOnly</code></td>
      <td><code>boolean</code></td>
      <td>Disable editing</td>
    </tr>
    <tr>
      <td><code>sidebarOpen</code></td>
      <td><code>boolean</code></td>
      <td>Show/hide tree sidebar</td>
    </tr>
    <tr>
      <td><code>treeShowValues</code></td>
      <td><code>boolean</code></td>
      <td>Display values in tree nodes</td>
    </tr>
    <tr>
      <td><code>treeShowCounts</code></td>
      <td><code>boolean</code></td>
      <td>Display child counts in tree nodes</td>
    </tr>
    <tr>
      <td><code>editorShowDescriptions</code></td>
      <td><code>boolean</code></td>
      <td>Show schema descriptions in the form</td>
    </tr>
    <tr>
      <td><code>editorShowCounts</code></td>
      <td><code>boolean</code></td>
      <td>Show child counts in the form</td>
    </tr>
    <tr>
      <td><code>height</code> / <code>width</code></td>
      <td><code>string | number</code></td>
      <td>Container dimensions</td>
    </tr>
    <tr>
      <td><code>className</code> / <code>style</code></td>
      <td>—</td>
      <td>Standard container styling</td>
    </tr>
  </tbody>
</table>

## Composable API

For full control, use the lower-level primitives:

```tsx
import { VisualYaml, TreeView, FormView, SearchBar } from "@visual-yaml/react";

function CustomEditor({ value, onChange }) {
  return (
    <VisualYaml value={value} onChange={onChange}>
      <SearchBar />
      <TreeView />
      <FormView />
    </VisualYaml>
  );
}
```

### Components

<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>VisualYaml</code></td>
      <td>Context provider — manages tree state, history, and search</td>
    </tr>
    <tr>
      <td><code>TreeView</code></td>
      <td>Collapsible tree with drag-and-drop, keyboard nav, and context menu</td>
    </tr>
    <tr>
      <td><code>FormView</code></td>
      <td>Inline key/value editor with schema-aware inputs</td>
    </tr>
    <tr>
      <td><code>DiffView</code></td>
      <td>Side-by-side structural diff between two YAML values</td>
    </tr>
    <tr>
      <td><code>SearchBar</code></td>
      <td>Cmd+F search with match navigation</td>
    </tr>
    <tr>
      <td><code>Breadcrumbs</code></td>
      <td>Path breadcrumbs with typeahead navigation</td>
    </tr>
    <tr>
      <td><code>ContextMenu</code></td>
      <td>Right-click menu for tree operations</td>
    </tr>
  </tbody>
</table>

### Hooks

<table>
  <thead>
    <tr>
      <th>Hook</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>useStudio()</code></td>
      <td>Access <code>state</code> and <code>actions</code> from the nearest <code>VisualYaml</code> provider</td>
    </tr>
  </tbody>
</table>

## Theming

All components read CSS custom properties for colors, fonts, and spacing. Override them on a parent element or pass them via `style`:

```tsx
<YamlEditor
  value={data}
  style={{
    "--vj-bg": "#ffffff",
    "--vj-text": "#111111",
    "--vj-border": "#e5e5e5",
    "--vj-accent": "#2563eb",
    "--vj-font": "'Fira Code', monospace",
  }}
/>
```

See the [default variable list](src/yaml-editor.tsx) for all available tokens.

## License

Apache-2.0
