import { definition, api, component, metadata } from "@uesio/ui"
import CloneKeyAction from "../../../actions/clonekeyaction"
import DeleteAction from "../../../actions/deleteaction"
import MoveActions from "../../../actions/moveactions"
import { FullPath, useSelectedPath } from "../../../api/stateapi"
import BuildActionsArea from "../../../helpers/buildactionsarea"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"

const PanelsPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const [selectedPath, setSelectedPath] = useSelectedPath(context)
	const viewDefId = context.getViewDefId()
	const viewDef = api.view.useViewDef(viewDefId as string)
	if (!viewDefId || !viewDef || !viewDef.panels) return null

	const getPanelPath = (panelId: string) =>
		component.path.fromPath(["panels"].concat(panelId))

	const getFullPath = (panelId: string) =>
		new FullPath(
			"viewdef",
			viewDefId as metadata.MetadataKey,
			getPanelPath(panelId)
		)

	return (
		<div>
			{Object.entries(viewDef.panels).map(([panelId /*, panelDef*/]) => {
				const panelPath = getFullPath(panelId)

				return (
					<PropNodeTag
						onClick={() => setSelectedPath(panelPath)}
						key={panelId}
						selected={selectedPath.startsWith(panelPath)}
						context={context}
					>
						<div className="tagroot">{panelId}</div>
						<IOExpandPanel
							context={context}
							expanded={selectedPath.equals(panelPath)}
						>
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
