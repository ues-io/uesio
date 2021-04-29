import { FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import Slot from "./slot"
import Panel from "./panel"
import { ViewParams } from "../bands/view/types"
import { useViewDef } from "../bands/viewdef/selectors"
import { unWrapDefinition } from "../component/path"

interface Props extends BaseProps {
	definition: {
		view: string
		params?: ViewParams
	}
}

const View: FunctionComponent<Props> = (props) => {
	const uesio = useUesio(props)
	const {
		path,
		context,
		definition: { params, view: viewDefId },
	} = props

	const viewId = `${viewDefId}(${path})`
	const viewDef = useViewDef(viewDefId)

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!context.getBuildMode() && path === ""
	const scriptResult = uesio.component.usePacks(
		Object.keys(viewDef?.dependencies?.componentpacks || {}),
		buildMode
	)

	const useBuildTime = buildMode && scriptResult.loaded

	const viewContext = context.addFrame({
		view: viewId,
		viewDef: viewDefId,
		buildMode: useBuildTime,
	})

	const view = uesio.view.useView(
		viewId,
		context.mergeMap(params),
		viewContext
	)

	if (!viewDef || !view || !view.loaded || !scriptResult.loaded) return null

	return (
		<>
			<Slot
				definition={viewDef.definition}
				listName="components"
				path=""
				accepts={["uesio.standalone"]}
				context={viewContext}
			/>
			{path === "" &&
				viewDef?.definition?.panels?.map((panel, index) => {
					const [componentType, def] = unWrapDefinition(panel)
					return (
						<Panel
							key={index}
							definition={def}
							context={viewContext}
							componentType={componentType}
						/>
					)
				})}
		</>
	)
}

export default View
