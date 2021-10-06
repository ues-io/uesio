import { FunctionComponent, useState } from "react"
import {
	definition,
	styles,
	collection,
	hooks,
	component,
	context,
} from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"

interface Props extends definition.BaseProps {
	collection: collection.Collection
	csvFields: string[]
	file: File | null
}

type SpecMapping = {
	[key: string]: {
		fieldname: string
		matchfield?: string
	}
}

interface CmpState {
	upsertkey?: string
	mappings: SpecMapping
}

const initialState = {
	success: false,
	mappings: {},
}

const addBlankSelectOption = collection.addBlankSelectOption
const Button = component.registry.getUtility("io.button")
const SelectField = component.registry.getUtility("io.selectfield")

const ImportBody: FunctionComponent<Props> = (props) => {
	const { context, collection, csvFields, file } = props
	const uesio = hooks.useUesio(props)

	const [CmpState, setCmpState] = useState<CmpState>(initialState)

	if (!collection?.source.fields) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = addBlankSelectOption(
		collectionFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	const upload = async (file: File, upsertkey: string | undefined) => {
		const jobResponse = await uesio.collection.createImportJob(
			context,
			"csv",
			collection.getFullName(), //TO-DO check if this is the expected ID
			upsertkey,
			CmpState.mappings
		)

		if (!jobResponse.id) return

		const batchResponse = await uesio.collection.importData(
			context,
			file,
			jobResponse.id
		)

		if (batchResponse.status === 200) {
			uesio.notification.addNotification(
				"import successful",
				"success",
				context
			)
		} else {
			const error = await batchResponse.text()
			uesio.notification.addError("Import error: " + error, context)
		}

		//RESET the component to initial state or redirect to manage data view
		setCmpState(initialState)
	}

	const handleSelection = (
		csvField: string,
		uesioField: string,
		matchfield: string
	): void => {
		//remove the mapping if blank is selected
		if (uesioField === "") {
			const { [csvField]: remove, ...rest } = CmpState.mappings

			setCmpState({
				...CmpState,
				mappings: {
					...rest,
				},
			})
		} else {
			setCmpState({
				...CmpState,
				mappings: {
					...CmpState.mappings,
					[csvField]: { fieldname: uesioField, matchfield },
				},
			})
		}
	}

	const findMatch = (record: string): string => {
		const opt = options.find((option) => option.value === record)
		if (opt) {
			return record
		}
		return options[0].value
	}

	const getAllMatch = (
		csvFields: string[],
		collectionFields: string[]
	): SpecMapping => {
		let mappings = {}

		for (const key of csvFields) {
			if (collectionFields.includes(key)) {
				mappings = { ...mappings, [key]: { fieldname: key } }
			}
		}

		return mappings
	}

	const classes = styles.useUtilityStyles(
		{
			header: { display: "flex", justifyContent: "space-between" },
			headerItem: { width: "200px" },
			grid: {},
		},
		null
	)

	return (
		<>
			<div className={classes.header}>
				<div className={classes.headerItem}>
					<SelectField
						label={"Upsert key:"}
						context={context}
						options={options}
						setValue={(value: string) => {
							setCmpState({
								...CmpState,
								upsertkey: value,
							})
						}}
					/>
				</div>
				<div>
					<Button
						context={context}
						variant={"io.secondary"}
						onClick={() => {
							file && upload(file, CmpState.upsertkey)
						}}
						label={"start import"}
					/>
				</div>
			</div>
			<div className={classes.grid}>
				{csvFields.map((record) => (
					<ImportBodyItem
						definition={{
							record,
							options,
							selOption: findMatch(record),
						}}
						handleSelection={handleSelection}
						context={context}
						collection={collection}
					/>
				))}
			</div>
		</>
	)
}

export default ImportBody
