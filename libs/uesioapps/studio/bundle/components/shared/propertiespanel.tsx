import { FC, useLayoutEffect } from "react"
import { definition, component, hooks, util } from "@uesio/ui"
import PropertiesPane from "./propertiespane"

// Move to more logical location
interface T extends definition.UtilityProps {
	panelId: string
}
const PanelLoader: FC<T> = (props) => {
	const uesio = hooks.useUesio(props)
	const [togglePanel, portals] = uesio.signal.useHandler([
		{
			signal: "panel/OPEN",
			panel: props.panelId,
			target: "#builderPanelsContainer",
		},
	])
	useLayoutEffect(() => {
		togglePanel && togglePanel()
	}, [props.panelId])
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

	const handlePanel = ():
		| [null, null]
		| [panelId: string, panelPath: string] => {
		const pathArray = component.path.pathArray(selectedPath)
		if (pathArray[0] !== "panels") return [null, null]

		const panelId = component.path.pathArray(selectedPath)[1]
		return [panelId, trimmedPath]
	}
	const [panelId, panelPath] = handlePanel()

	return (
		<>
			{panelId && panelPath && (
				<PanelLoader {...props} path={panelPath} panelId={panelId} />
			)}
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
					move: (
						fromPath: string,
						toPath: string,
						selectKey?: string
					) => {
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
							),
							selectKey
						)
					},
				}}
			/>
		</>
	)
}

PropertiesPanel.displayName = "PropertiesPanel"

export default PropertiesPanel
