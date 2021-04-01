import { FunctionComponent } from "react"

import { TitleBarProps } from "./titlebardefinition"
import IOTitleBar from "../../utility/io.titlebar/titlebar"
import { component } from "@uesio/ui"

const TitleBar: FunctionComponent<TitleBarProps> = (props) => {
	const { definition, path, context } = props

	return (
		<IOTitleBar
			{...props}
			title={definition.title}
			subtitle={definition.subtitle}
			actions={
				<component.Slot
					definition={definition}
					listName="actions"
					path={path}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			}
		/>
	)
}

export default TitleBar
