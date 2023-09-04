import { useState } from "react"
import { definition, component } from "@uesio/ui"

interface Props {
	title: string
	value: number
	min?: number
	max?: number
	handleSet: (key: string, value: number) => Promise<void>
}

const ConfigFeatureFlagsNumberItem: definition.UtilityComponent<Props> = (
	props
) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const NumberField = component.getUtility("uesio/io.numberfield")
	const { context, title, value, handleSet, min, max } = props
	const [state, setState] = useState(value)
	const options = {
		min,
		max,
	}

	return (
		<TitleBar
			title={title}
			context={context}
			styles={{
				root: {
					marginBottom: "20px",
				},
			}}
			actions={
				<NumberField
					context={context}
					value={state}
					options={options}
					applyChanges="onBlur"
					setValue={(value: number) => {
						setState(value)
						handleSet(title, value)
					}}
				/>
			}
		/>
	)
}

export default ConfigFeatureFlagsNumberItem
