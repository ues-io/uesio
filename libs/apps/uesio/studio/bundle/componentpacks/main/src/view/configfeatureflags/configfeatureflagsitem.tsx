import { FunctionComponent, useState } from "react"
import { definition, component } from "@uesio/ui"

const TitleBar = component.getUtility("uesio/io.titlebar")
const ToggleField = component.getUtility("uesio/io.togglefield")

interface Props extends definition.BaseProps {
	title: string
	value: boolean
	handleSet: (key: string, value: boolean) => Promise<void>
}

const ConfigFeatureFlagsItem: FunctionComponent<Props> = (props) => {
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

export default ConfigFeatureFlagsItem
