import { beforeEach, describe, expect, it } from "vitest";
import {
	findNode,
	findNodeByPath,
	fromYaml,
	isDescendant,
	resetIdCounter,
	toYaml,
} from "../tree";

beforeEach(() => {
	resetIdCounter();
});

describe("fromYaml / toYaml round-trip", () => {
	it("round-trips a primitive", () => {
		const state = fromYaml("hello");
		expect(toYaml(state.root)).toBe("hello");
	});

	it("round-trips a flat object", () => {
		const input = { a: 1, b: "two" };
		const state = fromYaml(input);
		expect(toYaml(state.root)).toEqual(input);
	});

	it("round-trips a nested object", () => {
		const input = { x: { y: { z: true } } };
		const state = fromYaml(input);
		expect(toYaml(state.root)).toEqual(input);
	});

	it("round-trips an array", () => {
		const input = [1, "two", null, [3]];
		const state = fromYaml(input);
		expect(toYaml(state.root)).toEqual(input);
	});

	it("round-trips null", () => {
		const state = fromYaml(null);
		expect(toYaml(state.root)).toBe(null);
	});
});

describe("ID generation", () => {
	it("generates unique IDs for all nodes", () => {
		const state = fromYaml({ a: 1, b: { c: 2, d: [3, 4] } });
		const ids = [...state.nodesById.keys()];
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("does not reuse IDs across multiple fromYaml calls", () => {
		const state1 = fromYaml({ a: 1 });
		const state2 = fromYaml({ b: 2 });
		const ids1 = [...state1.nodesById.keys()];
		const ids2 = [...state2.nodesById.keys()];
		const allIds = [...ids1, ...ids2];
		expect(new Set(allIds).size).toBe(allIds.length);
	});
});

describe("nodesById", () => {
	it("contains every node in the tree", () => {
		const state = fromYaml({ a: 1, b: { c: 2 } });
		expect(state.nodesById.size).toBe(4);
	});

	it("maps IDs to correct nodes", () => {
		const state = fromYaml({ a: 1 });
		const root = state.root;
		expect(state.nodesById.get(root.id)).toBe(root);
		expect(state.nodesById.get(root.children[0].id)).toBe(root.children[0]);
	});
});

describe("node paths", () => {
	it("assigns / to the root", () => {
		const state = fromYaml({ a: 1 });
		expect(state.root.path).toBe("/");
	});

	it("assigns /key to direct children of root", () => {
		const state = fromYaml({ a: 1, b: 2 });
		expect(state.root.children.map((c) => c.path).sort()).toEqual(["/a", "/b"]);
	});

	it("assigns nested paths", () => {
		const state = fromYaml({ x: { y: 1 } });
		const yNode = state.root.children[0].children[0];
		expect(yNode.path).toBe("/x/y");
	});

	it("uses numeric indices for arrays", () => {
		const state = fromYaml([10, 20]);
		expect(state.root.children.map((c) => c.path)).toEqual(["/0", "/1"]);
	});
});

describe("findNode", () => {
	it("returns the node with the given ID", () => {
		const state = fromYaml({ a: 1 });
		const child = state.root.children[0];
		expect(findNode(state, child.id)).toBe(child);
	});

	it("returns undefined for unknown IDs", () => {
		const state = fromYaml({ a: 1 });
		expect(findNode(state, "nonexistent")).toBeUndefined();
	});
});

describe("findNodeByPath", () => {
	it("returns root for /", () => {
		const state = fromYaml({ a: 1 });
		expect(findNodeByPath(state, "/")).toBe(state.root);
	});

	it("finds a nested node", () => {
		const state = fromYaml({ a: { b: 2 } });
		const node = findNodeByPath(state, "/a/b");
		expect(node).toBeDefined();
		expect(node!.value).toBe(2);
	});

	it("returns undefined for missing paths", () => {
		const state = fromYaml({ a: 1 });
		expect(findNodeByPath(state, "/b")).toBeUndefined();
	});
});

describe("isDescendant", () => {
	it("returns true for a direct child", () => {
		const state = fromYaml({ a: 1 });
		const child = state.root.children[0];
		expect(isDescendant(state, child.id, state.root.id)).toBe(true);
	});

	it("returns true for a deeply nested descendant", () => {
		const state = fromYaml({ x: { y: { z: 1 } } });
		const z = state.root.children[0].children[0].children[0];
		expect(isDescendant(state, z.id, state.root.id)).toBe(true);
	});

	it("returns true when nodeId equals potentialAncestorId", () => {
		const state = fromYaml({ a: 1 });
		expect(isDescendant(state, state.root.id, state.root.id)).toBe(true);
	});

	it("returns false for a sibling", () => {
		const state = fromYaml({ a: 1, b: 2 });
		const [a, b] = state.root.children;
		expect(isDescendant(state, a.id, b.id)).toBe(false);
	});

	it("returns false for a node in a different subtree", () => {
		const state = fromYaml({ left: { l: 1 }, right: { r: 2 } });
		const l = state.root.children[0].children[0];
		const right = state.root.children[1];
		expect(isDescendant(state, l.id, right.id)).toBe(false);
	});

	it("returns false when potential ancestor is a leaf descendant", () => {
		const state = fromYaml({ a: { b: 1 } });
		const leaf = state.root.children[0].children[0];
		expect(isDescendant(state, state.root.id, leaf.id)).toBe(false);
	});
});
