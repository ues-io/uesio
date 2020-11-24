import React, { useEffect, FC } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio, Uesio } from "../hooks/hooks"
import { useScripts, depsHaveLoaded } from "../hooks/usescripts"
import Dependencies from "../store/types/dependenciesstate"
import { ViewParams } from "../view/view"
import Slot from "./slot"
import { parseKey } from "../component/path"

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
		name: string
		namespace: string
		params?: ViewParams
	}
}

const View: FC<Props> = (props: Props) => {
	const uesio = useUesio(props)
	const viewname = props.definition.name
	const viewnamespace = props.definition.namespace
	const viewparams = props.definition.params
	const path = props.path

	const view = uesio.view.useView(viewnamespace, viewname, path)

	// Currently only going into buildtime for the base view. We could change this later.
	const buildMode = !!props.context.getBuildMode() && path === ""

	const definition = uesio.view.useDefinition("", view)
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
			uesio.view.loadView(
				viewnamespace,
				viewname,
				path,
				viewparams,
				props.context
			)
			return
		}
	}, [])

	const useRunTime =
		(!buildMode && scriptsHaveLoaded) || (buildMode && !scriptsHaveLoaded)
	const useBuildTime = buildMode && scriptsHaveLoaded
	if (
		(useRunTime || useBuildTime) &&
		definition &&
		view.valid &&
		view.source.loaded
	) {
		const slotProps = {
			definition,
			listName: "components",
			path: "", // View slots paths are always empty
			accepts: ["uesio.standalone"],
			context: props.context.addFrame({
				view: view.getId(),
				buildMode: useBuildTime,
			}),
		}
		return <Slot {...slotProps}></Slot>
	}
	return null
}

export default View
