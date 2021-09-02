import React, { FC, useLayoutEffect } from "react"
import { definition, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"

type T = {
	panel: string
	uesio: hooks.Uesio
}

// We need this to load and open panels
const PanelLoader: FC<T> = ({ panel, uesio }) => {
	const [togglePanel, portals] = uesio.signal.useHandler([
		{
			signal: "panel/TOGGLE",
			panel,
		},
	])
	useLayoutEffect(() => {
		togglePanel && togglePanel()
	}, [])
	return <>{portals}</>
}

const PropertiesPanel: FC<definition.UtilityProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const viewDefId = uesio.getViewDefId()

	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()
	// Trim the path to the closest namespaced component
	// For Example:
	// Turn: ["components"]["0"]["myns.mycomp"]["items"]["0"] into...
	// This: ["components"]["0"]["myns.mycomp"]
	const trimmedPath =
		(selectedPath && component.path.trimPathToComponent(selectedPath)) || ""

	const propsDef = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath(metadataType, metadataItem, trimmedPath)
	)

	const definition = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, "")
	) as definition.DefinitionMap

	const handlePanel = (): string | null => {
		const pathArray = component.path.pathArray(selectedPath)
		if (pathArray[0] !== "panels") return null

		// ["panels", "0"]
		const panelPath = pathArray.slice(0, 2)
		const panelKeyAtIndex = util.get(definition, panelPath) as any
		const panelDef = Object.values(panelKeyAtIndex)[0] as any

		uesio.builder.setOpenedPanel(selectedPath)
		return panelDef.id
	}

	const panelId = handlePanel()

	return (
		<>
			<PropertiesPane
				context={props.context}
				className={props.className}
				propsDef={propsDef}
				path={trimmedPath}
				valueAPI={{
					get: (path: string) => util.get(definition, path),
					set: (path: string, value: string) => {
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
								"viewdef",
								viewDefId || "",
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
					move: (fromPath: string, toPath: string) => {
						if (fromPath === undefined || toPath === undefined)
							return
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
							)
						)
					},
				}}
			/>
			{panelId && <PanelLoader panel={panelId} uesio={uesio} />}
		</>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
