import { definition, api, component } from "@uesio/ui"
import CloneKeyAction from "../../../actions/clonekeyaction"
import DeleteAction from "../../../actions/deleteaction"
import MoveActions from "../../../actions/moveactions"
import {
	isInSelection,
	isSelected,
	useSelectedPath,
} from "../../../api/stateapi"
import BuildActionsArea from "../../../helpers/buildactionsarea"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"

const ParamsPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const [selectedPath, setSelectedPath] = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.params) return null
	const localPath = ["viewdef", viewDefId, "params"]

	return (
		<div>
			{Object.entries(viewDef.params).map(([paramId /*,paramDef*/]) => {
				const paramPath = component.path.fromPath(
					localPath.concat(paramId)
				)
				const selected = isSelected(selectedPath, paramPath)
				const inSelection = isInSelection(selectedPath, paramPath)
				return (
					<PropNodeTag
						onClick={() => setSelectedPath(paramPath)}
						key={paramPath}
						selected={inSelection}
						context={context}
					>
						<div className="tagroot">{paramId}</div>
						<IOExpandPanel context={context} expanded={selected}>
							<BuildActionsArea context={context}>
								<DeleteAction
									context={context}
									path={paramPath}
								/>
								<MoveActions
									context={context}
									path={paramPath}
								/>
								<CloneKeyAction
									context={context}
									path={paramPath}
								/>
							</BuildActionsArea>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</div>
	)
}
ParamsPanel.displayName = "ParamsPanel"

export default ParamsPanel
