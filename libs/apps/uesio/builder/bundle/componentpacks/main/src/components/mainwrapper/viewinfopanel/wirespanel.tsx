import { definition, api, component, wire } from "@uesio/ui"
import {
	isInSelection,
	isSelected,
	useSelectedPath,
} from "../../../api/stateapi"
import BuildActionsArea from "../../../helpers/buildactionsarea"
import CloneKeyAction from "../../../actions/clonekeyaction"
import DeleteAction from "../../../actions/deleteaction"
import MoveActions from "../../../actions/moveactions"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import NamespaceLabel from "../../../utilities/namespacelabel/namespacelabel"

const WiresPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const [selectedPath, setSelectedPath] = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.wires) return null
	const localPath = ["viewdef", viewDefId, "wires"]

	return (
		<div>
			{Object.entries(viewDef.wires).map(([key, value]) => {
				const wirePath = component.path.fromPath(localPath.concat(key))
				const wireDef = value as wire.RegularWireDefinition
				const selected = isSelected(selectedPath, wirePath)
				const inSelection = isInSelection(selectedPath, wirePath)
				return (
					<PropNodeTag
						onClick={() => setSelectedPath(wirePath)}
						key={wirePath}
						selected={inSelection}
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
							<BuildActionsArea context={context}>
								<DeleteAction
									context={context}
									path={wirePath}
								/>
								<MoveActions
									context={context}
									path={wirePath}
								/>
								<CloneKeyAction
									context={context}
									path={wirePath}
								/>
							</BuildActionsArea>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</div>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
