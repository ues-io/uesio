import { FunctionComponent, useEffect, useState } from "react"
import {
	definition,
	styles,
	collection,
	hooks,
	component,
	context,
} from "@uesio/ui"

type DataImportItemDefinition = {
	namespace: string
	record: string
	options: collection.SelectOption[]
	selOption: string
	collectionId: string
}

interface Props extends definition.BaseProps {
	definition: DataImportItemDefinition
	handleSelection: (csvField: string, uesioField: string) => void
}

const initialState = { display: false, options: [] }

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")

const DataImportItem: FunctionComponent<Props> = (props) => {
	const { context, definition, handleSelection } = props
	const uesio = hooks.useUesio(props)
	const { namespace, record, options, selOption, collectionId } = definition

	const classes = styles.useUtilityStyles(
		{
			gridItem: {
				display: "flex",
				justifyContent: "start",
			},
			headerItem: { width: "200px", paddingRight: "10px" },
		},
		null
	)

	const [selValue, setSelValue] = useState(selOption)
	const [refField, setrefField] = useState<{
		display: boolean
		options: string[]
	}>(initialState)

	return (
		<div className={classes.gridItem}>
			<div className={classes.headerItem}>
				<TextField
					context={context}
					label={"csv:"}
					value={record}
					mode={"READ"}
				/>
			</div>
			<div className={classes.headerItem}>
				<SelectField
					context={context}
					label={"uesio:"}
					value={selValue}
					options={options}
					setValue={(value: string) => {
						setSelValue(value)
						//setrefField({ display: true, options: options })
					}}
				/>
			</div>
			{refField.display && (
				<div className={classes.headerItem}>
					<SelectField
						context={context}
						label={"Ref. Field:"}
						value={selValue}
						options={refField.options}
						setValue={(value: string) => {
							//handleChange(value, collectionId)
						}}
					/>
				</div>
			)}
		</div>
	)
}

export default DataImportItem
