export type YamlPrimitive = string | number | boolean | null;
export type YamlArray = YamlValue[];
export type YamlObject = { [key: string]: YamlValue };
export type YamlValue = YamlPrimitive | YamlArray | YamlObject;

export type NodeType =
	| "string"
	| "number"
	| "boolean"
	| "null"
	| "object"
	| "array";

export interface TreeNode {
	id: string;
	key: string;
	path: string;
	type: NodeType;
	value: YamlPrimitive | undefined;
	children: TreeNode[];
	parentId: string | null;
}

export interface TreeState {
	root: TreeNode;
	nodesById: Map<string, TreeNode>;
}

export interface YamlSchemaProperty {
	type?: string | string[];
	description?: string;
	enum?: YamlValue[];
	default?: YamlValue;
	const?: YamlValue;
	properties?: Record<string, YamlSchemaProperty>;
	items?: YamlSchemaProperty | YamlSchemaProperty[];
	additionalItems?: YamlSchemaProperty | boolean;
	additionalProperties?: YamlSchemaProperty | boolean;
	patternProperties?: Record<string, YamlSchemaProperty>;
	required?: string[];
	$ref?: string;
	allOf?: YamlSchemaProperty[];
	anyOf?: YamlSchemaProperty[];
	oneOf?: YamlSchemaProperty[];
	not?: YamlSchemaProperty;
	if?: YamlSchemaProperty;
	then?: YamlSchemaProperty;
	else?: YamlSchemaProperty;
	definitions?: Record<string, YamlSchemaProperty>;
	$defs?: Record<string, YamlSchemaProperty>;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number | boolean;
	exclusiveMaximum?: number | boolean;
	multipleOf?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: string;
	minItems?: number;
	maxItems?: number;
	uniqueItems?: boolean;
	minProperties?: number;
	maxProperties?: number;
	deprecated?: boolean;
	readOnly?: boolean;
	writeOnly?: boolean;
	examples?: YamlValue[];
	title?: string;
}

export interface YamlSchema extends YamlSchemaProperty {
	$schema?: string;
}
