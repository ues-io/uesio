import React, { useEffect, FC } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { useUesio, Uesio } from "../hooks/hooks"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import { ViewParams } from "../view/view"
import Slot from "./slot"
import { parseKey } from "../component/path"
import { Dependencies } from "../bands/viewdef/types"
import { VIEW_BAND } from "../hooks/viewapi"
import { LOAD } from "../view/viewbandsignals"

function getNeededScripts(
	dependencies: Dependencies | undefined,
	uesio: Uesio,
	buildMode: boolean
): string[] {
	const componentDeps = dependencies?.componentpacks
	const dependencyScripts: string[] = []

	if (componentDeps) {
		Object.keys(componentDeps).map((key) => {
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

const View: FC<Props> = (props: Props) => {
	const uesio = useUesio(props)
	const [viewnamespace, viewname] = parseKey(props.definition.view)
	const viewparams = props.definition.params
	const { path, context } = props

	const view = uesio.view.useView(viewnamespace, viewname, path)

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!props.context.getBuildMode() && path === ""

	const definition = uesio.view.useDefinition("", view) as DefinitionMap
	const dependencies = uesio.view.useDependencies(view)

	const neededScripts = getNeededScripts(dependencies, uesio, buildMode)
	const scriptResult = useScripts(neededScripts)
	const scriptsHaveLoaded = depsHaveLoaded(
		neededScripts,
		scriptResult.scripts
	)

	useEffect(() => {
		const hasNewParams = viewparams !== view.source.params
		// We could think about letting this go forward before loading viewdef deps
		if ((!view.valid || hasNewParams) && scriptsHaveLoaded) {
			uesio.signal.run(
				{
					band: VIEW_BAND,
					signal: LOAD,
					namespace: viewnamespace,
					name: viewname,
					path,
					params: viewparams,
				},
				context
			)
		}
	}, [])

	const useBuildTime = buildMode && scriptsHaveLoaded

	if (!definition || !view.valid || !view.source.loaded) return null

	return (
		<Slot
			definition={definition}
			listName="components"
			path=""
			accepts={["uesio.standalone"]}
			context={context.addFrame({
				view: view.getId(),
				buildMode: useBuildTime,
			})}
		/>
	)
}

export default View
