import React, { FunctionComponent } from "react"
import MiniToolbar from "./minitoolbar"
import MiniToolbarButton from "./minitoolbarbutton"
import SaveIcon from "@material-ui/icons/Save"
import CancelIcon from "@material-ui/icons/Cancel"
import ViewDetailIcon from "@material-ui/icons/ListAlt"
import CodeIcon from "@material-ui/icons/Code"

import { Divider } from "@material-ui/core"
import { hooks, definition, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	onChange: (toolbarId: string) => void
}

const MINI_TOOLBAR_WIDTH = 50

const RightNavbar: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const hasChanges = uesio.builder.useHasChanges()
	return (
		<MiniToolbar anchor="right" width={MINI_TOOLBAR_WIDTH}>
			<MiniToolbarButton
				id="save"
				icon={SaveIcon}
				disabled={!hasChanges}
				variant="save"
				title="Save"
				tooltipPlacement="left"
				onClick={(): void => {
					uesio.builder.save()
				}}
			/>
			<MiniToolbarButton
				id="cancel"
				icon={CancelIcon}
				disabled={!hasChanges}
				variant="cancel"
				title="Cancel"
				tooltipPlacement="left"
				onClick={(): void => uesio.builder.cancel()}
			/>
			<Divider style={{ margin: "8px 8px 0 8px" }} />
			<MiniToolbarButton
				id="views"
				icon={ViewDetailIcon}
				title="View Detail"
				tooltipPlacement="left"
				onClick={(): void => {
					const workspace = props.context.getWorkspace()
					const route = props.context.getRoute()
					if (!workspace || !route) {
						return
					}

					const [, viewName] = component.path.parseKey(route.view)

					uesio.signal.run(
						{
							signal: "route/REDIRECT",
							path: `/app/${workspace.app}/workspace/${workspace.name}/view/${viewName}`,
						},
						props.context
					)
				}}
			/>
			<MiniToolbarButton
				id="code"
				icon={CodeIcon}
				title="Code"
				tooltipPlacement="left"
				onClick={props.onChange}
			/>
		</MiniToolbar>
	)
}

export default RightNavbar
