import { component, definition } from "@uesio/ui"
import { default as IOTitleBar } from "../../utilities/titlebar/titlebar"

type TitleBarDefinition = {
	title: string
	subtitle: string
}

const TitleBar: definition.UC<TitleBarDefinition> = (props) => {
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
					context={context}
					label="Title Bar Actions"
				/>
			}
		/>
	)
}

export default TitleBar
