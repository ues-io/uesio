import { FC, useEffect } from "react"
import { definition, builder, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"
const standardActions: builder.ActionDescriptor[] = [
	{ type: "DELETE" },
	{ type: "MOVE" },
	{ type: "CLONE" },
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
			actions: standardActions.concat(...(propsDef.actions || [])),
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
				},
			]),
			actions: standardActions.concat(...(propsDef.actions || [])),
		}
	}
	if (propsDef.type === "componentvariant") {
		return {
			...propsDef,
			sections: propsDef.sections.concat([
				{
					title: "Styles",
					type: "STYLES",
				},
			]),
		}
	}
	if (propsDef.type === "panel") {
		const panelDef = util.get(definition, path) as definition.DefinitionMap
		const componentType = panelDef["uesio.type"] as string | undefined
		if (!componentType) return propsDef
		const componentPropsDef =
			component.registry.getPropertiesDefinition(componentType)
		if (!componentPropsDef.properties) return propsDef
		return {
			...propsDef,
			properties: propsDef?.properties?.concat(
				componentPropsDef.properties
			),
		}
	}
	return propsDef
}

const PropertiesPanel: FC<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath =
		(selectedPath && component.path.trimPathToComponent(selectedPath)) || ""

	const definition = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, "")
	) as definition.DefinitionMap

	const standardPropsDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath(metadataType, metadataItem, trimmedPath)
	)

	const propsDef = augmentPropsDef(standardPropsDef, definition, trimmedPath)

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
				addPair: (path: string, value: string, key: string) => {
					if (path === undefined) return
					uesio.builder.addDefinitionPair(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							path
						),
						value,
						key
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
