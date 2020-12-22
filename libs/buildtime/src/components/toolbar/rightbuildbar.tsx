import { FunctionComponent } from "react";
import MiniToolbar from "./minitoolbar"
import CodeToolbar from "./codetoolbar/codetoolbar"
import { definition, material } from "@uesio/ui"

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
				<material.Paper
					style={{
						overflow: "hidden",
						margin: "8px 0",
						height: "100%",
					}}
				>
					<current.component path="" context={context} />
				</material.Paper>
			)}
		</MiniToolbar>
	)
}

export default RightBuildbar
