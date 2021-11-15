import { css } from "@emotion/css"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"

const getComponentVariantPropsDef = (
	compPropsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition => {
	const variantProps = addStylesSection({
		title: compPropsDef.title,
		defaultDefinition: compPropsDef.defaultDefinition,
		properties: compPropsDef.properties,
		sections: [],
		type: "componentvariant",
		classes: compPropsDef.classes,
	})

	return variantProps
}

const addStylesSection = (
	propsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition => ({
	...propsDef,
	sections: propsDef?.sections
		? [
				...propsDef.sections,
				{
					title: "Styles",
					type: "STYLES",
				},
		  ]
		: [
				{
					title: "Styles",
					type: "STYLES",
				},
		  ],
})

const addDisplaySection = (
	propsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition => ({
	...propsDef,
	sections: propsDef?.sections
		? [
				...propsDef.sections,
				{
					title: "Display",
					type: "CONDITIONALDISPLAY",
				},
		  ]
		: [
				{
					title: "Display",
					type: "CONDITIONALDISPLAY",
				},
		  ],
})

const getComponentPropsDef = (
	compPropsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition =>
	addDisplaySection(addStylesSection(compPropsDef))

const getComponentTypePropsDef = (
	compPropsDef: BuildPropertiesDefinition
): BuildPropertiesDefinition => ({
	title: compPropsDef.title,
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "description",
			type: "CUSTOM",
			label: "Description",
			renderFunc: () => (
				<div
					className={css({
						fontSize: "10pt",
						marginBottom: "8px",
					})}
				>
					<div>{compPropsDef.description}</div>
					<a href={compPropsDef.link} target="blank">
						{compPropsDef.link}
					</a>
				</div>
			),
		},
	],
	sections: [],
	readOnly: true,
})

const getWirePropsDef = (): BuildPropertiesDefinition => ({
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
		{
			name: "batchsize",
			type: "NUMBER",
			label: "Batch Size",
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
		{
			title: "Order by",
			type: "ORDER",
		},
	],
	actions: [
		{
			type: "LOAD_WIRE",
			label: "Refresh Wire",
		},
	],
})

const getFieldPropsDef = (
	name: string,
	namespace: string,
	collectionNamespace: string,
	collectionName: string
) => ({
	title: name,
	sections: [],
	defaultDefinition: () => ({}),
	traits: [
		"uesio.field",
		"wire." + collectionNamespace + "." + collectionName,
	],
	namespace,
	name,
})

export {
	getComponentTypePropsDef,
	getWirePropsDef,
	getFieldPropsDef,
	getComponentVariantPropsDef,
	getComponentPropsDef,
}
