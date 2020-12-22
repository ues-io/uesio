import { FunctionComponent, Fragment } from "react";
import RightNavbar from "./rightnavbar"
import RightBuildbar from "./rightbuildbar"
import { hooks, definition } from "@uesio/ui"

const RightToolbar: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const selectedPanel = uesio.builder.useRightPanel()

	return (
		<Fragment>
			{selectedPanel && (
				<RightBuildbar {...props} selectedPanel={selectedPanel} />
			)}
			<RightNavbar
				{...props}
				onChange={(toolbarId: string): void => {
					uesio.builder.setRightPanel(
						selectedPanel === toolbarId ? "" : toolbarId
					)
				}}
			/>
		</Fragment>
	)
}

export default RightToolbar
