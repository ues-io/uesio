import { FunctionComponent } from "react"

import { TitleBarProps } from "./titlebardefinition"
import { component } from "@uesio/ui"

const IOTitleBar = component.getUtility("uesio/io.titlebar")

const TitleBar: FunctionComponent<TitleBarProps> = (props) => {
	const { definition, path, context } = props

	return (
		<IOTitleBar
			context={context}
			variant={definition["uesio.variant"]}
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
