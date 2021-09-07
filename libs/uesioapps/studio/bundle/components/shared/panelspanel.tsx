import { FunctionComponent } from "react"
import { definition, component, hooks } from "@uesio/ui"
import PropNodeTag from "../shared/buildpropitem/propnodetag"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const PanelsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context, className } = props
	const uesio = hooks.useUesio(props)
	const [selectedMetadataType, selectedMetadataItem, selectedNode] =
		uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["panels"]'

	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
	const def = uesio.builder.useDefinition(path) as definition.DefinitionMap[]
	const newPanel = () => {
		// If there is no panels key, create it first.
		// Currently this is the case when creating new views
		if (!def) {
			uesio.builder.setDefinition(path, [])
		}
		uesio.builder.addDefinition(path, {
			newpanel: {
				components: [],
				id: Math.floor(Math.random() * 60),
			},
		})
	}

	return (
		<ScrollPanel
			header={
				<TitleBar
					variant="io.primary"
					title={"Panels"}
					context={context}
					actions={
						<IconButton
							context={context}
							variant="io.small"
							icon="add"
							onClick={() => newPanel()}
						/>
					}
				/>
			}
			context={context}
			className={className}
		>
			<div>
				{def?.map((el, index) => {
					if (!el) return null
					const { id } = Object.values(el)[0] as Record<
						string,
						unknown
					>
					const panelPath = `${localPath}["${index}"]`
					return (
						<PropNodeTag
							title={`${id || "missing ID"}`}
							onClick={() =>
								uesio.builder.setSelectedNode(
									metadataType,
									metadataItem,
									panelPath
								)
							}
							icon="call_to_action"
							key={index}
							selected={
								selectedMetadataType === metadataType &&
								selectedMetadataItem === metadataItem &&
								panelPath === selectedNode
							}
							context={context}
						/>
					)
				})}
			</div>
			<PropNodeTag
				title={"new panel"}
				onClick={() => newPanel()}
				icon="plus"
				context={context}
			/>
		</ScrollPanel>
	)
}
PanelsPanel.displayName = "PanelsPanel"

export default PanelsPanel
