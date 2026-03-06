import type {
	NodeType,
	TreeNode,
	TreeState,
	YamlArray,
	YamlObject,
	YamlPrimitive,
	YamlValue,
} from "./types";

let nextId = 0;

export function generateId(): string {
	return `node_${++nextId}`;
}

export function resetIdCounter(): void {
	nextId = 0;
}

export function getNodeType(value: YamlValue): NodeType {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value as NodeType;
}

export function buildSubtree(
	key: string,
	value: YamlValue,
	parentPath: string,
	parentId: string | null,
	nodesById: Map<string, TreeNode>,
): TreeNode {
	const id = generateId();
	const path = parentPath ? `${parentPath}/${key}` : `/${key}`;
	const type = getNodeType(value);

	const node: TreeNode = {
		id,
		key,
		path,
		type,
		value:
			type === "object" || type === "array"
				? undefined
				: (value as YamlPrimitive),
		children: [],
		parentId,
	};

	nodesById.set(id, node);

	if (type === "object" && value !== null) {
		const obj = value as YamlObject;
		node.children = Object.keys(obj).map((childKey) =>
			buildSubtree(childKey, obj[childKey]!, path, id, nodesById),
		);
	} else if (type === "array") {
		const arr = value as YamlArray;
		node.children = arr.map((item, index) =>
			buildSubtree(String(index), item, path, id, nodesById),
		);
	}

	return node;
}

export function fromYaml(value: YamlValue): TreeState {
	const nodesById = new Map<string, TreeNode>();

	const rootType = getNodeType(value);
	const root: TreeNode = {
		id: generateId(),
		key: "",
		path: "/",
		type: rootType,
		value:
			rootType === "object" || rootType === "array"
				? undefined
				: (value as YamlPrimitive),
		children: [],
		parentId: null,
	};

	nodesById.set(root.id, root);

	if (rootType === "object" && value !== null) {
		const obj = value as YamlObject;
		root.children = Object.keys(obj).map((key) =>
			buildSubtree(key, obj[key]!, "", root.id, nodesById),
		);
	} else if (rootType === "array") {
		const arr = value as YamlArray;
		root.children = arr.map((item, index) =>
			buildSubtree(String(index), item, "", root.id, nodesById),
		);
	}

	return { root, nodesById };
}

export function toYaml(node: TreeNode): YamlValue {
	switch (node.type) {
		case "object": {
			const obj: YamlObject = {};
			for (const child of node.children) {
				obj[child.key] = toYaml(child);
			}
			return obj;
		}
		case "array":
			return node.children.map((child) => toYaml(child));
		default:
			return node.value as YamlValue;
	}
}

/**
 * Clone a subtree with updated key, path, and parentId while preserving
 * all original node IDs. Used for cross-parent moves where identity must
 * be retained so that UI state (expanded, selected, etc.) stays valid.
 */
export function reparentSubtree(
	node: TreeNode,
	newKey: string,
	parentPath: string,
	newParentId: string,
): TreeNode {
	const newPath = parentPath ? `${parentPath}/${newKey}` : `/${newKey}`;
	return {
		...node,
		key: newKey,
		path: newPath,
		parentId: newParentId,
		children: node.children.map((child, i) =>
			reparentSubtree(
				child,
				node.type === "array" ? String(i) : child.key,
				newPath,
				node.id,
			),
		),
	};
}

export function findNode(
	state: TreeState,
	nodeId: string,
): TreeNode | undefined {
	return state.nodesById.get(nodeId);
}

export function findNodeByPath(
	state: TreeState,
	path: string,
): TreeNode | undefined {
	if (path === "/") return state.root;

	const segments = path.split("/").filter(Boolean);
	let current = state.root;

	for (const segment of segments) {
		const child = current.children.find((c) => c.key === segment);
		if (!child) return undefined;
		current = child;
	}

	return current;
}

/**
 * Check whether `nodeId` is a descendant of `potentialAncestorId` by walking
 * up `parentId` links. Returns `true` when the two IDs are equal (a node is
 * considered a descendant of itself).
 */
export function isDescendant(
	tree: TreeState,
	nodeId: string,
	potentialAncestorId: string,
): boolean {
	let current = tree.nodesById.get(nodeId);
	while (current) {
		if (current.id === potentialAncestorId) return true;
		current = current.parentId
			? tree.nodesById.get(current.parentId)
			: undefined;
	}
	return false;
}
