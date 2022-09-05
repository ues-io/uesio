import { FunctionComponent } from "react"
import { definition, hooks, styles, component, wire } from "@uesio/ui"
import PropNodeTag from "./buildpropitem/propnodetag"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import getValueAPI from "./valueapi"

const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
const IOExpandPanel = component.getUtility("uesio/io.expandpanel")

const WiresPanel: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const [, , selectedPath] = uesio.builder.useSelectedNode()
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["wires"]'

	const classes = styles.useStyles(
		{
			wireTag: {
				display: "grid",
				gridTemplateColumns: "1fr 0fr",
				alignItems: "center",
			},
			collectionInfo: {},
			keyInfo: {},
		},
		null
	)

	const def = uesio.builder.useDefinition(metadataType, metadataItem, "")

	const valueAPI = getValueAPI(
		metadataType,
		metadataItem,
		selectedPath,
		def,
		uesio,
		context
	)

	const wireDefs = valueAPI.get(localPath) as definition.DefinitionMap

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
						<div className={classes.wireTag}>
							<span className={classes.keyInfo}>{key}</span>
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
								actions={[
									{
										type: "MOVE",
									},
									{
										type: "DELETE",
									},
								]}
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
