import { definition, api, component } from "@uesio/ui"
import CloneKeyAction from "../../../actions/clonekeyaction"
import DeleteAction from "../../../actions/deleteaction"
import MoveActions from "../../../actions/moveactions"
import { FullPath } from "../../../api/path"
import { setSelectedPath, useSelectedPath } from "../../../api/stateapi"
import BuildActionsArea from "../../../helpers/buildactionsarea"
import PropNodeTag from "../../../utilities/propnodetag/propnodetag"

const ParamsPanel: definition.UtilityComponent = ({ context }) => {
	const IOExpandPanel = component.getUtility("uesio/io.expandpanel")
	const selectedPath = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.params) return null

	const getParamPath = (paramId: string) =>
		component.path.fromPath(["params"].concat(paramId))

	const getFullPath = (paramId: string) =>
		new FullPath("viewdef", viewDefId, getParamPath(paramId))

	return (
		<div>
			{Object.entries(viewDef.params).map(([paramId /*,paramDef*/]) => {
				const paramPath = getFullPath(paramId)

				return (
					<PropNodeTag
						onClick={() => setSelectedPath(context, paramPath)}
						key={paramId}
						selected={selectedPath.startsWith(paramPath)}
						context={context}
					>
						<div className="tagroot">{paramId}</div>
						<IOExpandPanel
							context={context}
							expanded={selectedPath.equals(paramPath)}
						>
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
