import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/client/spec.ts
/**
* Wrap a bare component object into a col root. Returns null when `value` is
* not component-shaped (no usable `type`). `panel`/`append` live on the root
* spec, so they are hoisted onto the wrapper.
*/
function wrapSingleComponentRoot(value) {
	if (typeof value !== "object" || value === null) return null;
	const v = value;
	if (typeof v.type !== "string" || v.type === "") return null;
	const root = {
		type: "col",
		items: [value]
	};
	if (v.panel === true) root.panel = true;
	if (v.append === true) root.append = true;
	return root;
}
//#endregion
//#region src/client/genui-runtime/schema.ts
/** Canonical enum domains shared by schema validation and repair. */
const TEXT_SIZES = [
	"h1",
	"h2",
	"h3",
	"body",
	"muted",
	"caption"
];
const BUTTON_TONES = [
	"primary",
	"danger",
	"success",
	"ghost"
];
const BADGE_TONES = [
	"success",
	"warn",
	"danger",
	"accent"
];
const INPUT_TYPES = [
	"text",
	"email",
	"password",
	"color"
];
const CALLOUT_TONES = [
	"info",
	"success",
	"warning",
	"error"
];
const CHART_KINDS = [
	"bars",
	"line",
	"donut"
];
const PLOT_KINDS = [
	"line",
	"area",
	"scatter"
];
const MEDIA_ASPECT_RATIOS = [
	"16:9",
	"4:3",
	"1:1",
	"9:16"
];
const MESH_SHAPES = [
	"box",
	"sphere",
	"cone",
	"cylinder",
	"torus"
];
const FILE_TYPES = ["file", "dir"];
const DIAGRAM_KINDS = [
	"architecture",
	"it-state",
	"flowchart",
	"sequence",
	"state",
	"er",
	"timeline",
	"swimlane",
	"quadrant",
	"radar",
	"loop",
	"nested",
	"tree",
	"org-chart",
	"layers",
	"venn",
	"pyramid",
	"bar",
	"line",
	"gantt",
	"scatter",
	"high-level",
	"process",
	"medallion",
	"data-flow",
	"dp-integration",
	"dp-security-matrix"
];
const DIAGRAM_NODE_TYPES = [
	"focal",
	"backend",
	"store",
	"external",
	"input",
	"optional",
	"security"
];
const DIAGRAM_VARIANTS = [
	"light",
	"dark",
	"editorial"
];
const DIAGRAM_EDGE_KINDS = [
	"solid",
	"dashed",
	"accent",
	"link"
];
const DIAGRAM_ROUTES = [
	"auto",
	"orthogonal",
	"straight"
];
const ECHART_PRESETS = [
	"bar",
	"line",
	"area",
	"pie",
	"scatter",
	"radar",
	"gauge",
	"funnel",
	"treemap",
	"sankey",
	"graph",
	"heatmap",
	"bigline"
];
/** Oversized single-number stat (one per fence as the visual anchor). */
const STAT_SIZES = ["hero"];
/** Progress shapes: a track (default) or a circular gauge. */
const PROGRESS_VARIANTS = ["bar", "ring"];
/** Semantic card surfaces. */
const CARD_TONES = [
	"info",
	"success",
	"warning",
	"danger"
];
/** Hero cover tones. */
const HERO_TONES = [
	"accent",
	"success",
	"warning",
	"danger"
];
/** Table cell renderers (`table.types`, one entry per column). */
const TABLE_CELL_TYPES = [
	"text",
	"num",
	"delta",
	"bar",
	"badge",
	"spark",
	"ring",
	"index",
	"group"
];
const schema = (required, fields, aliases = {}, options = {}) => {
	const optional = Object.fromEntries(Object.entries(fields).filter(([field]) => field !== "type" && !required.includes(field)));
	const oneOfRequired = options.oneOfRequired ?? [];
	const conditionalRequired = options.conditionalRequired ?? [];
	return {
		required,
		fields,
		optional,
		aliases,
		oneOfRequired,
		conditionalRequired,
		rules: [...oneOfRequired.map((fieldsInRule) => ({
			kind: "one-of-required",
			fields: fieldsInRule
		})), ...conditionalRequired],
		enums: options.enums ?? {},
		nested: options.nested ?? {},
		...options.validator === void 0 ? {} : { validator: options.validator }
	};
};
const recordSchema = (required, fields, nested = {}, enums = {}) => ({
	required,
	fields,
	enums,
	nested
});
const nodeFields = {
	type: "string",
	span: "number"
};
const chartDatumSchema = recordSchema(["label", "value"], {
	label: "string",
	value: "number",
	color: "string"
});
const chartSeriesSchema = recordSchema(["label", "data"], {
	label: "string",
	color: "string",
	data: "array"
}, { data: chartDatumSchema });
const stepsRecordSchema = recordSchema(["title"], {
	title: "string",
	desc: "string"
});
const keyValueRecordSchema = recordSchema(["key", "value"], {
	key: "string",
	value: "string"
});
const timelineRecordSchema = recordSchema(["title"], {
	title: "string",
	desc: "string",
	time: "string"
});
const diffRecordSchema = recordSchema(["path", "newText"], {
	path: "string",
	oldText: "string-or-null",
	newText: "string"
});
const plotSeriesSchema = recordSchema(["expr"], {
	expr: "string",
	label: "string",
	color: "string",
	kind: "string",
	params: "array"
}, { params: recordSchema(["name", "value"], {
	name: "string",
	value: "number",
	min: "number",
	max: "number",
	step: "number",
	animateTo: "number",
	durationMs: "number",
	loop: "boolean"
}) }, { kind: PLOT_KINDS });
const sceneMeshSchema = recordSchema(["shape"], {
	shape: "string",
	color: "string",
	position: "array",
	rotation: "array",
	scale: "unknown",
	size: "unknown"
}, {}, { shape: MESH_SHAPES });
function fileTreeRecordSchema(depth) {
	return recordSchema(["name"], {
		name: "string",
		type: "string",
		children: "array"
	}, depth > 0 ? { children: fileTreeRecordSchema(depth - 1) } : {}, { type: FILE_TYPES });
}
const fileTreeNodeSchema = fileTreeRecordSchema(6);
const tabHolderSchema = recordSchema(["label", "items"], {
	label: "string",
	items: "nodes",
	content: "nodes"
});
const accordionHolderSchema = recordSchema(["title", "items"], {
	title: "string",
	items: "nodes"
});
const diagramNodeSchema = recordSchema(["id", "label"], {
	id: "string",
	label: "string",
	sub: "string",
	type: "string",
	x: "number",
	y: "number",
	w: "number",
	h: "number",
	tag: "string"
}, {}, { type: DIAGRAM_NODE_TYPES });
const diagramEdgeSchema = recordSchema(["from", "to"], {
	from: "string",
	to: "string",
	label: "string",
	kind: "string",
	route: "string"
}, {}, {
	kind: DIAGRAM_EDGE_KINDS,
	route: DIAGRAM_ROUTES
});
const diagramZoneSchema = recordSchema(["label"], {
	label: "string",
	x: "number",
	y: "number",
	w: "number",
	h: "number"
});
const diagramThemeSchema = recordSchema([], {
	paper: "string",
	"paper-2": "string",
	ink: "string",
	muted: "string",
	soft: "string",
	rule: "string",
	accent: "string",
	"accent-tint": "string",
	link: "string"
});
/** Root GenUI specification metadata used by diagnostics. */
const GENUI_SPEC_SCHEMA = schema(["items"], {
	title: "string",
	gap: "number",
	panel: "boolean",
	append: "boolean",
	items: "nodes"
});
/**
* Native component field metadata.
*
* This is intentionally explicit rather than inferred from TypeScript
* interfaces: the registry is also consumed at runtime by normalization and
* diagnostics, where erased interfaces are unavailable.
*/
const COMPONENT_SCHEMAS = {
	accordion: schema(["items"], {
		...nodeFields,
		items: "array"
	}, {}, { nested: { items: accordionHolderSchema } }),
	audio: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string",
		loop: "boolean"
	}),
	avatar: schema(["name"], {
		...nodeFields,
		name: "string",
		color: "string"
	}),
	badge: schema(["label"], {
		...nodeFields,
		label: "string",
		tone: "string",
		icon: "string"
	}, {
		text: "label",
		value: "label"
	}, { enums: { tone: BADGE_TONES } }),
	breadcrumb: schema(["items"], {
		...nodeFields,
		items: "array"
	}),
	button: schema(["label"], {
		...nodeFields,
		label: "string",
		tone: "string",
		full: "boolean",
		small: "boolean",
		icon: "string",
		action: "string"
	}, {}, { enums: { tone: BUTTON_TONES } }),
	callout: schema(["content"], {
		...nodeFields,
		title: "string",
		content: "string",
		tone: "string"
	}, { kind: "tone" }, { enums: { tone: CALLOUT_TONES } }),
	card: schema(["items"], {
		...nodeFields,
		title: "string",
		items: "nodes",
		tone: "string",
		accent: "string"
	}, {
		label: "title",
		content: "items"
	}, { enums: { tone: CARD_TONES } }),
	chart: schema([], {
		...nodeFields,
		kind: "string",
		data: "array",
		series: "array",
		horizontal: "boolean",
		stacked: "boolean",
		filter: "string",
		palette: "array"
	}, {}, {
		oneOfRequired: [["data", "series"]],
		conditionalRequired: [{
			kind: "required-if",
			when: {
				field: "kind",
				equals: "donut"
			},
			required: ["data"]
		}],
		nested: {
			data: chartDatumSchema,
			series: chartSeriesSchema
		},
		enums: { kind: CHART_KINDS },
		validator: { name: "chart-renderability" }
	}),
	checkbox: schema(["label"], {
		...nodeFields,
		label: "string",
		checked: "boolean",
		action: "string",
		group: "string"
	}),
	code: schema(["code"], {
		...nodeFields,
		lang: "string",
		code: "string"
	}),
	col: schema(["items"], {
		...nodeFields,
		items: "nodes",
		gap: "number"
	}),
	copy: schema(["text"], {
		...nodeFields,
		label: "string",
		text: "string"
	}),
	diagram: schema(["kind", "nodes"], {
		...nodeFields,
		kind: "string",
		variant: "string",
		title: "string",
		nodes: "array",
		edges: "array",
		zones: "array",
		theme: "object"
	}, {}, {
		nested: {
			nodes: diagramNodeSchema,
			edges: diagramEdgeSchema,
			zones: diagramZoneSchema,
			theme: diagramThemeSchema
		},
		enums: {
			kind: DIAGRAM_KINDS,
			variant: DIAGRAM_VARIANTS
		}
	}),
	diff: schema(["diffs"], {
		...nodeFields,
		diffs: "array"
	}, {}, { nested: { diffs: diffRecordSchema } }),
	divider: schema([], nodeFields),
	echart: schema([], {
		...nodeFields,
		title: "string",
		height: "number",
		preset: "string",
		data: "array",
		series: "array",
		links: "array",
		palette: "array",
		option: "object"
	}, {}, {
		oneOfRequired: [[
			"option",
			"data",
			"series",
			"links"
		]],
		enums: { preset: ECHART_PRESETS }
	}),
	"file-tree": schema(["items"], {
		...nodeFields,
		items: "array"
	}, {}, { nested: { items: fileTreeNodeSchema } }),
	grid: schema(["items"], {
		...nodeFields,
		cols: "number",
		items: "nodes"
	}),
	image: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string"
	}),
	input: schema([], {
		...nodeFields,
		label: "string",
		placeholder: "string",
		value: "string",
		inputType: "string",
		action: "string",
		id: "string"
	}, {}, { enums: { inputType: INPUT_TYPES } }),
	json: schema(["value"], {
		...nodeFields,
		value: "unknown"
	}),
	keyvalue: schema(["pairs"], {
		...nodeFields,
		pairs: "array"
	}, { items: "pairs" }, { nested: { pairs: keyValueRecordSchema } }),
	link: schema(["label"], {
		...nodeFields,
		label: "string",
		href: "string"
	}),
	list: schema(["items"], {
		...nodeFields,
		items: "array",
		filter: "string"
	}),
	mermaid: schema(["code"], {
		...nodeFields,
		code: "string"
	}),
	plot: schema(["series"], {
		...nodeFields,
		series: "array",
		xMin: "number",
		xMax: "number",
		yMin: "number",
		yMax: "number",
		title: "string"
	}, {}, { nested: { series: plotSeriesSchema } }),
	progress: schema(["value"], {
		...nodeFields,
		value: "number",
		label: "string",
		valueLabel: "string",
		variant: "string",
		target: "number"
	}, {}, { enums: { variant: PROGRESS_VARIANTS } }),
	quiz: schema(["question", "options"], {
		...nodeFields,
		question: "string",
		options: "array",
		explanation: "string",
		id: "string",
		action: "string"
	}),
	radio: schema(["options"], {
		...nodeFields,
		label: "string",
		options: "array",
		selected: "number",
		action: "string",
		group: "string",
		answer: "unknown",
		explanation: "string"
	}),
	row: schema(["items"], {
		...nodeFields,
		items: "nodes",
		wrap: "boolean",
		spacer: "boolean"
	}),
	scene3d: schema(["meshes"], {
		...nodeFields,
		title: "string",
		meshes: "array",
		ambient: "number",
		background: "string"
	}, {}, { nested: { meshes: sceneMeshSchema } }),
	select: schema(["options"], {
		...nodeFields,
		label: "string",
		options: "array",
		action: "string",
		selected: "number",
		id: "string"
	}),
	slider: schema([], {
		...nodeFields,
		label: "string",
		min: "number",
		max: "number",
		step: "number",
		value: "number",
		action: "string",
		id: "string"
	}),
	spacer: schema([], nodeFields),
	hero: schema(["title"], {
		...nodeFields,
		title: "string",
		subtitle: "string",
		value: "string",
		label: "string",
		delta: "string",
		spark: "array",
		tone: "string"
	}, { number: "value" }, { enums: { tone: HERO_TONES } }),
	stat: schema(["label", "value"], {
		...nodeFields,
		label: "string",
		value: "string",
		delta: "string",
		spark: "array",
		size: "string"
	}, {}, { enums: { size: STAT_SIZES } }),
	steps: schema(["steps"], {
		...nodeFields,
		steps: "array",
		current: "number"
	}, { items: "steps" }, { nested: { steps: stepsRecordSchema } }),
	submit: schema(["label"], {
		...nodeFields,
		label: "string",
		action: "string",
		resetAction: "string",
		groups: "array"
	}),
	switch: schema(["label"], {
		...nodeFields,
		label: "string",
		checked: "boolean",
		action: "string"
	}),
	table: schema(["columns", "rows"], {
		...nodeFields,
		columns: "array",
		rows: "array",
		types: "array",
		total: "boolean",
		details: "array",
		filter: "string",
		filterColumn: "number",
		sortField: "string",
		export: "boolean"
	}, {
		headers: "columns",
		data: "rows"
	}),
	tabs: schema(["tabs"], {
		...nodeFields,
		tabs: "array"
	}, {}, { nested: { tabs: tabHolderSchema } }),
	text: schema(["content"], {
		...nodeFields,
		content: "string",
		size: "string",
		center: "boolean"
	}, { text: "content" }, { enums: { size: TEXT_SIZES } }),
	textarea: schema([], {
		...nodeFields,
		label: "string",
		placeholder: "string",
		rows: "number",
		value: "string",
		action: "string",
		id: "string"
	}),
	timeline: schema(["items"], {
		...nodeFields,
		items: "array"
	}, {}, { nested: { items: timelineRecordSchema } }),
	video: schema(["src"], {
		...nodeFields,
		src: "string",
		alt: "string",
		poster: "string",
		loop: "boolean",
		muted: "boolean",
		aspectRatio: "string"
	}, {}, { enums: { aspectRatio: MEDIA_ASPECT_RATIOS } })
};
const GENUI_NATIVE_TYPES = new Set(Object.keys(COMPONENT_SCHEMAS));
//#endregion
//#region src/client/genui-runtime/normalize.ts
/** Deterministic GenUI alias and structural normalization. */
function record$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function isNode$1(value) {
	const candidate = record$1(value);
	return candidate !== void 0 && typeof candidate.type === "string";
}
function normalizeAliasFields(value, path, type, warnings, aliases) {
	const out = { ...value };
	for (const [alias, canonical] of Object.entries(aliases)) {
		if (!(alias in out)) continue;
		const aliasPath = `${path}.${alias}`;
		const keptCanonical = canonical in out;
		if (!keptCanonical) out[canonical] = out[alias];
		delete out[alias];
		warnings.push({
			kind: "alias",
			path: aliasPath,
			message: keptCanonical ? `${aliasPath} is ignored because canonical field '${canonical}' is present` : `${aliasPath} normalized/adopted as '${canonical}'`,
			type,
			field: alias,
			canonical
		});
	}
	return out;
}
/**
 * Near-synonyms for a tone the target component does not accept.
 *
 * The vocabularies differ per component — `warn`/`danger` are legal on badge,
 * card and hero, while callout spells the same two ideas `warning`/`error` —
 * so the same word is right in one node and fatal in the next. Each entry is
 * tried in order against THAT component's enum, so a value is repaired toward
 * the meaning the author had rather than dropped.
 */
const TONE_SYNONYMS = {
	warn: ["warning", "warn"],
	warning: ["warn", "warning"],
	danger: ["error", "danger"],
	error: ["danger", "error"],
	critical: ["error", "danger"],
	caution: ["warning", "warn"],
	note: ["info"],
	tip: ["info"],
	ok: ["success"],
	done: ["success"],
	brand: ["accent"]
};
function normalizeNode(value, path, warnings) {
	if (!isNode$1(value)) return value;
	const type = value.type;
	const definition = COMPONENT_SCHEMAS[type];
	if (definition === void 0) return value;
	const out = normalizeAliasFields(value, path, type, warnings, definition.aliases);
	const toneEnum = definition.enums === void 0 ? void 0 : definition.enums.tone;
	if (Array.isArray(toneEnum) && typeof out.tone === "string" && !toneEnum.includes(out.tone)) {
		const synonyms = TONE_SYNONYMS[out.tone];
		const canonical = synonyms === void 0 ? void 0 : synonyms.find((candidate) => toneEnum.includes(candidate));
		if (canonical !== void 0) {
			warnings.push({
				kind: "alias",
				path: `${path}.tone`,
				message: `${path}.tone value '${out.tone}' normalized as '${canonical}'`,
				type,
				field: "tone",
				canonical
			});
			out.tone = canonical;
		}
	}
	if (type === "hero" && out.tone === "brand") {
		out.tone = "accent";
		warnings.push({
			kind: "alias",
			path: `${path}.tone`,
			message: `${path}.tone value 'brand' normalized as 'accent'`,
			type,
			field: "tone",
			canonical: "accent"
		});
	}
	const normalizeNodeValue = (child, childPath) => normalizeNode(child, childPath, warnings);
	const normalizeNodeArray = (children, childPath) => Array.isArray(children) ? children.map((child, index) => normalizeNodeValue(child, `${childPath}[${index}]`)) : children;
	if (type === "keyvalue" || type === "steps") {
		const field = type === "keyvalue" ? "pairs" : "steps";
		const aliases = type === "keyvalue" ? { label: "key" } : { content: "desc" };
		if (!(field in out) && Array.isArray(out.items)) {
			out[field] = out.items;
			delete out.items;
			warnings.push({
				kind: "alias",
				path: `${path}.items`,
				message: `${path}.items normalized/adopted as '${field}'`,
				type,
				field: "items",
				canonical: field
			});
		}
		const entries = out[field];
		if (Array.isArray(entries)) out[field] = entries.map((entry, index) => {
			const holder = record$1(entry);
			return holder === void 0 ? entry : normalizeAliasFields(holder, `${path}.${field}[${index}]`, type, warnings, aliases);
		});
	} else if (type === "row" || type === "col" || type === "grid" || type === "card" || type === "file-tree" || type === "timeline" || type === "breadcrumb") {
		if (type !== "file-tree" && type !== "timeline" && type !== "breadcrumb") out.items = normalizeNodeArray(out.items, `${path}.items`);
	} else if (type === "list" && Array.isArray(out.items)) out.items = out.items.map((child, index) => isNode$1(child) ? normalizeNodeValue(child, `${path}.items[${index}]`) : child);
	else if (type === "tabs" && Array.isArray(out.tabs)) out.tabs = out.tabs.map((tab, index) => {
		const holder = record$1(tab);
		if (holder === void 0) return tab;
		const normalizedHolder = { ...holder };
		if ("content" in normalizedHolder) {
			const tabPath = `${path}.tabs[${index}].content`;
			const hasItems = "items" in normalizedHolder;
			if (!hasItems) normalizedHolder.items = normalizedHolder.content;
			delete normalizedHolder.content;
			warnings.push({
				kind: "alias",
				path: tabPath,
				message: hasItems ? `${tabPath} is ignored because canonical field 'items' is present` : `${tabPath} normalized/adopted as 'items'`,
				type,
				field: "content",
				canonical: "items"
			});
		}
		normalizedHolder.items = Array.isArray(normalizedHolder.items) ? normalizedHolder.items.map((child, childIndex) => normalizeNodeValue(child, `${path}.tabs[${index}].items[${childIndex}]`)) : normalizedHolder.items === void 0 ? normalizedHolder.items : [normalizeNodeValue(normalizedHolder.items, `${path}.tabs[${index}].items[0]`)];
		return normalizedHolder;
	});
	else if (type === "accordion" && Array.isArray(out.items)) out.items = out.items.map((item, index) => {
		const holder = record$1(item);
		if (holder === void 0) return item;
		return {
			...holder,
			items: Array.isArray(holder.items) ? holder.items.map((child, childIndex) => normalizeNodeValue(child, `${path}.items[${index}].items[${childIndex}]`)) : holder.items
		};
	});
	return out;
}
/**
* Normalize a raw GenUI value into canonical field names.
*
* Only deterministic aliases and structural aliases are changed. Resource
* limits, type repair, security filtering, and semantic validation remain in
* the guard layer. Unknown component types are returned opaque.
*
* @param value - Raw GenUI spec or bare native component.
* @returns Canonical value and stable alias diagnostics.
*/
function normalizeGenuiSpec(value) {
	const warnings = [];
	const root = record$1(value);
	if (root === void 0) return {
		value,
		warnings
	};
	if (typeof root.type === "string") return {
		value: normalizeNode(root, "spec", warnings),
		warnings
	};
	const out = { ...root };
	if (Array.isArray(out.items)) out.items = out.items.map((item, index) => normalizeNode(item, `items[${index}]`, warnings));
	return {
		value: out,
		warnings
	};
}
//#endregion
//#region src/client/genui-runtime/diagnostics.ts
/** GenUI runtime diagnostics for aliases and unknown fields. */
function record(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function isNode(value) {
	const candidate = record(value);
	return candidate !== void 0 && typeof candidate.type === "string";
}
function visitNativeNodes(value, path, visit) {
	if (!isNode(value)) return;
	const type = value.type;
	const definition = COMPONENT_SCHEMAS[type];
	if (definition === void 0) return;
	visit(value, path, definition);
	const children = (child, childPath) => visitNativeNodes(child, childPath, visit);
	if ((type === "row" || type === "col" || type === "grid" || type === "card") && Array.isArray(value.items)) value.items.forEach((child, index) => children(child, `${path}.items[${index}]`));
	else if (type === "list" && Array.isArray(value.items)) value.items.forEach((child, index) => children(child, `${path}.items[${index}]`));
	else if (type === "tabs" && Array.isArray(value.tabs)) value.tabs.forEach((tab, index) => {
		const holder = record(tab);
		if (holder === void 0) return;
		if (Array.isArray(holder.items)) holder.items.forEach((child, childIndex) => children(child, `${path}.tabs[${index}].items[${childIndex}]`));
		else children(holder.items, `${path}.tabs[${index}].items`);
	});
	else if (type === "accordion" && Array.isArray(value.items)) value.items.forEach((item, index) => {
		const holder = record(item);
		if (holder?.items !== void 0 && Array.isArray(holder.items)) holder.items.forEach((child, childIndex) => children(child, `${path}.items[${index}].items[${childIndex}]`));
	});
}
function pushUnknownField(warnings, path, field, type) {
	warnings.push({
		kind: "unknown-field",
		path: `${path}.${field}`,
		message: `${path}.${field}: unknown field for '${type}'`,
		type,
		field
	});
}
function diagnoseRecordFields(value, path, definition, type, warnings) {
	const holder = record(value);
	if (holder === void 0) return;
	for (const field of Object.keys(holder)) {
		if (field in definition.fields) continue;
		pushUnknownField(warnings, path, field, type);
	}
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = holder[field];
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => diagnoseRecordFields(item, `${path}.${field}[${index}]`, nested, type, warnings));
		else if (nestedValue !== void 0) diagnoseRecordFields(nestedValue, `${path}.${field}`, nested, type, warnings);
	}
}
function diagnoseNestedFields(node, path, definition, warnings) {
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = node[field];
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => diagnoseRecordFields(item, `${path}.${field}[${index}]`, nested, node.type, warnings));
		else if (nestedValue !== void 0) diagnoseRecordFields(nestedValue, `${path}.${field}`, nested, node.type, warnings);
	}
}
/**
* Diagnose unknown direct fields on native nodes.
*
* Unknown types are intentionally skipped so custom renderers retain their
* opaque extension payloads. Native unknown fields are warnings, not errors.
*
* @param value - Canonical or raw GenUI value.
* @returns Stable field diagnostics in tree order.
*/
function diagnoseUnknownGenuiFields(value) {
	const warnings = [];
	const root = record(value);
	if (root === void 0) return warnings;
	const visit = (node, path, definition) => {
		for (const field of Object.keys(node)) {
			if (field === "type" || field in definition.fields) continue;
			pushUnknownField(warnings, path, field, node.type);
		}
		diagnoseNestedFields(node, path, definition, warnings);
	};
	if (Array.isArray(root.items)) {
		for (const field of Object.keys(root)) {
			if (field in GENUI_SPEC_SCHEMA.fields) continue;
			pushUnknownField(warnings, "spec", field, "spec");
		}
		root.items.forEach((item, index) => visitNativeNodes(item, `items[${index}]`, visit));
	} else if (typeof root.type === "string") visitNativeNodes(root, "spec", visit);
	else for (const field of Object.keys(root)) {
		if (field in GENUI_SPEC_SCHEMA.fields) continue;
		pushUnknownField(warnings, "spec", field, "spec");
	}
	return warnings;
}
//#endregion
//#region src/client/genui-runtime/limits.ts
/** Resource limits shared by GenUI repair, validation, and rendering. */
const GENUI_LIMITS = {
	/** Maximum nesting depth of the component tree. */
	maxDepth: 8,
	/** Maximum total nodes across the whole spec. */
	maxNodes: 200,
	/** Maximum length of any plain string field. */
	maxString: 2e3,
	/** Maximum length of a `code` body. */
	maxCode: 12e3,
	/** Maximum length of a mermaid source. */
	maxMermaid: 8e3,
	/** Maximum `grid` columns. */
	maxGridCols: 12,
	/** Maximum `tabs` count. */
	maxTabs: 12,
	/** Maximum `accordion` items. */
	maxAccordionItems: 24,
	/** Maximum `list` items. */
	maxListItems: 50,
	/** Maximum `select`/`radio` options. */
	maxOptions: 50,
	/** Maximum `table` rows / columns. */
	maxTableRows: 50,
	maxTableCols: 12,
	/** Maximum `chart` data points per series. */
	maxChartPoints: 60,
	/** Maximum `plot` series and per-series parameters. */
	maxPlotSeries: 8,
	maxPlotParams: 6,
	/** Maximum `scene3d` meshes. */
	maxMeshes: 5,
	/** Maximum `quiz` options. */
	maxQuizOptions: 8,
	/** Maximum `steps` / `timeline` / `breadcrumb` / `keyvalue` entries. */
	maxSteps: 24,
	maxTimelineItems: 24,
	maxBreadcrumbItems: 12,
	maxKeyValuePairs: 24,
	/** Maximum `file-tree` nesting. */
	maxTreeDepth: 6,
	/** Maximum `diagram` nodes / edges / zones / focal accents. */
	maxDiagramNodes: 9,
	maxDiagramEdges: 12,
	maxDiagramZones: 3,
	maxDiagramFocal: 2,
	maxDiagramLabel: 14,
	/** Maximum depth of an `echart` option object. */
	maxEChartOptionDepth: 10,
	/** Maximum length of any single array inside an `echart` option. */
	maxEChartArrayLen: 500,
	/** Maximum entries traversed while sanitizing an `echart` option. */
	maxEChartOptionNodes: 2e3
};
//#endregion
//#region src/client/genui-runtime/value-utils.ts
/** Shared primitive sanitizers used by the GenUI guard. */
/** Is `value` one of `values`? */
function inEnum(value, values) {
	return typeof value === "string" && values.includes(value);
}
/** String field: truncate a string to `cap`, or undefined when not a string. */
function str(value, cap) {
	return typeof value === "string" ? value.slice(0, cap) : void 0;
}
/**
* Color field: the value lands in an inline `style` (background/stroke) or
* THREE.Color. Arbitrary CSS values are an exfiltration channel, so only
* literal color formats and host design tokens are accepted.
*/
const SAFE_COLOR_RE = /^(?:#[\da-fA-F]{3,8}|rgba?\([^)]{0,64}\)|hsla?\([^)]{0,64}\)|var\(--dsw-[\w-]+(?:,\s*#[0-9a-fA-F]{3,8})?\))$/;
function color(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	return normalized.length <= 64 && SAFE_COLOR_RE.test(normalized) ? normalized : void 0;
}
/** Keep only http(s) and mailto link targets. */
function safeHref(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	if (normalized.length > 2048) return void 0;
	return /^https?:\/\//i.test(normalized) || /^mailto:[^@\s]+@[^@\s]+$/i.test(normalized) ? normalized : void 0;
}
/** Keep browser-reachable http(s) or same-origin relative media paths. */
function safeMediaSrc(value) {
	if (typeof value !== "string") return void 0;
	const normalized = value.trim();
	if (normalized === "" || normalized.length > 2048) return void 0;
	if (/^https?:\/\//i.test(normalized)) return normalized;
	if (/^[a-z][a-z0-9+.-]*:/i.test(normalized) || /^[/\\]{2}/.test(normalized)) return void 0;
	return normalized;
}
/** Finite-number field: clamp into [min, max], or undefined when not finite. */
function num(value, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : void 0;
}
/** Integer field: clamp into [min, max], or undefined when not a finite number. */
function int(value, min, max) {
	return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : void 0;
}
/** Optional enum field: the value when it matches, otherwise undefined. */
function enu(value, values) {
	return inEnum(value, values) ? value : void 0;
}
/** Plain object (not array, not null). */
function obj(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
/** Preserve an optional field only when its value exists. */
function opt(key, value) {
	return value === void 0 ? {} : { [key]: value };
}
//#endregion
//#region src/client/guard.ts
function fieldKindMatches(value, kind) {
	switch (kind) {
		case "string": return typeof value === "string";
		case "string-or-null": return value === null || typeof value === "string";
		case "number": return typeof value === "number" && Number.isFinite(value);
		case "boolean": return typeof value === "boolean";
		case "nodes": return Array.isArray(value);
		case "array": return Array.isArray(value);
		case "object": return obj(value) !== void 0;
		case "unknown": return true;
	}
}
function fieldKindLabel(kind) {
	switch (kind) {
		case "string-or-null": return "a string or null";
		case "number": return "a finite number";
		case "boolean": return "a boolean";
		case "nodes":
		case "array": return "an array";
		case "object": return "an object";
		case "unknown": return "a value";
		default: return "a string";
	}
}
/** Detect an existing field diagnostic using both canonical and legacy messages. */
function hasFieldError(errors, at, field) {
	return errors.some((error) => error.startsWith(`${at}.${field} `) || error.includes(`'${field}'`) || error.includes(`requires ${field}`));
}
/** Validate present fields against the runtime schema without duplicating errors. */
function validateSchemaFieldKinds(value, at, definition, errors, excludedFields = []) {
	for (const [field, kind] of Object.entries(definition.fields)) {
		if (excludedFields.includes(field) || value[field] === void 0) continue;
		if (!fieldKindMatches(value[field], kind) && !hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	for (const [field, values] of Object.entries(definition.enums)) {
		if (excludedFields.includes(field) || value[field] === void 0 || !fieldKindMatches(value[field], "string")) continue;
		if (!values.includes(value[field]) && !hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be one of ${values.join(", ")}`);
	}
}
/** Validate one schema-declared nested record and all records below it. */
function validateRecordSchema(value, at, definition, errors) {
	const holder = obj(value);
	if (holder === void 0) {
		errors.push(`${at} must be an object`);
		return;
	}
	for (const field of definition.required) {
		const kind = definition.fields[field];
		if (holder[field] === void 0) {
			if (!hasFieldError(errors, at, field)) errors.push(`${at}: requires ${field}${kind === void 0 ? "" : ` (${fieldKindLabel(kind)})`}`);
		} else if (kind !== void 0 && !fieldKindMatches(holder[field], kind)) {
			if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
		}
	}
	for (const [field, kind] of Object.entries(definition.fields)) if (holder[field] !== void 0 && !fieldKindMatches(holder[field], kind)) {
		if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	for (const [field, values] of Object.entries(definition.enums)) if (holder[field] !== void 0 && typeof holder[field] === "string" && !values.includes(holder[field])) {
		if (!hasFieldError(errors, at, field)) errors.push(`${at}.${field} must be one of ${values.join(", ")}`);
	}
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = holder[field];
		if (nestedValue === void 0) continue;
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => validateRecordSchema(item, `${at}.${field}[${index}]`, nested, errors));
		else validateRecordSchema(nestedValue, `${at}.${field}`, nested, errors);
	}
}
/** Validate registry-declared nested records before repair can discard them. */
function validateNestedRecordSchemas(value, at, definition, errors) {
	for (const [field, nested] of Object.entries(definition.nested)) {
		const nestedValue = value[field];
		if (nestedValue === void 0) continue;
		if (Array.isArray(nestedValue)) nestedValue.forEach((item, index) => validateRecordSchema(item, `${at}.${field}[${index}]`, nested, errors));
		else validateRecordSchema(nestedValue, `${at}.${field}`, nested, errors);
	}
}
/** Validate the registry-declared presence and primitive shape of a native node. */
function validateRegistryFields(value, at, definition, errors) {
	const type = String(value.type);
	const alreadyReported = (field) => hasFieldError(errors, at, field);
	for (const field of definition.required) {
		const kind = definition.fields[field];
		if (kind === void 0 || value[field] === void 0) {
			if (!alreadyReported(field)) errors.push(`${at}: type '${type}' requires ${field}${kind === void 0 ? "" : ` (${fieldKindLabel(kind)})`}`);
			continue;
		}
		if (!fieldKindMatches(value[field], kind) && !alreadyReported(field)) errors.push(`${at}.${field} must be ${fieldKindLabel(kind)}`);
	}
	validateSchemaFieldKinds(value, at, definition, errors, ["type"]);
	for (const group of definition.oneOfRequired) if (!group.some((field) => value[field] !== void 0) && !errors.some((error) => error.includes(`requires ${group.join(" or ")}`))) errors.push(`${at}: type '${type}' requires one of ${group.join(" or ")}`);
	for (const rule of definition.conditionalRequired) {
		if (value[rule.when.field] !== rule.when.equals) continue;
		for (const field of rule.required) if (value[field] === void 0 && !alreadyReported(field)) errors.push(`${at}: type '${type}' requires ${field}${rule.message === void 0 ? "" : ` (${rule.message})`}`);
	}
	validateNestedRecordSchemas(value, at, definition, errors);
}
/** Walk `list` with the shared node budget; drops invalid entries. */
function repairItems(list, ctx, depth) {
	if (!Array.isArray(list)) return [];
	const out = [];
	for (const item of list) {
		if (ctx.remaining <= 0) break;
		ctx.remaining -= 1;
		const node = repairNode(item, ctx, depth);
		if (node !== null) out.push(node);
	}
	return out;
}
/** Optional explicit palette: up to 12 validated colour values. */
function paletteValues(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v.slice(0, 12)) {
		const value = color(item);
		if (value === void 0) continue;
		out.push(value);
	}
	return out.length > 0 ? out : void 0;
}
/** Optional `stat.spark` series: finite numbers only, 2..60 points. */
function sparkValues(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v.slice(0, 60)) {
		const n = typeof item === "number" ? item : Number(item);
		if (!Number.isFinite(n)) return void 0;
		out.push(n);
	}
	return out.length >= 2 ? out : void 0;
}
/** Layout hints are component-agnostic: `span` survives repair on ANY node
*  (the renderer applies it inside a grid). Kept out of the per-case switches
*  so a new component type cannot forget it. */
function repairNode(value, ctx, depth) {
	const node = repairNodeFields(value, ctx, depth);
	if (node === null) return null;
	const span = int(obj(value)?.span, 2, 12);
	return span === void 0 ? node : {
		...node,
		span
	};
}
function repairNodeFields(value, ctx, depth) {
	if (depth > GENUI_LIMITS.maxDepth) return null;
	const v = obj(value);
	if (v === void 0) return null;
	const type = v.type;
	if (typeof type !== "string") return null;
	switch (type) {
		case "text": {
			const content = str(v.content, GENUI_LIMITS.maxString) ?? str(v.text, GENUI_LIMITS.maxString);
			if (content === void 0) return null;
			return {
				type: "text",
				content,
				...opt("size", enu(v.size, TEXT_SIZES)),
				...opt("center", v.center === true ? true : void 0)
			};
		}
		case "row": return {
			type: "row",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("wrap", v.wrap === true ? true : void 0),
			...opt("spacer", v.spacer === true ? true : void 0)
		};
		case "col": return {
			type: "col",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("gap", num(v.gap, 0, 96))
		};
		case "grid": return {
			type: "grid",
			cols: int(v.cols, 1, GENUI_LIMITS.maxGridCols) ?? 1,
			items: repairItems(v.items, ctx, depth + 1)
		};
		case "card": return {
			type: "card",
			items: repairItems(v.items, ctx, depth + 1),
			...opt("title", str(v.title, GENUI_LIMITS.maxString)),
			...opt("tone", enu(v.tone, CARD_TONES)),
			...opt("accent", color(v.accent))
		};
		case "button": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "button",
				label,
				...opt("tone", enu(v.tone, BUTTON_TONES)),
				...opt("full", v.full === true ? true : void 0),
				...opt("small", v.small === true ? true : void 0),
				...opt("icon", str(v.icon, 64)),
				...opt("action", str(v.action, 200))
			};
		}
		case "input": return {
			type: "input",
			...opt("label", str(v.label, GENUI_LIMITS.maxString)),
			...opt("placeholder", str(v.placeholder, GENUI_LIMITS.maxString)),
			...opt("value", str(v.value, GENUI_LIMITS.maxString)),
			...opt("inputType", enu(v.inputType, INPUT_TYPES)),
			...opt("action", str(v.action, 200)),
			...opt("id", str(v.id, 200))
		};
		case "select": {
			const options = repairStrings(v.options, GENUI_LIMITS.maxOptions, GENUI_LIMITS.maxString);
			if (options === void 0) return null;
			return {
				type: "select",
				options,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("action", str(v.action, 200)),
				...opt("selected", int(v.selected, 0, options.length - 1)),
				...opt("id", str(v.id, 200))
			};
		}
		case "checkbox": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "checkbox",
				label,
				...opt("checked", v.checked === true ? true : void 0),
				...opt("action", str(v.action, 200)),
				...opt("group", str(v.group, 200))
			};
		}
		case "link": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "link",
				label,
				...opt("href", safeHref(v.href))
			};
		}
		case "image": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "image",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString))
			};
		}
		case "audio": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "audio",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString)),
				...opt("loop", v.loop === true ? true : void 0)
			};
		}
		case "video": {
			const src = safeMediaSrc(v.src);
			if (src === void 0) return null;
			return {
				type: "video",
				src,
				...opt("alt", str(v.alt, GENUI_LIMITS.maxString)),
				...opt("poster", safeMediaSrc(v.poster)),
				...opt("loop", v.loop === true ? true : void 0),
				...opt("muted", v.muted === true ? true : void 0),
				...opt("aspectRatio", enu(v.aspectRatio, MEDIA_ASPECT_RATIOS))
			};
		}
		case "badge": {
			const label = str(v.label, GENUI_LIMITS.maxString) ?? str(v.text, GENUI_LIMITS.maxString) ?? str(v.value, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "badge",
				label,
				...opt("tone", enu(v.tone, BADGE_TONES)),
				...opt("icon", str(v.icon, 64))
			};
		}
		case "hero": {
			const title = str(v.title, GENUI_LIMITS.maxString);
			if (title === void 0) return null;
			return {
				type: "hero",
				title,
				...opt("subtitle", str(v.subtitle, GENUI_LIMITS.maxString)),
				...opt("value", str(v.value, 128)),
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("delta", str(v.delta, 64)),
				...opt("spark", sparkValues(v.spark)),
				...opt("tone", enu(v.tone, HERO_TONES))
			};
		}
		case "stat": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			const value = str(v.value, 128);
			if (label === void 0 || value === void 0) return null;
			return {
				type: "stat",
				label,
				value,
				...opt("delta", str(v.delta, 64)),
				...opt("spark", sparkValues(v.spark)),
				...opt("size", v.size === "hero" ? "hero" : void 0)
			};
		}
		case "progress": {
			const value = num(v.value, 0, 100);
			if (value === void 0) return null;
			return {
				type: "progress",
				value,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("valueLabel", str(v.valueLabel, 64)),
				...opt("variant", enu(v.variant, PROGRESS_VARIANTS)),
				...opt("target", num(v.target, 0, 100))
			};
		}
		case "divider": return { type: "divider" };
		case "spacer": return { type: "spacer" };
		case "avatar": {
			const name = str(v.name, 64);
			if (name === void 0) return null;
			return {
				type: "avatar",
				name,
				...opt("color", color(v.color))
			};
		}
		case "list": {
			const items = repairListItems(v.items, GENUI_LIMITS.maxListItems, ctx, depth + 1);
			if (items === void 0) return null;
			return {
				type: "list",
				items,
				...opt("filter", str(v.filter, 64))
			};
		}
		case "table": {
			let rawCols = v.columns;
			let rawRows = v.rows !== void 0 ? v.rows : v.data;
			if (Array.isArray(rawCols) && rawCols.length > 0 && typeof rawCols[0] === "object" && rawCols[0] !== null) rawCols = rawCols.map((c) => columnHeaderText(c));
			if (Array.isArray(rawRows) && rawRows.length > 0 && typeof rawRows[0] === "object" && rawRows[0] !== null && !Array.isArray(rawRows[0])) {
				const keys = Array.isArray(v.columns) && v.columns.length > 0 && typeof v.columns[0] === "object" && v.columns[0] !== null ? v.columns.map((c) => columnKeyOf(c)).filter((k) => k !== void 0) : Object.keys(rawRows[0]);
				rawRows = rawRows.map((row) => keys.map((k) => cellText(row[k])));
			}
			const columns = repairStrings(rawCols, GENUI_LIMITS.maxTableCols, 128);
			const rows = repairRows(rawRows, GENUI_LIMITS.maxTableRows, GENUI_LIMITS.maxTableCols);
			if (columns === void 0 || rows === void 0) return null;
			const rawTypes = Array.isArray(v.types) ? v.types : void 0;
			const types = rawTypes === void 0 ? void 0 : columns.map((_c, i) => {
				const raw = rawTypes[i];
				return typeof raw === "string" && TABLE_CELL_TYPES.includes(raw) ? raw : "text";
			});
			const rawDetails = Array.isArray(v.details) ? v.details : void 0;
			const details = rawDetails === void 0 ? void 0 : rows.map((_row, i) => {
				const entry = repairItems(rawDetails[i], ctx, depth + 1);
				return entry.length === 0 ? null : entry;
			});
			return {
				type: "table",
				columns,
				rows,
				...opt("types", types),
				...opt("total", v.total === true ? true : void 0),
				...opt("export", v.export === true ? true : void 0),
				...opt("filter", str(v.filter, 64)),
				...opt("filterColumn", int(v.filterColumn, 0, GENUI_LIMITS.maxTableCols - 1)),
				...opt("sortField", str(v.sortField, 64)),
				...opt("details", details !== void 0 && details.some((d) => d !== null) ? details : void 0)
			};
		}
		case "chart": {
			const data = repairChartData(v.data, GENUI_LIMITS.maxChartPoints);
			const series = Array.isArray(v.series) ? repairSeries(v.series, GENUI_LIMITS.maxPlotSeries, GENUI_LIMITS.maxChartPoints) : void 0;
			if (data === void 0 && series === void 0) return null;
			return {
				type: "chart",
				data: data ?? [],
				...opt("kind", enu(v.kind, CHART_KINDS)),
				...opt("series", series),
				...opt("horizontal", v.horizontal === true ? true : void 0),
				...opt("stacked", v.stacked === true ? true : void 0),
				...opt("filter", str(v.filter, 64)),
				...opt("palette", paletteValues(v.palette))
			};
		}
		case "tabs": {
			const tabs = repairTabs(v.tabs, ctx, depth);
			if (tabs === void 0) return null;
			return {
				type: "tabs",
				tabs
			};
		}
		case "plot": {
			const series = repairPlotSeries(v.series, GENUI_LIMITS.maxPlotSeries);
			if (series === void 0) return null;
			return {
				type: "plot",
				series,
				...opt("xMin", num(v.xMin, -1e6, 1e6)),
				...opt("xMax", num(v.xMax, -1e6, 1e6)),
				...opt("yMin", num(v.yMin, -1e9, 1e9)),
				...opt("yMax", num(v.yMax, -1e9, 1e9)),
				...opt("title", str(v.title, GENUI_LIMITS.maxString))
			};
		}
		case "callout": {
			const content = str(v.content, GENUI_LIMITS.maxString);
			if (content === void 0) return null;
			return {
				type: "callout",
				content,
				...opt("tone", enu(v.tone, CALLOUT_TONES)),
				...opt("title", str(v.title, GENUI_LIMITS.maxString))
			};
		}
		case "steps": {
			const steps = repairSteps(v.steps);
			if (steps === void 0) return null;
			return {
				type: "steps",
				steps,
				...opt("current", int(v.current, 0, steps.length))
			};
		}
		case "keyvalue": {
			const pairs = repairPairs(v.pairs, GENUI_LIMITS.maxKeyValuePairs);
			if (pairs === void 0) return null;
			return {
				type: "keyvalue",
				pairs
			};
		}
		case "diff": {
			const diffs = repairDiffs(v.diffs);
			if (diffs === void 0) return null;
			return {
				type: "diff",
				diffs
			};
		}
		case "json":
			if (!("value" in v)) return null;
			return {
				type: "json",
				value: v.value
			};
		case "code": {
			const code = str(v.code, GENUI_LIMITS.maxCode);
			if (code === void 0) return null;
			return {
				type: "code",
				code,
				...opt("lang", str(v.lang, 64))
			};
		}
		case "radio": {
			const options = repairStrings(v.options, GENUI_LIMITS.maxOptions, GENUI_LIMITS.maxString);
			if (options === void 0) return null;
			return {
				type: "radio",
				options,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("selected", int(v.selected, 0, options.length - 1)),
				...opt("action", str(v.action, 200)),
				...opt("group", str(v.group, 200)),
				...opt("answer", typeof v.answer === "number" && Number.isFinite(v.answer) && v.answer >= 0 && v.answer < options.length ? Math.trunc(v.answer) : typeof v.answer === "string" ? v.answer.slice(0, 512) : void 0),
				...opt("explanation", str(v.explanation, GENUI_LIMITS.maxString))
			};
		}
		case "submit": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			const action = str(v.action, 200);
			if (label === void 0) return null;
			return {
				type: "submit",
				label,
				...opt("action", action),
				...opt("resetAction", str(v.resetAction, 200)),
				...opt("groups", repairStrings(v.groups, GENUI_LIMITS.maxOptions, 200))
			};
		}
		case "switch": {
			const label = str(v.label, GENUI_LIMITS.maxString);
			if (label === void 0) return null;
			return {
				type: "switch",
				label,
				...opt("checked", v.checked === true ? true : void 0),
				...opt("action", str(v.action, 200))
			};
		}
		case "slider": {
			const min = num(v.min, -1e9, 1e9) ?? 0;
			const max = num(v.max, -1e9, 1e9) ?? 100;
			const lo = Math.min(min, max);
			const hi = Math.max(min, max);
			const step = num(v.step, 1e-9, Math.max(hi - lo, 1e-9));
			const value = num(v.value, lo, hi) ?? lo;
			return {
				type: "slider",
				min: lo,
				max: hi,
				...opt("step", step),
				value,
				...opt("label", str(v.label, GENUI_LIMITS.maxString)),
				...opt("action", str(v.action, 200)),
				...opt("id", str(v.id, 200))
			};
		}
		case "textarea": return {
			type: "textarea",
			...opt("label", str(v.label, GENUI_LIMITS.maxString)),
			...opt("placeholder", str(v.placeholder, GENUI_LIMITS.maxString)),
			...opt("rows", int(v.rows, 1, 30)),
			...opt("value", str(v.value, GENUI_LIMITS.maxString)),
			...opt("action", str(v.action, 200)),
			...opt("id", str(v.id, 200))
		};
		case "accordion": {
			const items = repairAccordion(v.items, ctx, depth);
			if (items === void 0) return null;
			return {
				type: "accordion",
				items
			};
		}
		case "copy": {
			const text = str(v.text, GENUI_LIMITS.maxCode);
			if (text === void 0) return null;
			return {
				type: "copy",
				text,
				...opt("label", str(v.label, 128))
			};
		}
		case "mermaid": {
			const code = str(v.code, GENUI_LIMITS.maxMermaid);
			if (code === void 0) return null;
			return {
				type: "mermaid",
				code
			};
		}
		case "scene3d": {
			const meshes = repairMeshes(v.meshes);
			if (meshes === void 0) return null;
			return {
				type: "scene3d",
				meshes,
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("ambient", num(v.ambient, 0, 2)),
				...opt("background", color(v.background))
			};
		}
		case "diagram": return repairDiagram(v);
		case "timeline": {
			const items = repairTimeline(v.items, GENUI_LIMITS.maxTimelineItems);
			if (items === void 0) return null;
			return {
				type: "timeline",
				items
			};
		}
		case "file-tree": {
			const items = repairTree(v.items, GENUI_LIMITS.maxListItems);
			if (items === void 0) return null;
			return {
				type: "file-tree",
				items
			};
		}
		case "breadcrumb": {
			const items = repairStrings(v.items, GENUI_LIMITS.maxBreadcrumbItems, GENUI_LIMITS.maxString);
			if (items === void 0) return null;
			return {
				type: "breadcrumb",
				items
			};
		}
		case "quiz": {
			const question = str(v.question, GENUI_LIMITS.maxString);
			const options = repairQuizOptions(v.options, v.answer);
			if (question === void 0 || options === void 0) return null;
			return {
				type: "quiz",
				question,
				options,
				...opt("explanation", str(v.explanation, GENUI_LIMITS.maxString)),
				...opt("id", str(v.id, 200)),
				...opt("action", str(v.action, 200))
			};
		}
		case "echart": {
			const data = v.data !== void 0 ? repairChartData(v.data, GENUI_LIMITS.maxChartPoints) : void 0;
			const series = v.series !== void 0 && Array.isArray(v.series) ? repairSeries(v.series, GENUI_LIMITS.maxPlotSeries, GENUI_LIMITS.maxChartPoints) : void 0;
			const links = Array.isArray(v.links) ? v.links.slice(0, GENUI_LIMITS.maxChartPoints).flatMap((entry) => {
				const e = obj(entry);
				const from = e === void 0 ? void 0 : str(e.from, 64);
				const to = e === void 0 ? void 0 : str(e.to, 64);
				if (from === void 0 || to === void 0) return [];
				return [{
					from,
					to,
					...opt("value", num(e.value, 0, 1e9))
				}];
			}) : void 0;
			const sanitized = v.option !== void 0 ? sanitizeEChartOption(v.option, 0, { count: GENUI_LIMITS.maxEChartOptionNodes }) : void 0;
			const option = sanitized === void 0 || typeof sanitized !== "object" || sanitized === null || Array.isArray(sanitized) ? void 0 : sanitized;
			if (option === void 0 && data === void 0 && series === void 0 && (links === void 0 || links.length === 0)) return null;
			return {
				type: "echart",
				...opt("title", str(v.title, GENUI_LIMITS.maxString)),
				...opt("height", int(v.height, 100, 800)),
				...opt("preset", enu(v.preset, ECHART_PRESETS)),
				...opt("data", data),
				...opt("series", series),
				...opt("links", links !== void 0 && links.length > 0 ? links : void 0),
				...opt("palette", paletteValues(v.palette)),
				...opt("option", option)
			};
		}
		default: return value;
	}
}
function repairStrings(v, cap, strCap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		if (typeof item === "string") out.push(item.slice(0, strCap));
		else if (item !== null && typeof item === "object") {
			const o = item;
			const s = typeof o.label === "string" ? o.label : typeof o.value === "string" ? o.value : typeof o.title === "string" ? o.title : JSON.stringify(item);
			out.push(s.slice(0, strCap));
		}
	}
	return out;
}
function repairListItems(v, cap, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		if (typeof item === "string") {
			out.push(item.slice(0, GENUI_LIMITS.maxString));
			continue;
		}
		const o = obj(item);
		const title = o === void 0 ? void 0 : str(o.title, GENUI_LIMITS.maxString);
		if (title !== void 0) {
			out.push({
				title,
				...opt("desc", o === void 0 ? void 0 : str(o.desc, GENUI_LIMITS.maxString))
			});
			continue;
		}
		if (o !== void 0 && typeof o.type === "string") {
			if (ctx.remaining <= 0) break;
			ctx.remaining -= 1;
			const node = repairNode(o, ctx, depth);
			if (node !== null) out.push(node);
		}
	}
	return out;
}
function repairRows(v, rowCap, colCap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const row of v) {
		if (out.length >= rowCap) break;
		if (!Array.isArray(row)) continue;
		const cells = [];
		for (const cell of row) {
			if (cells.length >= colCap) break;
			if (typeof cell === "string") cells.push(cell.slice(0, 256));
			else if (typeof cell === "number" && Number.isFinite(cell)) cells.push(cell);
		}
		if (cells.length > 0) out.push(cells);
	}
	return out;
}
function repairChartData(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const datum of v) {
		if (out.length >= cap) break;
		const o = obj(datum);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		const value = o === void 0 ? void 0 : num(o.value, -0xe8d4a51000, 0xe8d4a51000);
		if (label === void 0 || value === void 0) continue;
		out.push({
			label,
			value,
			...opt("color", o === void 0 ? void 0 : color(o.color))
		});
	}
	return out;
}
function repairSeries(v, cap, pointCap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= cap) break;
		const o = obj(s);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		const data = o === void 0 ? void 0 : repairChartData(o.data, pointCap);
		if (label === void 0 || data === void 0) continue;
		out.push({
			label,
			data,
			...opt("color", o === void 0 ? void 0 : color(o.color))
		});
	}
	return out;
}
function repairTabs(v, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const tab of v) {
		if (out.length >= GENUI_LIMITS.maxTabs) break;
		const o = obj(tab);
		const label = o === void 0 ? void 0 : str(o.label, 128);
		if (label === void 0 || o === void 0) continue;
		const rawItems = o.items !== void 0 ? o.items : o.content !== void 0 ? Array.isArray(o.content) ? o.content : [o.content] : void 0;
		out.push({
			label,
			items: repairItems(rawItems, ctx, depth + 1)
		});
	}
	return out;
}
/** Header text for an object-shaped table column ({title,key} antd style). */
function columnHeaderText(c) {
	const o = obj(c);
	if (o === void 0) return String(c);
	for (const k of [
		"title",
		"label",
		"key",
		"dataIndex"
	]) {
		const s = o[k];
		if (typeof s === "string" && s !== "") return s;
	}
	return JSON.stringify(c);
}
/** Row key for an object-shaped column, mirroring columnHeaderText's order. */
function columnKeyOf(c) {
	const o = obj(c);
	if (o === void 0) return void 0;
	for (const k of [
		"key",
		"dataIndex",
		"title",
		"label"
	]) {
		const s = o[k];
		if (typeof s === "string" && s !== "") return s;
	}
}
/** Cell text for object-array rows: strings/finite numbers pass through,
* everything else stringifies so the column alignment is preserved
* (repairRows would drop null/undefined cells and shift the row). */
function cellText(v) {
	if (typeof v === "string") return v;
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (v === null || v === void 0) return "";
	return JSON.stringify(v);
}
function repairPlotSeries(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= cap) break;
		const o = obj(s);
		const expr = o === void 0 ? void 0 : str(o.expr, 512);
		if (expr === void 0 || o === void 0) continue;
		const params = [];
		if (Array.isArray(o.params)) for (const p of o.params) {
			if (params.length >= GENUI_LIMITS.maxPlotParams) break;
			const po = obj(p);
			const name = po === void 0 ? void 0 : str(po.name, 64);
			const value = po === void 0 ? void 0 : num(po.value, -1e9, 1e9);
			if (name === void 0 || value === void 0) continue;
			params.push({
				name,
				value,
				...opt("min", po === void 0 ? void 0 : num(po.min, -1e9, 1e9)),
				...opt("max", po === void 0 ? void 0 : num(po.max, -1e9, 1e9)),
				...opt("step", po === void 0 ? void 0 : num(po.step, 1e-9, 1e9)),
				...opt("animateTo", po === void 0 ? void 0 : num(po.animateTo, -1e9, 1e9)),
				...opt("durationMs", po === void 0 ? void 0 : num(po.durationMs, 1, 12e4)),
				...opt("loop", po === void 0 ? void 0 : po.loop === true ? true : void 0)
			});
		}
		out.push({
			expr,
			...opt("label", str(o.label, 128)),
			...opt("color", color(o.color)),
			...opt("kind", enu(o.kind, PLOT_KINDS)),
			...opt("params", params.length > 0 ? params : void 0)
		});
	}
	return out;
}
function repairSteps(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const s of v) {
		if (out.length >= GENUI_LIMITS.maxSteps) break;
		const o = obj(s);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0) continue;
		out.push({
			title,
			...opt("desc", o === void 0 ? void 0 : str(o.desc, GENUI_LIMITS.maxString))
		});
	}
	return out;
}
function repairPairs(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const p of v) {
		if (out.length >= cap) break;
		const o = obj(p);
		const key = o === void 0 ? void 0 : str(o.key, 256);
		const value = o === void 0 ? void 0 : str(o.value, GENUI_LIMITS.maxString);
		if (key === void 0 || value === void 0) continue;
		out.push({
			key,
			value
		});
	}
	return out;
}
function repairDiffs(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const d of v) {
		if (out.length >= 24) break;
		const o = obj(d);
		const path = o === void 0 ? void 0 : str(o.path, 1024);
		const newText = o === void 0 ? void 0 : str(o.newText, 2e4);
		if (path === void 0 || newText === void 0) continue;
		const old = o === void 0 ? void 0 : o.oldText;
		out.push({
			path,
			newText,
			oldText: old === null || typeof old !== "string" ? null : old.slice(0, 2e4)
		});
	}
	return out;
}
function repairAccordion(v, ctx, depth) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= GENUI_LIMITS.maxAccordionItems) break;
		const o = obj(item);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0 || o === void 0) continue;
		out.push({
			title,
			items: repairItems(o.items, ctx, depth + 1)
		});
	}
	return out;
}
function repairMeshes(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const m of v) {
		if (out.length >= GENUI_LIMITS.maxMeshes) break;
		const o = obj(m);
		const shape = o === void 0 ? void 0 : enu(o.shape, MESH_SHAPES);
		if (shape === void 0) continue;
		const scale = o === void 0 ? void 0 : num(o.scale, -1e6, 1e6) ?? tuple3(o.scale);
		const size = o === void 0 ? void 0 : num(o.size, -1e6, 1e6) ?? tuple3(o.size);
		out.push({
			shape,
			...opt("color", o === void 0 ? void 0 : color(o.color)),
			...opt("position", o === void 0 ? void 0 : tuple3(o.position)),
			...opt("rotation", o === void 0 ? void 0 : tuple3(o.rotation)),
			...opt("scale", scale),
			...opt("size", size)
		});
	}
	return out;
}
function tuple3(v) {
	if (!Array.isArray(v) || v.length !== 3) return void 0;
	const [a, b, c] = v;
	if (typeof a !== "number" || !Number.isFinite(a) || typeof b !== "number" || !Number.isFinite(b) || typeof c !== "number" || !Number.isFinite(c)) return void 0;
	return [
		Math.min(1e6, Math.max(-1e6, a)),
		Math.min(1e6, Math.max(-1e6, b)),
		Math.min(1e6, Math.max(-1e6, c))
	];
}
/** Clamp a coordinate/size to the 4px editorial grid. */
function grid4(v, min, max) {
	return Math.min(max, Math.max(min, Math.round(v / 4) * 4));
}
function repairDiagramNodes(v) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramNodes) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const id = str(o.id, 128);
		const label = str(o.label, GENUI_LIMITS.maxString);
		if (id === void 0 || label === void 0) continue;
		if (seen.has(id)) continue;
		seen.add(id);
		const nodeType = enu(o.type, DIAGRAM_NODE_TYPES);
		const x = o.x === void 0 ? void 0 : grid4(num(o.x, -1e6, 1e6) ?? 0, 0, 1e6);
		const y = o.y === void 0 ? void 0 : grid4(num(o.y, -1e6, 1e6) ?? 0, 0, 1e6);
		const w = o.w === void 0 ? void 0 : grid4(num(o.w, -1e6, 1e6) ?? 96, 40, 2e3);
		const h = o.h === void 0 ? void 0 : grid4(num(o.h, -1e6, 1e6) ?? 48, 24, 1200);
		out.push({
			id,
			label,
			...opt("sub", str(o.sub, 256)),
			...opt("type", nodeType),
			...opt("x", x),
			...opt("y", y),
			...opt("w", w),
			...opt("h", h),
			...opt("tag", str(o.tag, 32))
		});
	}
	return out;
}
function repairDiagramEdges(v) {
	if (v === void 0) return [];
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramEdges) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const from = str(o.from, 128);
		const to = str(o.to, 128);
		if (from === void 0 || to === void 0) continue;
		out.push({
			from,
			to,
			...opt("label", str(o.label, GENUI_LIMITS.maxDiagramLabel)),
			...opt("kind", enu(o.kind, DIAGRAM_EDGE_KINDS)),
			...opt("route", enu(o.route, DIAGRAM_ROUTES))
		});
	}
	return out;
}
function repairDiagramTheme(v) {
	const o = obj(v);
	if (o === void 0) return void 0;
	const out = {};
	for (const key of [
		"paper",
		"paper-2",
		"ink",
		"muted",
		"soft",
		"rule",
		"accent",
		"accent-tint",
		"link"
	]) {
		const c = color(o[key]);
		if (c !== void 0) out[key] = c;
	}
	return Object.keys(out).length === 0 ? void 0 : out;
}
function repairDiagramZones(v) {
	if (v === void 0) return [];
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const raw of v) {
		if (out.length >= GENUI_LIMITS.maxDiagramZones) break;
		const o = obj(raw);
		if (o === void 0) continue;
		const label = str(o.label, 64);
		if (label === void 0) continue;
		out.push({
			label,
			...opt("x", o.x === void 0 ? void 0 : grid4(num(o.x, -1e6, 1e6) ?? 0, 0, 1e6)),
			...opt("y", o.y === void 0 ? void 0 : grid4(num(o.y, -1e6, 1e6) ?? 0, 0, 1e6)),
			...opt("w", o.w === void 0 ? void 0 : grid4(num(o.w, -1e6, 1e6) ?? 100, 40, 2e3)),
			...opt("h", o.h === void 0 ? void 0 : grid4(num(o.h, -1e6, 1e6) ?? 100, 40, 1200))
		});
	}
	return out;
}
function repairDiagram(v) {
	const o = obj(v);
	if (o === void 0) return null;
	const kind = enu(o.kind, DIAGRAM_KINDS);
	if (kind === void 0) return null;
	const nodes = repairDiagramNodes(o.nodes);
	if (nodes === void 0) return null;
	const edges = repairDiagramEdges(o.edges);
	if (edges === void 0) return null;
	const zones = repairDiagramZones(o.zones);
	if (zones === void 0) return null;
	return {
		type: "diagram",
		kind,
		nodes,
		edges,
		...opt("zones", zones.length > 0 ? zones : void 0),
		...opt("variant", enu(o.variant, DIAGRAM_VARIANTS)),
		...opt("title", str(o.title, 256)),
		...opt("theme", repairDiagramTheme(o.theme))
	};
}
function repairTimeline(v, cap) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		const o = obj(item);
		const title = o === void 0 ? void 0 : str(o.title, 256);
		if (title === void 0) continue;
		out.push({
			title,
			...opt("desc", o === void 0 ? void 0 : str(o.desc, GENUI_LIMITS.maxString)),
			...opt("time", o === void 0 ? void 0 : str(o.time, 128))
		});
	}
	return out;
}
function repairTree(v, cap) {
	return walkTree(v, cap, GENUI_LIMITS.maxTreeDepth);
}
function walkTree(v, cap, depthLeft) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const item of v) {
		if (out.length >= cap) break;
		const o = obj(item);
		const name = o === void 0 ? void 0 : str(o.name, 256);
		if (name === void 0) continue;
		const children = o !== void 0 && depthLeft > 0 && Array.isArray(o.children) ? walkTree(o.children, cap, depthLeft - 1) : void 0;
		out.push({
			name,
			...opt("type", o === void 0 ? void 0 : enu(o.type, FILE_TYPES)),
			...opt("children", children)
		});
	}
	return out;
}
function repairQuizOptions(v, answer) {
	if (!Array.isArray(v)) return void 0;
	const out = [];
	for (const optItem of v) {
		if (out.length >= GENUI_LIMITS.maxQuizOptions) break;
		const o = obj(optItem);
		const label = typeof optItem === "string" ? str(optItem, 512) : o === void 0 ? void 0 : str(o.label, 512);
		if (label === void 0) continue;
		out.push({
			label,
			...opt("correct", o === void 0 ? void 0 : o.correct === true ? true : void 0),
			...opt("feedback", o === void 0 ? void 0 : str(o.feedback, GENUI_LIMITS.maxString))
		});
	}
	if (out.length === 0) return void 0;
	if (out.some((option) => option.correct === true)) return out;
	const answerIndex = typeof answer === "number" && Number.isFinite(answer) ? Math.trunc(answer) : typeof answer === "string" ? out.findIndex((option) => option.label === answer.slice(0, 512)) : -1;
	if (answerIndex < 0 || answerIndex >= out.length) return out;
	return out.map((option, index) => index === answerIndex ? {
		...option,
		correct: true
	} : option);
}
/**
* Patterns that indicate HTML/script injection in a string field. ECharts
* default `tooltip.renderMode: 'html'` writes tooltip content via
* `innerHTML`; even with renderMode forced to 'richText' (see below),
* filtering these patterns is defense-in-depth — a model (or a
* prompt-injected model) should never emit `<script>`, `onerror=`, or
* `javascript:` inside a chart option string.
*/
const ECHART_HTML_DANGER_RE = /<(?:script|img|svg|iframe|video|audio|object|embed|source)\b|on[a-z]+\s*=|javascript:/i;
/**
* Sanitize an ECharts option object: depth-bounded, budget-bounded
* pass-through that strips dangerous values (functions, `url()` in styles,
* HTML/script injection patterns in strings) but preserves the object shape
* ECharts needs. Scalars are KEPT: ECharts options are full of them,
* including inside `data` arrays (`data: [120, 150, 180]`,
* `xAxis.data: ['1月', '2月']`). Previously a scalar hit the plain-object
* gate below and returned undefined, so every primitive-valued array was
* filtered to empty and dropped — a chart with a full `option` rendered
* with empty series (blank canvas). This is a safety walk, not an ECharts
* semantic validator.
*
* Security: `tooltip.renderMode` is forced to `'richText'` on every tooltip
* object. ECharts' default `'html'` mode writes tooltip content via
* `innerHTML`, which is an XSS vector when the option originates from model
* output — a prompt-injected model could emit
* `{"tooltip":{"formatter":"<img src=x onerror=...>"}}` and execute
* arbitrary script. `richText` renders as text, never touching innerHTML.
*/
function sanitizeEChartOption(v, depth, budget) {
	if (budget.count <= 0) return void 0;
	budget.count -= 1;
	if (depth > GENUI_LIMITS.maxEChartOptionDepth) return void 0;
	if (typeof v === "string") {
		const s = v.slice(0, GENUI_LIMITS.maxString);
		if (s.toLowerCase().includes("url(") || ECHART_HTML_DANGER_RE.test(s)) return void 0;
		return s;
	}
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "boolean") return v;
	if (v === null) return null;
	if (Array.isArray(v)) {
		const cap = Math.min(v.length, GENUI_LIMITS.maxEChartArrayLen);
		const arr = [];
		for (let i = 0; i < cap; i++) {
			const s = sanitizeEChartOption(v[i], depth + 1, budget);
			if (s !== void 0) arr.push(s);
		}
		return arr.length > 0 ? arr : void 0;
	}
	const o = obj(v);
	if (o === void 0) return void 0;
	const out = {};
	for (const [key, val] of Object.entries(o)) {
		const s = sanitizeEChartOption(val, depth + 1, budget);
		if (s === void 0) continue;
		if (key === "tooltip" && typeof s === "object" && s !== null && !Array.isArray(s)) s.renderMode = "richText";
		out[key] = s;
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
/**
* Deterministically repair a raw spec value into a renderable GenuiSpec.
* Returns null only when the root is not an object with an `items` array
* (a bare component root is wrapped into a col first — the documented fence
* vocabulary allows single-component bodies); every other defect is healed by
* dropping/clamping/truncating. Idempotent: repairing a repaired spec is a
* no-op.
*/
function repairCanonicalGenuiSpec(value) {
	const v = obj(value);
	if (v === void 0) return null;
	if (!Array.isArray(v.items)) {
		const wrapped = wrapSingleComponentRoot(value);
		if (wrapped === null) return null;
		return repairCanonicalGenuiSpec(wrapped);
	}
	const ctx = { remaining: GENUI_LIMITS.maxNodes };
	return {
		...opt("title", str(v.title, GENUI_LIMITS.maxString)),
		...opt("gap", num(v.gap, 0, 96)),
		...opt("panel", v.panel === true ? true : void 0),
		...opt("append", v.append === true ? true : void 0),
		items: repairItems(v.items, ctx, 0)
	};
}
/**
* Count the nodes of a spec tree (every item, descending into tabs /
* accordion / file-tree / list containers — the same descent
* `validateGenuiSpec` walks). Shared by the panel fold (node-budget gate)
* and validation, so the panel never runs a second, divergent traversal.
* `cap` bounds the walk for hostile inputs; the panel passes
* `PANEL_LIMITS.maxNodes + 1` to detect overflow without counting the whole
* tree.
*/
function countGenuiNodes(value, cap = Number.POSITIVE_INFINITY) {
	let count = 0;
	const walk = (list) => {
		if (!Array.isArray(list)) return;
		for (const item of list) {
			if (count >= cap) return;
			count += 1;
			const v = obj(item);
			if (v === void 0) continue;
			if (v.type === "tabs" && Array.isArray(v.tabs)) for (const t of v.tabs) {
				if (count >= cap) return;
				const to = obj(t);
				if (to !== void 0) walk(to.items);
			}
			else if (v.type === "accordion" && Array.isArray(v.items)) for (const it of v.items) {
				if (count >= cap) return;
				const io = obj(it);
				if (io !== void 0) walk(io.items);
			}
			else if ((v.type === "row" || v.type === "col" || v.type === "grid" || v.type === "card") && Array.isArray(v.items)) walk(v.items);
			else if (v.type === "file-tree") {} else if (v.type === "list" && Array.isArray(v.items)) for (const li of v.items) {
				if (count >= cap) return;
				const lo = obj(li);
				if (lo !== void 0 && typeof lo.type === "string") walk([lo]);
			}
		}
	};
	const root = obj(value);
	walk(root === void 0 ? [] : root.items);
	return count;
}
/** Every white-listed node `type`. Keep in sync with the repairNode switch —
* validate_dsh_ui uses it to tell declared GenUI nodes apart from unrelated
* `"type"` strings (e.g. file-tree's `{type:'file'}` children). */
const GENUI_NODE_TYPES = GENUI_NATIVE_TYPES;
/**
* Visit and count declared nodes in a raw spec tree: objects whose `type` is a
* white-listed string, descending the same containers `countGenuiNodes`
* walks. Callers can inspect field semantics or compare the count with the
* repaired tree without maintaining another traversal.
*/
function visitDeclaredGenuiNodes(value, cap, visit) {
	let count = 0;
	const declared = (candidate) => {
		const o = obj(candidate);
		return o !== void 0 && typeof o.type === "string" && GENUI_NODE_TYPES.has(o.type);
	};
	function walk(list, path) {
		if (!Array.isArray(list)) return;
		for (let index = 0; index < list.length; index++) {
			walkNode(list[index], `${path}[${index}]`);
			if (count >= cap) return;
		}
	}
	function walkNode(item, at) {
		if (count >= cap || !declared(item)) return;
		const v = obj(item);
		if (v === void 0) return;
		count += 1;
		visit(v, at);
		if (v.type === "tabs" && Array.isArray(v.tabs)) for (let tab = 0; tab < v.tabs.length; tab++) walkItemsOf(v.tabs[tab], `${at}.tabs[${tab}]`);
		else if (v.type === "accordion" && Array.isArray(v.items)) for (let row = 0; row < v.items.length; row++) walkItemsOf(v.items[row], `${at}.items[${row}]`);
		else if ((v.type === "row" || v.type === "col" || v.type === "grid" || v.type === "card") && Array.isArray(v.items)) walk(v.items, `${at}.items`);
		else if (v.type === "list" && Array.isArray(v.items)) for (let row = 0; row < v.items.length; row++) walkNode(v.items[row], `${at}.items[${row}]`);
	}
	function walkItemsOf(holder, path) {
		const o = obj(holder);
		if (o === void 0) return;
		const items = o.items !== void 0 ? o.items : o.content;
		if (Array.isArray(items)) walk(items, `${path}.items`);
		else walkNode(items, `${path}.items`);
	}
	const root = obj(value);
	if (root === void 0) return count;
	if (!Array.isArray(root.items) && declared(value)) walkNode(value, "spec");
	else walk(root.items, "items");
	return count;
}
/**
* Count white-listed nodes declared by a raw spec before repair drops invalid entries.
* @param value - raw GenUI spec.
* @param cap - traversal ceiling.
* @returns declared node count up to the ceiling.
*/
function countDeclaredGenuiNodes(value, cap = Number.POSITIVE_INFINITY) {
	return visitDeclaredGenuiNodes(value, cap, () => {});
}
/** Count native nodes that survived repair, excluding opaque custom nodes. */
function countRenderedNativeGenuiNodes(value, cap = Number.POSITIVE_INFINITY) {
	return countDeclaredGenuiNodes(value, cap);
}
/**
* Validate a raw spec value against the white list and limits, collecting
* human-readable problems. Unlike repair this never mutates: it is a
* diagnostic for tests and tooling. Unknown `type`s are reported (a plugin
* custom type is valid only when a renderer is registered — the guard cannot
* know, so it flags them as warnings).
*/
function validateCanonicalGenuiSpec(value) {
	const errors = [];
	const v = obj(value);
	if (v === void 0) return {
		ok: false,
		errors: ["spec root must be an object"]
	};
	if (!Array.isArray(v.items)) {
		const wrapped = wrapSingleComponentRoot(value);
		if (wrapped !== null) return validateCanonicalGenuiSpec(wrapped);
		return {
			ok: false,
			errors: ["spec.items must be an array"]
		};
	}
	validateSchemaFieldKinds(v, "spec", GENUI_SPEC_SCHEMA, errors, ["items"]);
	let count = 0;
	let capped = false;
	const walk = (list, depth, path) => {
		if (capped) return;
		if (!Array.isArray(list)) {
			errors.push(`${path} must be an array`);
			return;
		}
		for (let i = 0; i < list.length; i++) {
			if (capped || count >= GENUI_LIMITS.maxNodes) {
				if (!capped) {
					errors.push(`spec exceeds ${GENUI_LIMITS.maxNodes} nodes; tail elided`);
					capped = true;
				}
				return;
			}
			count += 1;
			const at = `${path}[${i}]`;
			validateNode(list[i], depth, at, errors, walk);
		}
	};
	walk(v.items, 0, "items");
	return {
		ok: errors.length === 0,
		errors
	};
}
/**
* Run the shared canonical GenUI pipeline.
*
* The pipeline normalizes aliases, applies the existing deterministic repair
* and security filters, validates the canonical input, and reports native
* declarations that disappeared during repair. Custom nodes stay opaque and
* do not participate in native unknown-field diagnostics.
*
* @param value - Raw GenUI spec or bare component.
* @returns Canonical input, repaired output, diagnostics, and node counts.
*/
function processGenuiSpec(value) {
	const normalized = normalizeGenuiSpec(value);
	const repaired = repairCanonicalGenuiSpec(normalized.value);
	const validation = validateCanonicalGenuiSpec(normalized.value);
	const declaredNativeCount = countDeclaredGenuiNodes(normalized.value, GENUI_LIMITS.maxNodes + 1);
	const renderedNativeCount = repaired === null ? 0 : countRenderedNativeGenuiNodes(repaired);
	const renderedTotalCount = repaired === null ? 0 : countGenuiNodes(repaired);
	const errors = validation.errors.filter((error) => !error.includes(": unknown type "));
	if (declaredNativeCount > renderedNativeCount) errors.push(`repair dropped ${declaredNativeCount - renderedNativeCount} declared native node(s): declared ${declaredNativeCount}, rendered ${renderedNativeCount}`);
	return {
		value: normalized.value,
		normalized: normalized.value,
		repaired,
		spec: repaired,
		errors,
		warnings: [...normalized.warnings, ...diagnoseUnknownGenuiFields(normalized.value)],
		declaredCount: declaredNativeCount,
		renderedCount: renderedTotalCount,
		declaredNativeCount,
		renderedNativeCount,
		renderedTotalCount
	};
}
/** Return whether the only process errors describe an intentional budget tail cut. */
function isIntentionalBudgetCut(processed) {
	return processed.errors.length > 0 && processed.errors.every((error) => error.startsWith("spec exceeds ") || error.startsWith("repair dropped ")) && processed.renderedNativeCount === GENUI_LIMITS.maxNodes && processed.declaredNativeCount === GENUI_LIMITS.maxNodes + 1;
}
/** Decide whether a repaired spec is safe to expose to any GenUI renderer. */
function isRenderableProcess(processed) {
	return processed.spec !== null && (processed.errors.length === 0 || isIntentionalBudgetCut(processed));
}
function validateChartData(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let index = 0; index < value.length; index++) {
		const datum = obj(value[index]);
		const path = `${at}[${index}]`;
		if (datum === void 0) {
			errors.push(`${path} must be an object`);
			continue;
		}
		if (typeof datum.label !== "string") errors.push(`${path}.label must be a string`);
		if (typeof datum.value !== "number" || !Number.isFinite(datum.value)) errors.push(`${path}.value must be a finite number`);
		if (datum.color !== void 0 && typeof datum.color !== "string") errors.push(`${path}.color must be a string`);
	}
}
function validateChartSeries(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let index = 0; index < value.length; index++) {
		const series = obj(value[index]);
		const path = `${at}[${index}]`;
		if (series === void 0) {
			errors.push(`${path} must be an object`);
			continue;
		}
		if (typeof series.label !== "string") errors.push(`${path}.label must be a string`);
		if (series.color !== void 0 && typeof series.color !== "string") errors.push(`${path}.color must be a string`);
		if (!Array.isArray(series.data)) errors.push(`${path}.data must be an array`);
		validateChartData(series.data, `${path}.data`, errors);
	}
}
function validateChartNode(v, at, errors) {
	if (!Array.isArray(v.data) && !Array.isArray(v.series)) errors.push(`${at}: type 'chart' requires data or series (array)`);
	if (v.variant !== void 0) errors.push(`${at}.variant is unsupported; use kind`);
	if (v.data !== void 0 && !Array.isArray(v.data)) errors.push(`${at}.data must be an array`);
	if (v.series !== void 0 && !Array.isArray(v.series)) errors.push(`${at}.series must be an array`);
	if (v.kind !== void 0 && (typeof v.kind !== "string" || !CHART_KINDS.includes(v.kind))) errors.push(`${at}.kind must be bars, line, or donut`);
	const kind = v.kind === void 0 ? "bars" : v.kind;
	const series = Array.isArray(v.series) ? v.series : void 0;
	if (Array.isArray(v.data) && v.data.length === 0 && (series === void 0 || series.length === 0)) errors.push(`${at}.data must not be empty`);
	if (series !== void 0) {
		if (series.length === 0) errors.push(`${at}.series must not be empty`);
		if (kind === "donut") errors.push(`${at}.series is only supported for bars and line`);
		for (let index = 0; index < series.length; index++) {
			const entry = obj(series[index]);
			if (entry !== void 0 && Array.isArray(entry.data) && entry.data.length === 0) errors.push(`${at}.series[${index}].data must not be empty`);
		}
	}
	if (kind === "donut" && v.data === void 0) errors.push(`${at}.data is required for donut`);
	if (kind === "line" && v.data === void 0 && (series === void 0 || series.length === 0)) errors.push(`${at}.data is required for line (or provide series)`);
	validateChartData(v.data, `${at}.data`, errors);
	validateChartSeries(v.series, `${at}.series`, errors);
}
/** Validate table rows before repair can silently remove malformed cells. */
function validateTableRows(value, at, errors) {
	if (!Array.isArray(value)) return;
	for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
		const row = value[rowIndex];
		if (obj(row) !== void 0) continue;
		if (!Array.isArray(row)) {
			errors.push(`${at}[${rowIndex}] must be an array or object`);
			continue;
		}
		for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
			const cell = row[cellIndex];
			if (typeof cell !== "string" && (typeof cell !== "number" || !Number.isFinite(cell))) errors.push(`${at}[${rowIndex}][${cellIndex}] must be a string or finite number`);
		}
	}
}
function validateNode(value, depth, at, errors, walk) {
	if (depth > GENUI_LIMITS.maxDepth) {
		errors.push(`${at}: exceeds max depth ${GENUI_LIMITS.maxDepth}`);
		return;
	}
	const v = obj(value);
	if (v === void 0) {
		errors.push(`${at}: must be an object`);
		return;
	}
	const type = v.type;
	if (typeof type !== "string") {
		errors.push(`${at}: missing string 'type'`);
		return;
	}
	const isStr = (name) => {
		if (v[name] !== void 0 && typeof v[name] !== "string") errors.push(`${at}: '${name}' must be a string`);
	};
	const isNum = (name) => {
		if (v[name] !== void 0 && (typeof v[name] !== "number" || !Number.isFinite(v[name]))) errors.push(`${at}: '${name}' must be a finite number`);
	};
	switch (type) {
		case "text":
			if (typeof v.content !== "string" && typeof v.text !== "string") errors.push(`${at}: type 'text' requires content or text (string)`);
			isStr("content");
			isStr("text");
			break;
		case "row":
		case "col":
		case "card":
		case "grid":
			if (!Array.isArray(v.items)) errors.push(`${at}: type '${type}' requires items (array)`);
			walk(v.items, depth + 1, `${at}.items`);
			if (type === "grid") isNum("cols");
			break;
		case "button":
		case "checkbox":
		case "link":
		case "switch":
			if (typeof v.label !== "string") errors.push(`${at}: type '${type}' requires label (string)`);
			isStr("label");
			break;
		case "image":
		case "audio":
		case "video":
			if (typeof v.src !== "string") errors.push(`${at}: type '${type}' requires src (string)`);
			isStr("src");
			isStr("alt");
			if (type === "video") isStr("poster");
			break;
		case "slider":
			isStr("label");
			isNum("min");
			isNum("max");
			isNum("step");
			isNum("value");
			break;
		case "input":
		case "textarea":
			isStr("label");
			isStr("placeholder");
			isStr("value");
			break;
		case "select":
		case "radio":
			if (!Array.isArray(v.options)) errors.push(`${at}: type '${type}' requires options (array)`);
			break;
		case "submit":
			if (typeof v.label !== "string") errors.push(`${at}: type 'submit' requires label (string)`);
			break;
		case "badge":
			if (typeof v.label !== "string" && typeof v.text !== "string" && typeof v.value !== "string") errors.push(`${at}: type 'badge' requires label, text, or value (string)`);
			isStr("label");
			isStr("text");
			isStr("value");
			break;
		case "hero":
			if (typeof v.title !== "string") errors.push(`${at}: type 'hero' requires title (string)`);
			isStr("subtitle");
			break;
		case "stat":
			if (typeof v.label !== "string") errors.push(`${at}: type 'stat' requires label (string)`);
			if (typeof v.value !== "string") errors.push(`${at}: type 'stat' requires value (string)`);
			isStr("delta");
			break;
		case "progress":
			if (typeof v.value !== "number" || !Number.isFinite(v.value) || v.value < 0 || v.value > 100) errors.push(`${at}: type 'progress' requires value (number 0..100)`);
			isNum("value");
			break;
		case "avatar":
			if (typeof v.name !== "string") errors.push(`${at}: type 'avatar' requires name (string)`);
			break;
		case "list":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'list' requires items (array)`);
			if (Array.isArray(v.items)) for (let i = 0; i < v.items.length; i++) {
				const item = obj(v.items[i]);
				if (item !== void 0 && typeof item.type === "string") validateNode(item, depth + 1, `${at}.items[${i}]`, errors, walk);
			}
			break;
		case "table":
			if (!Array.isArray(v.columns)) errors.push(`${at}: type 'table' requires columns (array)`);
			if (!Array.isArray(v.rows)) errors.push(`${at}: type 'table' requires rows (array)`);
			if (v.types !== void 0 && !Array.isArray(v.types)) errors.push(`${at}.types must be an array of column cell types`);
			if (v.details !== void 0 && !Array.isArray(v.details)) errors.push(`${at}.details must be an array aligned with rows`);
			validateTableRows(v.rows, `${at}.rows`, errors);
			break;
		case "chart":
			validateChartNode(v, at, errors);
			break;
		case "tabs":
			if (!Array.isArray(v.tabs)) errors.push(`${at}: type 'tabs' requires tabs (array)`);
			if (Array.isArray(v.tabs)) for (let i = 0; i < v.tabs.length; i++) {
				const t = obj(v.tabs[i]);
				if (t === void 0) {
					errors.push(`${at}.tabs[${i}] must be an object`);
					continue;
				}
				if (typeof t.label !== "string") errors.push(`${at}.tabs[${i}].label must be a string`);
				walk(t.items, depth + 1, `${at}.tabs[${i}].items`);
			}
			break;
		case "plot":
			if (!Array.isArray(v.series)) errors.push(`${at}: type 'plot' requires series (array)`);
			break;
		case "callout":
			if (typeof v.content !== "string") errors.push(`${at}: type 'callout' requires content (string)`);
			break;
		case "steps":
			if (!Array.isArray(v.steps)) errors.push(`${at}: type 'steps' requires steps (array)`);
			break;
		case "keyvalue":
			if (!Array.isArray(v.pairs)) errors.push(`${at}: type 'keyvalue' requires pairs (array)`);
			break;
		case "diff":
			if (!Array.isArray(v.diffs)) errors.push(`${at}: type 'diff' requires diffs (array)`);
			break;
		case "json":
			if (!("value" in v)) errors.push(`${at}: type 'json' requires value`);
			break;
		case "code":
			if (typeof v.code !== "string") errors.push(`${at}: type 'code' requires code (string)`);
			break;
		case "accordion":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'accordion' requires items (array)`);
			if (Array.isArray(v.items)) for (let i = 0; i < v.items.length; i++) {
				const item = obj(v.items[i]);
				if (item === void 0) {
					errors.push(`${at}.items[${i}] must be an object`);
					continue;
				}
				if (typeof item.title !== "string") errors.push(`${at}.items[${i}].title must be a string`);
				walk(item.items, depth + 1, `${at}.items[${i}].items`);
			}
			break;
		case "copy":
			if (typeof v.text !== "string") errors.push(`${at}: type 'copy' requires text (string)`);
			break;
		case "mermaid":
			if (typeof v.code !== "string") errors.push(`${at}: type 'mermaid' requires code (string)`);
			break;
		case "scene3d":
			if (!Array.isArray(v.meshes)) errors.push(`${at}: type 'scene3d' requires meshes (array)`);
			break;
		case "timeline":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'timeline' requires items (array)`);
			break;
		case "file-tree":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'file-tree' requires items (array)`);
			break;
		case "breadcrumb":
			if (!Array.isArray(v.items)) errors.push(`${at}: type 'breadcrumb' requires items (array)`);
			break;
		case "quiz":
			if (typeof v.question !== "string") errors.push(`${at}: type 'quiz' requires question (string)`);
			if (!Array.isArray(v.options)) errors.push(`${at}: type 'quiz' requires options (array)`);
			break;
		case "diagram":
			if (typeof v.kind !== "string") errors.push(`${at}: type 'diagram' requires kind (string)`);
			if (!Array.isArray(v.nodes)) errors.push(`${at}: type 'diagram' requires nodes (array)`);
			if (v.edges !== void 0 && !Array.isArray(v.edges)) errors.push(`${at}: type 'diagram' requires edges (array) when present`);
			break;
		case "echart":
			if (v.option === void 0 && v.data === void 0 && v.series === void 0 && (!Array.isArray(v.links) || v.links.length === 0)) errors.push(`${at}: type 'echart' requires option, data, series, or links`);
			isNum("height");
			break;
		default: errors.push(`${at}: unknown type '${type}' (custom renderer?)`);
	}
	const definition = COMPONENT_SCHEMAS[type];
	if (definition !== void 0) validateRegistryFields(v, at, definition, errors);
}
//#endregion
//#region src/shared/fence-repair.ts
/**
* Tier-2 repair — SETTLED MESSAGES ONLY (never while streaming): heals
* structural incompleteness — missing closing quotes/brackets — by appending
* the missing terminators, and heals stray closers — a `]` mistyped as `}` or
* a duplicated terminator — by skipping closers that do not match the open
* stack (they cannot be legal JSON). Callers gate it on settled messages (the
* client uses the host-provided fence source; the validate tool is by
* definition pre-emission), so a streaming half can never flash premature UI.
*
* ONE unified scan: the tier-1 fixes (quote escaping + trailing-comma drops)
* are folded into the same pass, so bodies that combine BOTH defect classes
* (a trailing comma AND a missing closer) heal in one shot — the old
* two-phase chain lost tier-1's partial work when its whole-body parse
* failed, and re-scanning the raw text could not compose the repairs.
* Adopted only when the completed body parses as whole JSON.
*/
function completeFenceJson(raw) {
	try {
		JSON.parse(raw);
		return null;
	} catch {}
	let out = "";
	const stack = [];
	let inString = false;
	let escaped = false;
	let repairs = 0;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		if (escaped) {
			out += ch;
			escaped = false;
			continue;
		}
		if (inString) {
			if (ch === "\\") {
				out += ch;
				escaped = true;
				continue;
			}
			if (ch !== "\"") {
				out += ch;
				continue;
			}
			let j = i + 1;
			while (j < raw.length && (raw[j] === " " || raw[j] === "	" || raw[j] === "\n" || raw[j] === "\r")) j++;
			const next = j < raw.length ? raw[j] : "";
			if (next === "," || next === "]" || next === "}" || next === ":" || next === "") {
				inString = false;
				out += ch;
			} else {
				out += "\\\"";
				repairs++;
			}
			continue;
		}
		if (ch === "\"") {
			inString = true;
			out += ch;
			continue;
		}
		if (ch === "{") {
			stack.push("}");
			out += ch;
			continue;
		}
		if (ch === "[") {
			stack.push("]");
			out += ch;
			continue;
		}
		if (ch === "}" || ch === "]") {
			if (stack[stack.length - 1] === ch) {
				stack.pop();
				out += ch;
			} else repairs++;
			continue;
		}
		if (ch === ",") {
			let j = i + 1;
			while (j < raw.length && (raw[j] === " " || raw[j] === "	" || raw[j] === "\n" || raw[j] === "\r")) j++;
			const next = j < raw.length ? raw[j] : "";
			if (next === "}" || next === "]" || next === "") {
				repairs++;
				continue;
			}
		}
		out += ch;
	}
	if (inString) {
		out += "\"";
		repairs++;
	}
	while (stack.length > 0) {
		out += stack.pop();
		repairs++;
	}
	if (repairs === 0) return null;
	try {
		JSON.parse(out);
		return {
			text: out,
			repairs
		};
	} catch {
		return null;
	}
}
//#endregion
//#region src/plugin/tool.ts
/**
* Arguments schema: an open `spec` slot. The schema must NOT reject anything
* the guard could repair — the model's component trees are imperfect by
* nature, and the guard heals them; argument validation would only strand
* them. `additionalProperties: false` keeps the call shape honest.
*
* `spec` IS typed `object` on purpose: the guard can only repair plain
* records (a serialized JSON string, array, or scalar root is unusable), so
* argument validation rejecting non-objects loses nothing repairable — and
* it stops the model from double-encoding the tree as a string (observed
* twice in the wild), failing fast with a clear schema error instead.
*/
const RENDER_UI_PARAMETERS = {
	type: "object",
	properties: { spec: {
		type: "object",
		description: [
			"Render structured UI for the user (tool-row card). USE THIS whenever the answer contains ≥3 parallel points, a comparison, numbers/metrics, a step sequence, a flow, or a status/report — do NOT write those as markdown bullets or a markdown table.",
			"Same white-listed vocabulary as the ```dsh-ui fence (see the GenUI system-prompt section). Pick the fence when the UI belongs in the message body; pick this tool when the deliverable is a self-contained card.",
			"Deep-validated and repaired by the renderer. Pass the spec as a JSON OBJECT — never as a serialized JSON string (a string fails argument validation)."
		].join(" "),
		properties: {
			title: {
				type: "string",
				description: "Short title shown as the card banner."
			},
			gap: {
				type: "number",
				description: "Vertical gap between root items in px."
			},
			panel: {
				type: "boolean",
				description: "Panel-only: renders into the session panel dock instead of the message flow."
			},
			items: {
				type: "array",
				description: "Root component list (white-listed vocabulary).",
				items: { type: "object" }
			}
		}
	} },
	required: ["spec"],
	additionalProperties: false
};
/** The tool's canonical value is a short model-facing summary string. */
const RENDER_UI_OUTPUT_SCHEMA = {
	type: "string",
	description: "One-line human-readable render summary for the model."
};
/**
* Read the `spec` argument defensively (presenters run on replayed args).
*
* The harness tool-call bridge has been observed to deliver arguments in
* shapes other than the authored `{ spec: <object> }`:
* - `{ spec: "<JSON string>" }` — spec serialized to text;
* - `{ arguments: "<JSON string>" }` / `{ arguments: <object> }` — a
*   double-encoded wrapper from the SDK tool-call bridge (seen live in the
*   web GUI: small specs arrived wrapped this way, large specs arrived with
*   their JSON corrupted mid-stream);
* - a bare JSON string (double-encoded root).
* Each shape is unwrapped here so the guard can repair the actual tree.
* Corrupted JSON cannot be recovered (bytes were lost in transit): it yields
* `undefined` plus a diagnostic log line for the transport-layer bug.
*/
function specOf(args) {
	if (typeof args === "string") return parseSpecJson(args, "bare-string");
	if (typeof args !== "object" || args === null) return void 0;
	const record = args;
	if ("spec" in record) {
		const s = record.spec;
		if (typeof s === "string") return parseSpecJson(s, "spec-string");
		return unwrapSpec(s, "spec");
	}
	if ("arguments" in record) {
		const a = record.arguments;
		if (typeof a === "string") return parseSpecJson(a, "arguments-string");
		if (typeof a === "object" && a !== null) return unwrapSpec(a, "arguments");
	}
}
/**
* Peel nested `{ spec: ... }` wrapper layers. Observed bridge shapes nest the
* authored `spec` object one or more levels deep (e.g. the serialized text
* inside `{ arguments: "..." }` is itself `{ spec: { title, gap, items } }`),
* so unwrapping stops only at a value that carries no `spec` key.
*/
function unwrapSpec(value, shape) {
	if (typeof value === "object" && value !== null) {
		const record = value;
		if ("spec" in record) {
			const s = record.spec;
			if (typeof s === "string") return parseSpecJson(s, `${shape}/spec-string`);
			return unwrapSpec(s, `${shape}/spec`);
		}
	}
	return value;
}
/** Try to decode a serialized spec; log a diagnostic when it is broken. */
function parseSpecJson(raw, shape) {
	try {
		return unwrapSpec(JSON.parse(raw), shape);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		const pos = /position (\d+)/.exec(detail)?.[1] ?? "?";
		console.error(`[genui-tool] spec wrapped as ${shape} but its JSON is broken (${raw.length} bytes, error at ${pos}); cannot recover — bytes lost in transit`);
		return;
	}
}
/** Process a raw tool value once for all render-time decisions. */
function processRenderableValue(value) {
	return processGenuiSpec(value);
}
/** Render process diagnostics as stable model-facing warning lines. */
function formatProcessWarnings(processed) {
	return processed.warnings.map((warning) => {
		if (warning.kind === "alias" && warning.canonical !== void 0) {
			const separator = warning.path.lastIndexOf(".");
			const canonicalPath = `${separator < 0 ? "" : warning.path.slice(0, separator + 1)}${warning.canonical}`;
			return warning.message.includes("ignored") ? `⚠️ 已忽略别名字段：${warning.path} → ${canonicalPath}（ignored because canonical field '${warning.canonical}' is present）` : `⚠️ 已规范化字段：${warning.path} → ${canonicalPath}（normalized/adopted as '${warning.canonical}'）`;
		}
		return `⚠️ ${warning.message}`;
	});
}
/** Format chart-specific process errors while keeping other schema errors generic. */
function formatProcessFailure(processed) {
	const chartErrors = processed.errors.filter((error) => /(?:variant is unsupported|kind must be bars, line, or donut|requires data or series|(?:data|series) is required for|(?:\.data|\.series)(?:\[\d+\])?(?:\.(?:data|label|value|color))? must|series is only supported for bars)/.test(error));
	return chartErrors.length === 0 ? void 0 : `❌ chart 字段验证失败：\n- ${chartErrors.join("\n- ")}`;
}
/** Return the legacy validation text for a process that dropped native nodes. */
function droppedNodeFailure(processed) {
	if (!processed.errors.some((error) => error.startsWith("repair dropped "))) return void 0;
	const dropped = processed.declaredNativeCount - processed.renderedNativeCount;
	return `❌ 验证未通过：检测到声明了 ${processed.declaredNativeCount} 个组件，但仅成功解析出 ${processed.renderedNativeCount} 个（有 ${dropped} 个组件因字段格式异常被丢弃）。常见原因：table 的 columns/rows 不是二维字符串数组、tabs 的 items/content 缺失、嵌套组件字段类型不符。请修正后重新验证。`;
}
/** Tool-call title shared by the pending and completed presentations. */
function cardTitle(args) {
	const processed = processRenderableValue(specOf(args));
	if (!isRenderableProcess(processed) || processed.spec === null) return void 0;
	return `渲染 UI：${processed.spec.title ?? "未命名"}`;
}
/**
* Build the render_ui tool definition. Registered by the plugin node half;
* `ctx.tools.register` consumes it exactly like a `defineTool` result.
*/
function createRenderUiTool() {
	return {
		name: "render_ui",
		description: "Render an interactive UI card in the conversation tool row by passing a GenUI spec (a white-listed component tree; the same vocabulary as the ```dsh-ui fence, see the system prompt). Use it when the user asks for a structured panel, dashboard, or form that belongs in the tool row rather than inline in the reply. The card is interactive client-side (tabs, buttons, inputs, switches); components carrying an \"action\" field send [genui-action] back to you when the user interacts, and you should re-render the updated UI.",
		parameters: RENDER_UI_PARAMETERS,
		output: {
			schema: RENDER_UI_OUTPUT_SCHEMA,
			render(_args, value) {
				return [{
					type: "text",
					text: String(value)
				}];
			},
			presentationMeta(args) {
				const processed = processRenderableValue(specOf(args));
				return isRenderableProcess(processed) ? processed.spec : null;
			}
		},
		async execute(args) {
			const processed = processRenderableValue(specOf(args));
			if (processed.spec === null) return "render_ui：spec 无效 —— 根对象需要 \"items\" 数组（组件树白名单见系统提示词），请修正后重试。";
			if (!isRenderableProcess(processed)) throw new Error("render_ui spec invalid: " + processed.errors.join("; "));
			const title = processed.spec.title ?? "未命名";
			const warnings = formatProcessWarnings(processed);
			const warningText = warnings.length === 0 ? "" : `\n${warnings.join("\n")}`;
			return `已渲染 UI「${title}」（${processed.renderedCount} 个组件）。用户现在可以看到这张卡片；组件带 action 时，用户交互会以 [genui-action] 消息发回给你，届时请重新渲染更新后的界面。${warningText}`;
		},
		presentCall(args) {
			const title = cardTitle(args);
			return title === void 0 ? void 0 : {
				card: "generic",
				title,
				kind: "other"
			};
		},
		presentResult(args) {
			const title = cardTitle(args);
			return title === void 0 ? void 0 : {
				card: "generic",
				title
			};
		}
	};
}
/**
* The `validate_dsh_ui` tool: a repair channel for the ```dsh-ui fence.
*
* It reports whether a fence body parses as a valid GenUI spec and, when it
* does not, WHERE it breaks and WHAT is likely wrong (bracket counts, common
* typo classes), returning the auto-repaired JSON whenever the body is
* repairable. Purely local: no LLM, no network, no DOM.
*
* It is deliberately NOT a pre-flight the model runs before every fence.
* `resolveGenuiSpec` already repairs the emitted fence client-side (tier-1
* quote/comma healing on every render, tier-2 completion once the message
* settles) and an unrecoverable body degrades to a code block, so validating
* first buys nothing for a well-formed spec — while costing a full extra
* model round trip that writes the same JSON twice. Measured on a 730-char
* itinerary card: 18.4s to compose the spec into a validate call, 3.3s of
* step overhead, then 18.4s to emit the byte-identical spec again — 22s of
* that produced nothing the reader could see, which reads as a frozen page.
* The model therefore reaches for this tool when a fence actually failed, or
* when it is about to hand-write an unusually large body.
*/
const VALIDATE_DESCRIPTION = "Repair the JSON body of a ```dsh-ui fence. Do NOT call this before emitting a fence you believe is well-formed: the renderer already heals quote/comma/bracket damage, and validating first makes you write the same JSON twice, which doubles the wait before anything appears on screen. Call it only when a fence you already emitted failed to render, or when you are about to hand-write an unusually large body (roughly 100+ lines) and want the brackets checked once. Pass the exact JSON text as the \"spec\" argument (a string). Returns ✅ when it parses as a valid GenUI spec, or ❌ with the exact position, bracket counts, and likely causes when it does not. When the JSON is broken but repairable (unescaped quotes, trailing commas, missing closers), the ❌ reply INCLUDES the auto-repaired JSON — copy it verbatim into the fence instead of rewriting by hand.";
const VALIDATE_PARAMETERS = {
	type: "object",
	properties: { spec: {
		oneOf: [{
			type: "string",
			description: "The exact JSON text of the fence body."
		}, {
			type: "object",
			description: "The spec object (serialized before validation)."
		}],
		description: "The dsh-ui fence body to validate: pass the JSON as a string for an exact check, or as the spec object."
	} },
	required: ["spec"],
	additionalProperties: false
};
/** Read the fence-body text from the call args (string preferred, object serialized). */
function fenceTextOf(args) {
	if (typeof args === "string") return args;
	if (typeof args !== "object" || args === null) return null;
	const record = args;
	const s = "spec" in record ? record.spec : "arguments" in record ? record.arguments : void 0;
	if (typeof s === "string") return s;
	if (typeof s === "object" && s !== null) return JSON.stringify(s);
	return null;
}
/** Count structural brackets outside string literals. */
function bracketCounts(raw) {
	const counts = {
		"{": 0,
		"}": 0,
		"[": 0,
		"]": 0
	};
	let inString = false;
	let escaped = false;
	for (let i = 0; i < raw.length; i++) {
		const ch = raw[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (inString) {
			if (ch === "\\") escaped = true;
			else if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			continue;
		}
		if (ch === "{") counts["{"] += 1;
		else if (ch === "}") counts["}"] += 1;
		else if (ch === "[") counts["["] += 1;
		else if (ch === "]") counts["]"] += 1;
	}
	return counts;
}
/** Short structural hint from bracket counts (empty when balanced). */
function bracketDiagnostic(raw) {
	const c = bracketCounts(raw);
	const diffs = [];
	if (c["{"] !== c["}"]) {
		const d = c["{"] - c["}"];
		diffs.push(`{ ×${c["{"]} / } ×${c["}"]} → ${d > 0 ? `缺 ${d} 个 }` : `多 ${-d} 个 }`}`);
	}
	if (c["["] !== c["]"]) {
		const d = c["["] - c["]"];
		diffs.push(`[ ×${c["["]} / ] ×${c["]"]} → ${d > 0 ? `缺 ${d} 个 ]` : `多 ${-d} 个 ]`}`);
	}
	return diffs.length === 0 ? "" : `  括号计数：${diffs.join("；")}（长表格最易在收尾处错位，如把 ]]}]} 写成 ]}]}]}）\n`;
}
const COMMON_CAUSES = "常见原因：① 收尾括号错位/缺失（{ 与 }、[ 与 ] 数量不相等）② 字符串值内用了半角引号 \"（中文引语请用 “” 或 「」）③ 尾随逗号 ④ 字符串未闭合";
/** Build the validate_dsh_ui tool definition (registered alongside render_ui). */
function createValidateDshUiTool() {
	return {
		name: "validate_dsh_ui",
		description: VALIDATE_DESCRIPTION,
		parameters: VALIDATE_PARAMETERS,
		output: {
			schema: {
				type: "string",
				description: "Validation verdict for the model."
			},
			render(_args, value) {
				return [{
					type: "text",
					text: String(value)
				}];
			}
		},
		async execute(args) {
			const raw = fenceTextOf(args);
			if (raw === null || raw.trim() === "") return "❌ validate_dsh_ui：缺少 spec 参数 —— 把围栏 JSON 文本作为 spec 传入。";
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch (error) {
				const detail = error instanceof Error ? error.message : String(error);
				const repaired = completeFenceJson(raw);
				if (repaired !== null) {
					const processed = processRenderableValue(JSON.parse(repaired.text));
					const chartFailure = formatProcessFailure(processed);
					if (chartFailure !== void 0) return chartFailure;
					if (processed.spec !== null && processed.errors.length === 0) {
						const warnings = formatProcessWarnings(processed);
						const warningText = warnings.length === 0 ? "" : `${warnings.join("\n")}\n`;
						return `❌ dsh-ui 围栏 JSON 解析失败：${detail}。\n${bracketDiagnostic(raw)}${warningText}  已自动修复 ${repaired.repairs} 处，下面是修复后的 JSON，直接作为围栏正文发出即可（无需再验证）：\n\`\`\`\n${repaired.text}\n\`\`\``;
					}
				}
				return `❌ dsh-ui 围栏 JSON 解析失败：${detail}。\n${bracketDiagnostic(raw)}  自动修复未能恢复（结构损坏），请按错误信息修正后重新调用本工具验证，通过后再发出围栏。\n${COMMON_CAUSES}`;
			}
			const processed = processRenderableValue(parsed);
			const chartFailure = formatProcessFailure(processed);
			if (chartFailure !== void 0) return chartFailure;
			if (processed.spec === null || processed.errors.length > 0) return droppedNodeFailure(processed) ?? `❌ 不是合法 GenUI spec：${processed.errors.join("；") || "根对象需要 \"items\" 数组，且每个节点 type 必须在白名单内（见系统提示词）"}。请修正后重新验证。`;
			const warnings = formatProcessWarnings(processed);
			return [`✅ dsh-ui spec 合法（${processed.renderedCount} 个组件），可以发出围栏。`, ...warnings].join("\n");
		},
		presentCall() {
			return {
				card: "generic",
				title: "验证 dsh-ui 围栏",
				kind: "other"
			};
		},
		presentResult() {
			return {
				card: "generic",
				title: "验证 dsh-ui 围栏"
			};
		}
	};
}
//#endregion
//#region src/plugin/index.ts
/**
* The mermaid/three engines ship as standalone IIFE bundles under
* `lib/assets/` and are fetched by the client ONLY when a spec needs them.
* This route serves them from the plugin's own package directory through the
* host webserver service — the longest-prefix rule lets it win over the
* generic `/plugins` bundle route, and no host source change is needed. The
* service is optional at this plugin's start time, so a dependency fiber owns
* the registration and follows the webserver through late binding, replacement,
* and plugin reloads.
*/
/** Route prefix under /plugins; anything under it is this plugin's asset. */
const ASSET_ROUTE_PATH = "/plugins/@changfenhuang/dsh-genui/assets";
/** Safe flat file names only: no slashes, no traversal, js assets only. */
const ASSET_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.js$/;
/** The handler itself (registered via the optional webServer probe). */
async function serveGenuiAsset(req, res) {
	if (req.method !== "GET" && req.method !== "HEAD") {
		res.writeHead(405);
		res.end();
		return;
	}
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
	} catch {
		res.writeHead(400);
		res.end();
		return;
	}
	const rel = pathname.startsWith(`${ASSET_ROUTE_PATH}/`) ? pathname.slice(40) : null;
	if (rel === null) {
		res.writeHead(404);
		res.end();
		return;
	}
	const file = rel.slice(1);
	if (!ASSET_FILE_RE.test(file)) {
		res.writeHead(404);
		res.end();
		return;
	}
	try {
		const dir = fileURLToPath(new URL("./assets/", import.meta.url));
		const body = await readFile(join(dir, file));
		res.writeHead(200, {
			"content-type": "text/javascript; charset=utf-8",
			"cache-control": "no-cache"
		});
		res.end(body);
	} catch {
		res.writeHead(404);
		res.end();
	}
}
/** The fence language description injected into every assembled system prompt.
*  Deliberately slim: the `genui` skill carries the full component→field
*  mapping; this section keeps only the contract that must always be
*  present (fence syntax, type whitelist, and critical behavioral rules). */
const GENUI_SECTION_TEXT = `You can render interactive UI components INSIDE your reply — between paragraphs — by emitting a fenced block with the language tag \`dsh-ui\` containing a JSON spec:

\`\`\`dsh-ui
{"title":"可选标题","gap":14,"items":[...]}
\`\`\`

The spec is a white-listed component tree rendered inline where the fence sits. Only these \`type\` values; the \`genui\` skill, when available, carries the full content→component mapping and per-component field details:

- 布局: text · row · col · grid · card · divider · spacer · hero（封面块：超大数字 + 标题 + tone 渐变底色，一条回答最多一个）
- 展示: badge · stat · progress · list · table · keyvalue · avatar · audio · video · timeline · file-tree · breadcrumb · callout · steps · diff · json · code · copy
- 子项字段有三个例外：\`keyvalue\` 用 \`pairs\`（\`[{"key","value"}]\`）、\`table\` 用 \`columns\`+\`rows\`、\`steps\` 用 \`steps\`；其余组件都用 \`items\`。写错会导致该节点被丢弃。
- tone 的取值**按组件不同**：\`callout\` 是 info/success/warning/error；\`badge\` 是 success/warn/danger/accent；\`card\` 是 info/success/warning/danger；\`hero\` 是 accent/success/warning/danger。同一个词在别的组件里合法不代表这里合法（近义值会被自动归一并记一条警告）。
- 图表: chart {"kind":"bars|line|donut","data":[{"label":"...","value":n}],"series":[{"label":"...","data":[...]}]?,"horizontal":true?,"stacked":true?}（series：bars 分组/堆叠 / line 多序列；horizontal 横向柱） · echart (preset: bar/line/area/pie/scatter/radar/gauge/funnel/treemap/sankey/graph/heatmap/bigline，或 option 直通) · plot (函数图)
- 交互: button · input · textarea · select · checkbox · switch · slider · radio · submit · quiz · link · tabs · accordion
- 高级: mermaid (flowchart/sequence/class/gantt/pie/er/state/journey) · diagram (编辑级架构/流程图，27 种 kind) · scene3d (3D WebGL)

**默认就该出 UI**：出现下列情况至少出一个围栏：
- ≥3 条并列要点 → \`list\`；数字对比 → \`table\`；指标/进度/状态 → \`stat\`/\`progress\`/\`badge\`
- 步骤/时间线 → \`steps\`/\`timeline\`/\`mermaid\`；架构/流程 → \`diagram\` 或 \`mermaid\`；风险/结论 → \`callout\`；代码/改动 → \`code\`/\`diff\`/\`json\`
- 行内富文本：\`text\`/\`list\`/表格文本列/\`keyvalue\`/\`callout\` 里可写 \`code\`、**加粗**、==高亮==、[文字](url)：重点留在句中，不必为一个词单起组件。
- 默认无卡 ≠ 少用组件：硬触发照常出组件，**组件多不是问题**——判据是每个组件承载不同信息、有焦点与层次、同一批数据不重复表达。卡片只用于并排项与数据对象；单段文字用「标题 + 正文 + 间距」。

**发回答前最后自检一次**：这段内容里有没有 ≥3 条并列要点、任何对比、任何数字/指标、任何步骤或流程？有就先转成组件再开口。**状态汇报、进度说明、提交与改动清单同样算**——不要因为它是"说明文"就用纯文字写。这一条踩过的坑：连续几条汇报全靠文字，一条围栏都没发。
- 趋势/占比 → \`chart\`（≤8 点）或 \`echart\`（多序列/要交互时）；配色默认跟随主题，只有语义需要时才用 \`palette\` / \`card.accent\`；排版用 grid 子节点的 \`"span":2\` 跨列做宽窄混排（bento），不要一列方块堆到底；数据多时给 \`table\`/\`chart\`/\`list\` 配一个 \`input\`(id) + \`filter\` 绑定，读者能就地筛选，不用再问一遍

**字段速查**（完整见 genui skill）：\`stat\` \`{"label","value","delta"?}\` · \`table\` \`{"columns","rows","types"?,"total"?,"details"?,"filter"?,"export"?}\` · \`callout\` \`{"tone","title","content"}\` · \`progress\` \`{"value","variant"?,"target"?}\`

Rules:
- JSON 严格: 围栏直接发，不要先调 validate_dsh_ui 预校验——渲染器会自动修引号/逗号/括号，修不了才降级为代码块；先校验等于同一份 JSON 写两遍，读者要多等一倍时间且屏幕全程不动。只有围栏已渲染失败、或要手写 100 行以上的大 body 时才调它（❌ 若附「已自动修复」JSON 照抄即可）。
- 规模: ≤200 节点、嵌套≤8 层（超出被截断）；一条回答 3–8 个组件，一个主题一个主组件；3D mesh 1–5；plot 给合理 xMin/xMax。
- LOCAL-FIRST + actions: UI 能自己做的状态变化（判卷、判题、重置、展开、选中）就地完成，零往返；action 只用于必须模型参与的事。交互组件带 "action":"name"，交互以 [genui-action] name + 组件数据回传，届时重渲染更新 UI；无 action 的按钮禁用。
- Durable state: 交互状态按「会话+内容指纹」持久化——刷新/重放恢复；重渲染相同内容保留，新内容重置。
- 卷子模式: 每题一个 radio（group+answer+explanation）+ 一个 submit（groups 全列），本地判分。
- Secrets ban: 不索取密码、API Key、Token、恢复码；需要时拒绝并解释。
- Tool channel: render_ui 工具把同一 spec 渲染为工具行卡片（交付物型界面用）；围栏用于回答内联 UI。
- Panel: "panel":true 只渲染进会话面板 dock 并原地更新；"append":true 追加合并（同标签 tabs 追加/新标签加入/尾部追加）；上限 200 节点/200 次追加，满了发 replace 重建。面板组件来的 [genui-action] 只回一个 panel:true 围栏 + 至多一行 10 字内确认，不解释、不用普通围栏。`;
/**
* Register the GenUI output-language section and the render_ui tool.
* @param ctx - cordis context.
*/
const inject = ["systemPrompt"];
const BUNDLED_SKILL_RANK = 600;
const BUNDLED_SKILL_PROVIDER = "dsh-genui";
const BUNDLED_SKILL_DESCRIPTION = "GenUI 完整组件与字段规范，用于生成 dsh-ui 结构化交互界面。";
const BUNDLED_SKILL_INVOCATION = {
	modelInvocable: true,
	userInvocable: true
};
/** Register through the provider path so source=bundled also gets bundled precedence. */
function bundledSkillProvider() {
	const moduleDirectory = dirname(fileURLToPath(new URL(import.meta.url)));
	const path = basename(moduleDirectory) === "plugin" ? resolve(moduleDirectory, "../../SKILL.md") : resolve(moduleDirectory, "../SKILL.md");
	const raw = readFileSync(path, "utf8");
	const end = raw.indexOf("\n---\n", 4);
	if (!raw.startsWith("---\n") || end < 0) throw new Error("genui SKILL.md has invalid frontmatter");
	return {
		name: BUNDLED_SKILL_PROVIDER,
		list: () => Promise.resolve([{
			name: "genui",
			description: BUNDLED_SKILL_DESCRIPTION,
			invocation: BUNDLED_SKILL_INVOCATION,
			source: "bundled",
			provider: BUNDLED_SKILL_PROVIDER,
			path,
			resourceBase: {
				kind: "directory",
				path: dirname(path)
			},
			rank: BUNDLED_SKILL_RANK,
			locator: path
		}]),
		get: () => Promise.resolve({
			name: "genui",
			description: BUNDLED_SKILL_DESCRIPTION,
			invocation: BUNDLED_SKILL_INVOCATION,
			source: "bundled",
			provider: BUNDLED_SKILL_PROVIDER,
			path,
			resourceBase: {
				kind: "directory",
				path: dirname(path)
			},
			content: raw.slice(end + 5)
		})
	};
}
function apply(ctx) {
	ctx.systemPrompt.section({
		name: "genui:fence",
		order: ctx.systemPrompt.getSectionOrder("STRUCTURED_OUTPUT"),
		text: GENUI_SECTION_TEXT
	});
	ctx.inject(["tools"], (toolsCtx) => {
		toolsCtx.effect(function* () {
			yield toolsCtx.tools.register(createRenderUiTool());
			yield toolsCtx.tools.register(createValidateDshUiTool());
		}, "dsh-genui: model tools");
	});
	ctx.inject(["skills"], (skillCtx) => {
		skillCtx.skills.registerProvider(() => bundledSkillProvider());
	});
	ctx.inject(["webServer"], (webCtx) => {
		const webServer = webCtx.reflect.get("webServer");
		webCtx.effect(() => webServer.register({
			kind: "prefix",
			path: ASSET_ROUTE_PATH,
			handler: serveGenuiAsset
		}), "dsh-genui: asset route");
	});
}
//#endregion
export { GENUI_SECTION_TEXT, apply, inject };
