import { useState } from "react"
import { definition, component } from "@uesio/ui"

interface Props {
	title: string
	value: boolean
	handleSet: (key: string, value: boolean) => Promise<void>
}

const ConfigFeatureFlagsCheckboxItem: definition.UtilityComponent<Props> = (
	props
) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const ToggleField = component.getUtility("uesio/io.togglefield")
	const { context, title, value, handleSet } = props
	const [state, setState] = useState(value)

	return (
		<TitleBar
			title={title}
			subtitle={state ? "revealing" : "hiding"}
			context={context}
			styles={{
				root: {
					marginBottom: "20px",
				},
			}}
			actions={
				<ToggleField
					context={context}
					value={state}
					setValue={(value: boolean) => {
						setState(value)
						handleSet(title, value)
					}}
				/>
			}
		/>
	)
}

export default ConfigFeatureFlagsCheckboxItem
