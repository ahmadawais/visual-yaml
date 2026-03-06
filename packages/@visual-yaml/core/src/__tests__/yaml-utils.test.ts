import { describe, expect, it } from "vitest";
import { fromYaml, parseYaml, stringifyYaml, toYaml } from "../index";

describe("parseYaml", () => {
	it("parses a simple YAML string", () => {
		const input = "name: my-app\nversion: 1.0.0\n";
		const result = parseYaml(input);
		expect(result).toEqual({ name: "my-app", version: "1.0.0" });
	});

	it("parses nested YAML objects", () => {
		const input = `
services:
  web:
    image: nginx
    ports:
      - "80:80"
`;
		const result = parseYaml(input);
		expect(result).toEqual({
			services: {
				web: {
					image: "nginx",
					ports: ["80:80"],
				},
			},
		});
	});

	it("parses YAML arrays", () => {
		const input = "- one\n- two\n- three\n";
		const result = parseYaml(input);
		expect(result).toEqual(["one", "two", "three"]);
	});

	it("parses YAML booleans and null", () => {
		const input = "enabled: true\ndisabled: false\nempty: null\n";
		const result = parseYaml(input);
		expect(result).toEqual({ enabled: true, disabled: false, empty: null });
	});
});

describe("stringifyYaml", () => {
	it("serializes an object to YAML", () => {
		const value = { name: "test", version: "1.0.0" };
		const result = stringifyYaml(value);
		expect(result).toContain("name: test");
		expect(result).toContain("version: 1.0.0");
	});

	it("serializes arrays to YAML", () => {
		const value = ["one", "two", "three"];
		const result = stringifyYaml(value);
		expect(result).toContain("- one");
		expect(result).toContain("- two");
		expect(result).toContain("- three");
	});
});

describe("YAML round-trip through tree", () => {
	it("round-trips a YAML object through the tree model", () => {
		const input = {
			services: {
				web: {
					image: "nginx",
					ports: ["80:80", "443:443"],
				},
				db: {
					image: "postgres:16",
					environment: {
						POSTGRES_DB: "app",
					},
				},
			},
		};

		const tree = fromYaml(input);
		const output = toYaml(tree.root);
		expect(output).toEqual(input);
	});

	it("round-trips a YAML string through parseYaml/stringifyYaml", () => {
		const yamlInput = `name: my-service
version: "3.8"
services:
  api:
    image: node:20
    ports:
      - "3000:3000"
`;
		const parsed = parseYaml(yamlInput);
		const serialized = stringifyYaml(parsed);
		const reparsed = parseYaml(serialized);
		expect(reparsed).toEqual(parsed);
	});
});
