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

const PanelsPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const [selectedPath, setSelectedPath] = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.panels) return null
	const localPath = ["viewdef", viewDefId, "panels"]

	return (
		<div>
			{Object.entries(viewDef.panels).map(([panelId /*, panelDef*/]) => {
				const panelPath = component.path.fromPath(
					localPath.concat(panelId)
				)
				const selected = isSelected(selectedPath, panelPath)
				const inSelection = isInSelection(selectedPath, panelPath)

				return (
					<PropNodeTag
						onClick={() => setSelectedPath(panelPath)}
						key={panelPath}
						selected={inSelection}
						context={context}
					>
						<div className="tagroot">{panelId}</div>
						<IOExpandPanel context={context} expanded={selected}>
							<BuildActionsArea context={context}>
								<DeleteAction
									context={context}
									path={panelPath}
								/>
								<MoveActions
									context={context}
									path={panelPath}
								/>
								<CloneKeyAction
									context={context}
									path={panelPath}
								/>
							</BuildActionsArea>
						</IOExpandPanel>
					</PropNodeTag>
				)
			})}
		</div>
	)
}
PanelsPanel.displayName = "PanelsPanel"

export default PanelsPanel
