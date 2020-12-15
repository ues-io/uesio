import React, { useEffect, FunctionComponent } from "react"
import { BaseProps } from "../definition/definition"
import { useUesio, Uesio } from "../hooks/hooks"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import Slot from "./slot"
import { parseKey } from "../component/path"
import { Dependencies } from "../bands/viewdef/types"
import { ViewParams } from "../bands/view/types"
import { useView } from "../bands/view/selectors"
import { useViewDef } from "../bands/viewdef/selectors"
import loadViewOp from "../bands/view/operations/load"
import Feedback from "./Feedback"

function getNeededScripts(
	dependencies: Dependencies | undefined,
	uesio: Uesio,
	buildMode: boolean
): string[] {
	const componentDeps = dependencies?.componentpacks
	const dependencyScripts: string[] = []

	if (componentDeps) {
		Object.keys(componentDeps).forEach((key) => {
			const [namespace, name] = parseKey(key)
			const fileUrl = uesio.component.getPackURL(namespace, name, false)
			dependencyScripts.push(fileUrl)
			if (buildMode) {
				const fileUrl = uesio.component.getPackURL(
					namespace,
					name,
					true
				)
				dependencyScripts.push(fileUrl)
			}
		})
	}
	return dependencyScripts
}

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
	const view = useView(viewId)

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!context.getBuildMode() && path === ""
	const neededScripts = getNeededScripts(
		viewDef?.dependencies,
		uesio,
		buildMode
	)
	const scriptResult = useScripts(neededScripts)
	const scriptsHaveLoaded = depsHaveLoaded(
		neededScripts,
		scriptResult.scripts
	)

	const useBuildTime = buildMode && scriptsHaveLoaded

	const viewContext = context.addFrame({
		view: viewId,
		viewDef: viewDefId,
		buildMode: useBuildTime,
	})

	useEffect(() => {
		if (!view) {
			const [namespace, name] = parseKey(viewDefId)
			uesio.getDispatcher()(
				loadViewOp({
					context: viewContext,
					namespace,
					name,
					path,
					params,
				})
			)
		}
	}, [])

	if (!viewDef || !view || !view.loaded || !scriptsHaveLoaded) return null

	const test = true
	return (
		<div>
			{test && (
				<Feedback path="" context={viewContext} severity="success">
					<b>Feedback : something happened</b>
				</Feedback>
			)}
			<Slot
				// @ts-ignore
				definition={console.log("MOUting") || viewDef.definition}
				listName="components"
				path=""
				accepts={["uesio.standalone"]}
				context={viewContext}
			/>
		</div>
	)
}

export default View
