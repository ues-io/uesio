import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	handleSelection: (
		columnname: string,
		uesioField: string,
		matchfield?: string
	) => void
	columnname: string
	uesioField: string
}

const TextField = component.registry.getUtility("io.textfield")

const ImportBodyItemHardCoded: FunctionComponent<Props> = (props) => {
	const { context, columnname, uesioField, handleSelection } = props
	const [State, setState] = useState<string>("")

	useEffect(() => {
		setState("")
	}, [columnname])

	return (
		<TextField
			context={context}
			label={"value:"}
			value={State}
			mode={"EDIT"}
			setValue={(item: string) => {
				setState(item)
				handleSelection(columnname, uesioField, item)
			}}
		/>
	)
}

export default ImportBodyItemHardCoded
