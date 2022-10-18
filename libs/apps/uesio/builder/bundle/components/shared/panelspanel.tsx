import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import getValueAPI from "./valueapi"

const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")

const PanelsPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [, , selectedPath] = uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = `["panels"]`

	const viewdef = uesio.builder.useDefinition(metadataType, metadataItem, "")

	const valueAPI = getValueAPI(
		metadataType,
		metadataItem,
		selectedPath,
		viewdef,
		uesio,
		context
	)

	const panelDefs = valueAPI.get(localPath) as definition.DefinitionMap

	return (
		<div>
			{Object.keys(panelDefs || {}).map((panelId: string) => {
				const panelPath = `${localPath}["${panelId}"]`
				const selected = valueAPI.isSelected(panelPath)
				const hasSelectedChild = valueAPI.hasSelectedChild(panelPath)
				const setSelected = () => valueAPI.select(panelPath)
				const [panelPropDef] =
					component.registry.getPropertiesDefinitionFromPath(
						component.path.makeFullPath(
							metadataType,
							metadataItem,
							panelPath
						),
						viewdef
					)
				return (
					<PropNodeTag
						onClick={setSelected}
						key={panelPath}
						selected={selected || hasSelectedChild}
						context={context}
					>
						<div className="tagroot">{panelId}</div>
						<IOExpandPanel context={context} expanded={selected}>
							<BuildActionsArea
								context={context}
								path={panelPath}
								valueAPI={valueAPI}
								propsDef={panelPropDef}
								actions={panelPropDef.actions}
							/>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</div>
	)
}
PanelsPanel.displayName = "PanelsPanel"

export default PanelsPanel
