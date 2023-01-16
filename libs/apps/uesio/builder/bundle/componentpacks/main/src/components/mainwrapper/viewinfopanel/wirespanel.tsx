import { definition, api, component, wire } from "@uesio/ui"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"
import BuildActionsArea from "../../../helpers/buildactionsarea"
import CloneKeyAction from "../../../actions/clonekeyaction"
import DeleteAction from "../../../actions/deleteaction"
import MoveActions from "../../../actions/moveactions"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"
import NamespaceLabel from "../../../utilities/namespacelabel/namespacelabel"
import { FullPath } from "../../../api/path"

const WiresPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const selectedPath = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.wires) return null

	const getWirePath = (wireId: string) =>
		component.path.fromPath(["wires"].concat(wireId))

	const getFullPath = (wireId: string) =>
		new FullPath("viewdef", viewDefId, getWirePath(wireId))

	return (
		<div>
			{Object.entries(viewDef.wires).map(([key, value]) => {
				const wirePath = getFullPath(key)
				const wireDef = value as wire.RegularWireDefinition
				return (
					<PropNodeTag
						onClick={() => setSelectedPath(context, wirePath)}
						key={key}
						selected={selectedPath.startsWith(wirePath)}
						context={context}
					>
						<div className="tagroot">
							{key}
							<NamespaceLabel
								context={context}
								metadatakey={wireDef.collection}
							/>
						</div>
						<IOExpandPanel
							context={context}
							expanded={wirePath.equals(selectedPath)}
						>
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
