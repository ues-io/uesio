import { definition, api, component } from "@uesio/ui"
import { useSelectedPath } from "../../../../api/stateapi"
import { FullPath } from "../../../../api/path"
import WirePropTag from "./wireproptag"

const WiresPanel: definition.UtilityComponent = ({ context }) => {
	const selectedPath = useSelectedPath(context)
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.wires) return null

	const getFullPath = (wireId: string) =>
		new FullPath(
			"viewdef",
			viewDefId,
			component.path.fromPath(["wires"].concat(wireId))
		)

	return (
		<div>
			{Object.entries(viewDef.wires).map(([key]) => (
				<WirePropTag
					context={context}
					path={getFullPath(key)}
					key={key}
					wireId={key}
					selectedPath={selectedPath}
				/>
			))}
		</div>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
