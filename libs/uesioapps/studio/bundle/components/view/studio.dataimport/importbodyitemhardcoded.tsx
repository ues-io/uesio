import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	handleSelection: (
		csvField: string,
		uesioField: string,
		matchfield?: string
	) => void
	csvField: string
	uesioField: string
}

const TextField = component.registry.getUtility("io.textfield")

const ImportBodyItemHardCoded: FunctionComponent<Props> = (props) => {
	const { context, csvField, uesioField, handleSelection } = props
	const [State, setState] = useState<string>("")

	useEffect(() => {
		setState("")
	}, [csvField])

	return (
		<TextField
			context={context}
			label={"value:"}
			value={State}
			mode={"EDIT"}
			setValue={(item: string) => {
				setState(item)
				handleSelection(csvField, uesioField, item)
			}}
		/>
	)
}

export default ImportBodyItemHardCoded
