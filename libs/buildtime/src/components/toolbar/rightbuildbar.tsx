import React, { FunctionComponent } from "react"
import MiniToolbar from "./minitoolbar"
import CodeToolbar from "./codetoolbar/codetoolbar"
import { definition } from "@uesio/ui"
import { Paper } from "@material-ui/core"

interface Props extends definition.BaseProps {
	selectedPanel: string
}

const MINI_TOOLBAR_WIDTH = 50

const RightBuildbar: FunctionComponent<Props> = ({
	selectedPanel,
	context,
}) => {
	const toolbarMap = {
		code: {
			component: CodeToolbar,
			width: 400,
		},
	}

	const current = toolbarMap[selectedPanel as "code"]

	return (
		<MiniToolbar
			anchor="right"
			width={current.width}
			right={MINI_TOOLBAR_WIDTH}
			open={!!selectedPanel}
			variant="persistent"
		>
			{current && (
				<Paper
					style={{
						overflow: "hidden",
						margin: "8px 0",
						height: "100%",
					}}
				>
					<current.component path="" context={context} />
				</Paper>
			)}
		</MiniToolbar>
	)
}

export default RightBuildbar
