import { FunctionComponent } from "react"
import {
	definition,
	builder,
	component,
	hooks,
	util,
	metadata,
} from "@uesio/ui"
import PropertiesPane from "./propertiespane"

const standardActions: builder.ActionDescriptor[] = [
	{ type: "DELETE" },
	{ type: "MOVE" },
	{ type: "CLONE" },
]

const standardMapActions: builder.ActionDescriptor[] = [
	{ type: "DELETE" },
	{ type: "MOVE" },
	{ type: "CLONEKEY" },
]

const augmentPropsDef = (
	propsDef: builder.BuildPropertiesDefinition | undefined,
	definition: definition.DefinitionMap,
	path: string
): builder.BuildPropertiesDefinition => {
	if (!propsDef) {
		return {
			title: "Nothing Selected",
			defaultDefinition: () => ({}),
			sections: [],
		}
	}
	if (propsDef.type === "wire") {
		return {
			...propsDef,
			actions: standardMapActions.concat(...(propsDef.actions || [])),
		}
	}
	if (propsDef.type === "component") {
		return {
			...propsDef,
			sections: propsDef.sections.concat([
				{
					title: "Styles",
					type: "STYLES",
				},
				{
					title: "Display",
					type: "CONDITIONALDISPLAY",
					specialPropsKey: "uesio.display",
				},
				{
					title: "Context",
					type: "CONDITIONALDISPLAY",
					specialPropsKey: "uesio.filter",
				},
			]),
			actions: standardActions.concat(...(propsDef.actions || [])),
		}
	}
	if (propsDef.type === "componentvariant") {
		//override the properties
		return {
			...propsDef,
			title: "Component Variant",
			sections: [],
			properties: [],
		}
	}
	if (propsDef.type === "panel") {
		const panelDef = util.get(definition, path) as definition.DefinitionMap
		const componentType = panelDef["uesio.type"] as
			| metadata.MetadataKey
			| undefined
		if (!componentType) return propsDef
		const componentPropsDef =
			component.registry.getPropertiesDefinition(componentType)
		if (!componentPropsDef.properties) return propsDef
		return {
			...propsDef,
			properties: propsDef?.properties?.concat(
				componentPropsDef.properties
			),
			actions: standardMapActions.concat(...(propsDef.actions || [])),
		}
	}

	if (propsDef.type === "param") {
		return {
			...propsDef,
			actions: standardMapActions.concat(...(propsDef.actions || [])),
		}
	}

	return propsDef
}

const PropertiesPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const definition = uesio.builder.useDefinition(
		metadataType,
		metadataItem,
		""
	) as definition.DefinitionMap

	const fullPath = component.path.makeFullPath(
		metadataType,
		metadataItem,
		selectedPath
	)

	const [plainPropsDef, trimmedPath] =
		component.registry.getPropertiesDefinitionFromPath(fullPath)
	const propsDef = augmentPropsDef(plainPropsDef, definition, trimmedPath)

	return (
		<PropertiesPane
			context={props.context}
			className={props.className}
			propsDef={propsDef}
			path={trimmedPath}
			valueAPI={{
				get: (path: string) => util.get(definition, path),
				set: (path: string, value: string | number | null) => {
					if (path === undefined) return
					uesio.builder.setDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						),
						value
					)
				},
				clone: (path: string) =>
					uesio.builder.cloneDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						)
					),
				cloneKey: (path: string) =>
					uesio.builder.cloneKeyDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						)
					),
				add: (path: string, value: string, number?: number) => {
					if (path === undefined) return
					uesio.builder.addDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						),
						value,
						number
					)
				},
				remove: (path: string) => {
					if (path === undefined) return
					uesio.builder.removeDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						)
					)
				},
				changeKey: (path: string, key: string) => {
					if (path === undefined) return
					uesio.builder.changeDefinitionKey(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						),
						key
					)
				},
				move: (
					fromPath: string,
					toPath: string,
					selectKey?: string
				) => {
					if (fromPath === undefined || toPath === undefined) return
					uesio.builder.moveDefinition(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							fromPath
						),
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							toPath
						),
						selectKey
					)
				},
			}}
		/>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
