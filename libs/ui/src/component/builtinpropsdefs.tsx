import { css } from "@emotion/css"
import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"

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

const getComponentVariantPropsDef = (
	componentNamespace: string,
	componentName: string,
	variantNamespace: string,
	variantName: string
	//variant: ComponentVariant | undefined
): BuildPropertiesDefinition => ({
	title: "Component Variant",
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
					<div>
						{componentNamespace}.{componentName}.{variantNamespace}.
						{variantName}
					</div>
				</div>
			),
		},
	],
	sections: [],
	readOnly: true,
})

export {
	getComponentTypePropsDef,
	getWirePropsDef,
	getFieldPropsDef,
	getComponentVariantPropsDef,
}
