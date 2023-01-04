import { FunctionComponent } from "react"
import { definition, hooks, component, wire } from "@uesio/ui"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import getValueAPI from "./valueapi"

const NamespaceLabel = component.getUtility("uesio/builder.namespacelabel")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
const PropNodeTag = component.getUtility("uesio/builder.propnodetag")

const WiresPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [, , selectedPath] = uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = context.getViewDefId() || ""
	const localPath = '["wires"]'

	const def = uesio.builder.useDefinition(metadataType, metadataItem, "")

	const valueAPI = getValueAPI(metadataType, metadataItem, selectedPath, def)

	const wireDefs = valueAPI.get(localPath) as definition.DefinitionMap

	const [wirePropDef] = component.registry.getPropertiesDefinitionFromPath(
		component.path.makeFullPath(metadataType, metadataItem, localPath),
		def
	)

	return (
		<div>
			{Object.keys(wireDefs || {}).map((key: string, index) => {
				const wirePath = `${localPath}["${key}"]`
				const wireDef = wireDefs[key] as wire.RegularWireDefinition
				const selected = valueAPI.isSelected(wirePath)
				const hasSelectedChild = valueAPI.hasSelectedChild(wirePath)
				const setSelected = () => valueAPI.select(wirePath)
				return (
					<PropNodeTag
						onClick={setSelected}
						key={index}
						selected={selected || hasSelectedChild}
						context={context}
					>
						<div className="tagroot">
							{key}
							<NamespaceLabel
								context={context}
								metadatakey={wireDef.collection}
							/>
						</div>
						<IOExpandPanel context={context} expanded={selected}>
							<BuildActionsArea
								context={context}
								path={wirePath}
								valueAPI={valueAPI}
								propsDef={wirePropDef}
								actions={wirePropDef.actions}
							/>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</div>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
