import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"

export const paneDef: BuildPropertiesDefinition = {
	title: "Pane",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "panelComponent",
			type: "COMPONENT",
			label: "Panel",
		},
	],
	sections: [],
	actions: [],
}

export const wireDef: BuildPropertiesDefinition = {
	title: "Wire",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "name",
			type: "KEY",
			label: "Name",
		},
		{
			name: "collection",
			type: "METADATA",
			metadataType: "COLLECTION",
			label: "Collection",
		},
		{
			name: "type",
			type: "SELECT",
			label: "Wire Type",
			options: [
				{
					label: "Create",
					value: "CREATE",
				},
				{
					label: "Read",
					value: "",
				},
			],
		},
	],
	sections: [
		{
			title: "Fields",
			type: "FIELDS",
		},
		{
			title: "Conditions",
			type: "CONDITIONS",
		},
	],
	actions: [
		{
			type: "LOAD_WIRE",
			label: "Refresh Wire",
		},
	],
}

export default { paneDef, wireDef }
