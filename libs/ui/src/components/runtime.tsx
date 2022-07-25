import { FunctionComponent } from "react"

import { BaseProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"
import Route from "./route"
import { css } from "@emotion/css"
import NotificationArea from "./notificationarea"
import HotkeyProvider from "./hotkeyprovider"

const Runtime: FunctionComponent<BaseProps> = (props) => {
	const uesio = useUesio(props)
	// Hardcode the component type since this component is called
	// in an unusual way by the loader
	uesio._componentType = "uesio/studio.runtime"

	uesio.addContextFrame({
		view: "$root",
	})
	const [buildMode, setBuildMode] = uesio.component.useState<boolean>(
		"buildmode",
		false
	)

	// This tells us to load in the studio main component pack if we're in buildmode
	const deps = buildMode ? ["uesio/studio.main", "uesio/io.main"] : []
	const scriptResult = uesio.component.usePacks(deps, !!buildMode)

	const context = uesio.getContext().addFrame({
		buildMode: buildMode && scriptResult.loaded,
	})

	if (buildMode === undefined) return null

	return (
		<HotkeyProvider uesio={uesio} setBuildMode={setBuildMode}>
			<Route path={props.path} context={context} />
			<div
				className={css({
					position: "fixed",
					right: "2em",
					bottom: "2em",
					display: "grid",
					rowGap: "10px",
					marginLeft: "2em",
					width: "350px",
				})}
			>
				<NotificationArea context={props.context} />
			</div>
		</HotkeyProvider>
	)
}

export default Runtime
