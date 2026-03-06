import type { YamlSchema, YamlValue } from "@visual-yaml/core";
import { parseYaml, resolveSchema, stringifyYaml } from "@visual-yaml/core";
import { onWatcherCleanup, shallowRef, watch } from "vue";

export interface Sample {
	name: string;
	filename: string;
	data: YamlValue;
}

export function useYamlDocument(initial: Sample) {
	const yamlValue = shallowRef<YamlValue>(initial.data);
	const originalYaml = shallowRef<YamlValue>(structuredClone(initial.data));
	const filename = shallowRef(initial.filename);
	const activeSample = shallowRef(initial.filename);
	const schema = shallowRef<YamlSchema | null>(null);
	const rawText = shallowRef(stringifyYaml(initial.data));
	const rawError = shallowRef<string | null>(null);
	const parseError = shallowRef<string | null>(null);

	function setDocument(data: YamlValue, fname: string) {
		yamlValue.value = data;
		originalYaml.value = structuredClone(data);
		filename.value = fname;
		activeSample.value = fname;
		schema.value = null;
		rawText.value = stringifyYaml(data);
		rawError.value = null;
		parseError.value = null;
	}

	watch(
		[yamlValue, filename],
		([val, fname]) => {
			let cancelled = false;
			onWatcherCleanup(() => {
				cancelled = true;
			});
			schema.value = null;
			resolveSchema(val as YamlValue, fname)
				.then((s) => {
					if (!cancelled) schema.value = s;
				})
				.catch(() => {});
		},
		{ immediate: true },
	);

	function loadYaml(text: string, fname: string) {
		try {
			setDocument(parseYaml(text), fname);
		} catch {
			parseError.value = "Invalid YAML";
		}
	}

	function loadSample(fname: string, samples: Sample[]) {
		const sample = samples.find((s) => s.filename === fname);
		if (sample) setDocument(sample.data, fname);
	}

	function handleYamlChange(val: YamlValue) {
		yamlValue.value = val;
		rawText.value = stringifyYaml(val);
	}

	function handleRawChange(newText: string) {
		rawText.value = newText;
		try {
			const parsed = parseYaml(newText);
			rawError.value = null;
			yamlValue.value = parsed;
		} catch (e) {
			rawError.value = e instanceof Error ? e.message : "Invalid YAML";
		}
	}

	return {
		yamlValue,
		originalYaml,
		filename,
		activeSample,
		schema,
		rawText,
		rawError,
		parseError,
		loadYaml,
		loadSample,
		handleYamlChange,
		handleRawChange,
	};
}
