import type {
  YamlSchema,
  YamlSchemaProperty,
  YamlValue,
  YamlObject,
} from "./types";

const KNOWN_SCHEMAS: Record<string, string> = {
  "docker-compose.yml":
    "https://json.schemastore.org/docker-compose.json",
  "docker-compose.yaml":
    "https://json.schemastore.org/docker-compose.json",
  ".github/workflows/*.yml":
    "https://json.schemastore.org/github-workflow.json",
  ".github/workflows/*.yaml":
    "https://json.schemastore.org/github-workflow.json",
  ".github/actions/action.yml":
    "https://json.schemastore.org/github-action.json",
  "mkdocs.yml": "https://json.schemastore.org/mkdocs-1.0.json",
  ".pre-commit-config.yaml":
    "https://json.schemastore.org/pre-commit-config.json",
  "pubspec.yaml": "https://json.schemastore.org/pubspec.json",
  ".prettierrc.yaml": "https://json.schemastore.org/prettierrc",
  ".eslintrc.yaml": "https://json.schemastore.org/eslintrc",
  ".eslintrc.yml": "https://json.schemastore.org/eslintrc",
  "swagger.yaml": "https://json.schemastore.org/swagger-2.0.json",
  "openapi.yaml": "https://json.schemastore.org/openapi-3.0.json",
  ".travis.yml": "https://json.schemastore.org/travis.json",
  "appveyor.yml": "https://json.schemastore.org/appveyor.json",
  ".circleci/config.yml":
    "https://json.schemastore.org/circleciconfig.json",
  "renovate.yaml": "https://json.schemastore.org/renovate.json",
  ".renovaterc.yaml": "https://json.schemastore.org/renovate.json",
};

const MAX_SCHEMA_CACHE = 50;
const schemaCache = new Map<string, YamlSchema>();

async function fetchSchema(url: string): Promise<YamlSchema | null> {
  if (schemaCache.has(url)) {
    return schemaCache.get(url)!;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const schema = (await res.json()) as YamlSchema;
    if (schemaCache.size >= MAX_SCHEMA_CACHE) {
      const oldest = schemaCache.keys().next().value;
      if (oldest !== undefined) schemaCache.delete(oldest);
    }
    schemaCache.set(url, schema);
    return schema;
  } catch {
    return null;
  }
}

export async function resolveSchema(
  value: YamlValue,
  filename?: string,
): Promise<YamlSchema | null> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as YamlObject)["$schema"] === "string"
  ) {
    const url = (value as YamlObject)["$schema"] as string;
    const schema = await fetchSchema(url);
    if (schema) return schema;
  }

  if (filename) {
    const base = filename.split("/").pop() ?? filename;
    const knownUrl = KNOWN_SCHEMAS[base];
    if (knownUrl) {
      return fetchSchema(knownUrl);
    }
  }

  return null;
}

function findDefinition(
  root: YamlSchemaProperty,
  refPath: string,
): YamlSchemaProperty | undefined {
  if (!refPath.startsWith("#/")) return undefined;
  const segments = refPath.slice(2).split("/");
  let current: unknown = root;

  for (const seg of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[seg];
  }

  return current as YamlSchemaProperty | undefined;
}

/**
 * Resolve `$ref` pointers and merge `allOf` within a schema.
 * `visited` tracks refs to prevent infinite cycles.
 */
export function resolveRef(
  prop: YamlSchemaProperty,
  root: YamlSchemaProperty,
  visited?: Set<string>,
): YamlSchemaProperty {
  const seen = visited ?? new Set<string>();

  if (prop.$ref) {
    if (seen.has(prop.$ref)) return prop;
    seen.add(prop.$ref);
    const resolved = findDefinition(root, prop.$ref);
    if (resolved) {
      return resolveRef(resolved, root, seen);
    }
    return prop;
  }

  if (prop.allOf && prop.allOf.length > 0) {
    return mergeAllOf(prop, root, seen);
  }

  return prop;
}

function mergeAllOf(
  prop: YamlSchemaProperty,
  root: YamlSchemaProperty,
  visited: Set<string>,
): YamlSchemaProperty {
  const merged: YamlSchemaProperty = { ...prop };
  delete merged.allOf;

  for (const sub of prop.allOf!) {
    const resolved = resolveRef(sub, root, new Set(visited));
    if (resolved.type && !merged.type) merged.type = resolved.type;
    if (resolved.properties) {
      merged.properties = { ...merged.properties, ...resolved.properties };
    }
    if (resolved.required) {
      merged.required = [
        ...new Set([...(merged.required ?? []), ...resolved.required]),
      ];
    }
    if (
      resolved.additionalProperties !== undefined &&
      merged.additionalProperties === undefined
    ) {
      merged.additionalProperties = resolved.additionalProperties;
    }
    if (resolved.items && !merged.items) merged.items = resolved.items;
    if (resolved.description && !merged.description)
      merged.description = resolved.description;
    if (resolved.title && !merged.title) merged.title = resolved.title;
    if (resolved.enum && !merged.enum) merged.enum = resolved.enum;
    if (resolved.minimum !== undefined && merged.minimum === undefined)
      merged.minimum = resolved.minimum;
    if (resolved.maximum !== undefined && merged.maximum === undefined)
      merged.maximum = resolved.maximum;
    if (resolved.minLength !== undefined && merged.minLength === undefined)
      merged.minLength = resolved.minLength;
    if (resolved.maxLength !== undefined && merged.maxLength === undefined)
      merged.maxLength = resolved.maxLength;
    if (resolved.pattern && !merged.pattern) merged.pattern = resolved.pattern;
    if (resolved.format && !merged.format) merged.format = resolved.format;
  }

  return merged;
}

export function getPropertySchema(
  schema: YamlSchema | YamlSchemaProperty,
  path: string,
  rootSchema?: YamlSchemaProperty,
): YamlSchemaProperty | undefined {
  const root = rootSchema ?? schema;
  const segments = path.split("/").filter(Boolean);
  let current: YamlSchemaProperty | undefined = resolveRef(schema, root);

  for (const seg of segments) {
    if (!current) return undefined;
    current = resolveRef(current, root);

    if (current.properties?.[seg]) {
      current = resolveRef(current.properties[seg], root);
      continue;
    }

    if (current.patternProperties) {
      const match = Object.entries(current.patternProperties).find(
        ([pattern]) => {
          try {
            return new RegExp(pattern).test(seg);
          } catch {
            return false;
          }
        },
      );
      if (match) {
        current = resolveRef(match[1], root);
        continue;
      }
    }

    if (
      current.additionalProperties &&
      typeof current.additionalProperties === "object"
    ) {
      current = resolveRef(current.additionalProperties, root);
      continue;
    }

    if (current.items) {
      if (Array.isArray(current.items)) {
        const idx = Number(seg);
        if (!isNaN(idx) && current.items[idx]) {
          current = resolveRef(current.items[idx], root);
          continue;
        }
      } else {
        current = resolveRef(current.items, root);
        continue;
      }
    }

    if (current.anyOf || current.oneOf) {
      const variants = current.anyOf ?? current.oneOf ?? [];
      let found: YamlSchemaProperty | undefined;
      for (const variant of variants) {
        const resolved = resolveRef(variant, root);
        found = getPropertySchema(resolved, seg, root);
        if (found) break;
      }
      if (found) {
        current = found;
        continue;
      }
      return undefined;
    }

    return undefined;
  }

  return current;
}

export function clearSchemaCache(): void {
  schemaCache.clear();
}
