import { FunctionComponent, useRef } from "react"

import { TitleBarProps } from "./titlebardefinition"
import { component } from "@uesio/ui"

const IOTitleBar = component.registry.getUtility("io.titlebar")

const TitleBar: FunctionComponent<TitleBarProps> = (props) => {
	const { definition, path, context } = props
	const ref = useRef<HTMLDivElement>(null)

	return (
		<IOTitleBar
			ref={ref}
			context={context}
			variant={definition["uesio.variant"]}
			title={definition.title}
			subtitle={definition.subtitle}
			actions={
				<component.Slot
					parentRef={ref}
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
