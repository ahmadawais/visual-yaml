import { parse, stringify } from "yaml";
import type { YamlValue } from "./types";

export function parseYaml(input: string): YamlValue {
  return parse(input) as YamlValue;
}

export function stringifyYaml(value: YamlValue): string {
  return stringify(value);
}
