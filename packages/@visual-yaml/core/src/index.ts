export {
	computeDiff,
	type DiffEntry,
	type DiffType,
	getDiffPaths,
} from "./diff";
export { History } from "./history";

export {
	addProperty,
	changeType,
	duplicateNode,
	insertNode,
	insertProperty,
	moveNode,
	removeNode,
	reorderChildren,
	reorderChildrenMulti,
	setKey,
	setValue,
} from "./operations";
export {
	clearSchemaCache,
	getPropertySchema,
	resolveRef,
	resolveSchema,
} from "./schema";
export { getAncestorIds, type SearchMatch, searchNodes } from "./search";
export {
	buildSubtree,
	findNode,
	findNodeByPath,
	fromYaml,
	generateId,
	getNodeType,
	isDescendant,
	reparentSubtree,
	resetIdCounter,
	toYaml,
} from "./tree";
export type {
	NodeType,
	TreeNode,
	TreeState,
	YamlArray,
	YamlObject,
	YamlPrimitive,
	YamlSchema,
	YamlSchemaProperty,
	YamlValue,
} from "./types";
export { type ValidationResult, validateNode } from "./validate";

export { parseYaml, stringifyYaml } from "./yaml-utils";
