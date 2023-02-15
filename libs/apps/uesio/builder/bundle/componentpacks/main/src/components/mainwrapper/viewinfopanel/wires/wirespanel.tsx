import { definition, api } from "@uesio/ui"
import { FullPath } from "../../../../api/path"

import PropertiesForm from "../../../../helpers/propertiesform"

const WiresPanel: definition.UtilityComponent = ({ context }) => {
	const viewDefId = context.getViewDefId() || ""
	const viewDef = api.view.useViewDef(viewDefId)
	if (!viewDefId || !viewDef || !viewDef.wires) return null
	const path = new FullPath("viewdef", viewDefId)

	return (
		<PropertiesForm
			id={path.combine()}
			context={context}
			properties={[
				{
					name: "wires",
					components: [
						{
							"uesio/builder.wiretag": {},
						},
					],
					type: "MAP",
				},
			]}
			path={path}
		/>
	)
}
WiresPanel.displayName = "WiresPanel"

export default WiresPanel
