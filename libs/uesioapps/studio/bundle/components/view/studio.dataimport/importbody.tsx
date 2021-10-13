import { FunctionComponent, useState } from "react"
import { definition, styles, collection, hooks, component } from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"

interface Props extends definition.BaseProps {
	usage: "site" | "workspace"
	collection: collection.Collection
	csvFields: string[]
	file: File | null
}

type SpecMapping = {
	[fieldname: string]: {
		fieldtype: collection.FieldType
		csvindex: number
		csvfieldname: string
		matchfield?: string
	}
}

interface State {
	upsertkey?: string
	mappings: SpecMapping
}

const addBlankSelectOption = collection.addBlankSelectOption
const addExtraOptions = (
	options: collection.SelectOption[] | undefined
): collection.SelectOption[] =>
	[
		{
			value: "",
			label: "",
		},
		{
			value: "hardcoded",
			label: "Hardcoded value",
		},
	].concat(options || [])
const Button = component.registry.getUtility("io.button")
const SelectField = component.registry.getUtility("io.selectfield")

const ImportBody: FunctionComponent<Props> = (props) => {
	const { context, usage, collection, csvFields, file } = props
	const uesio = hooks.useUesio(props)

	if (!collection?.source.fields) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = addBlankSelectOption(
		collectionFields.map((key) => ({
			value: key,
			label: key,
		}))
	)
	const csvOptions = addExtraOptions(
		csvFields.map((key, index) => ({
			value: key,
			label: key + " (" + index + ")",
		}))
	)

	const getInitialMatch = (
		csvFields: string[],
		collectionFields: string[]
	): SpecMapping => {
		let mappings: SpecMapping = {}

		csvFields.forEach((key, index) => {
			if (collectionFields.includes(key)) {
				const field = collection.getField(key)

				if (field) {
					mappings = {
						...mappings,
						[field.getId()]: {
							fieldtype: field.getType(),
							csvindex: index,
							csvfieldname: key,
						},
					}
				}
			}
		})

		return mappings
	}

	const [State, setState] = useState<State>({
		mappings: getInitialMatch(csvFields, collectionFields),
	})

	const upload = async (file: File, upsertkey: string | undefined) => {
		console.log("upsertkey", State.upsertkey)
		console.log("MAPPINGS", State.mappings)

		// const jobResponse = await uesio.collection.createImportJob(
		// 	context,
		// 	"csv",
		// 	collection.getFullName(),
		// 	upsertkey,
		// 	State.mappings
		// )

		// if (!jobResponse.id) return

		// const batchResponse = await uesio.collection.importData(
		// 	context,
		// 	file,
		// 	jobResponse.id
		// )

		// if (batchResponse.status !== 200) {
		// 	const error = await batchResponse.text()
		// 	uesio.notification.addError("Import error: " + error, context)
		// 	return
		// }

		// if (usage === "site") {
		// 	uesio.signal.run(
		// 		{
		// 			signal: "route/REDIRECT",
		// 			path: `/app/${context.getSiteAdmin()?.app}/site/${
		// 				context.getSiteAdmin()?.name
		// 			}/data/${collection.getFullName()}`,
		// 		},
		// 		context
		// 	)
		// 	return
		// }

		// uesio.signal.run(
		// 	{
		// 		signal: "route/REDIRECT",
		// 		path: `/app/${context.getWorkspace()?.app}/workspace/${
		// 			context.getWorkspace()?.name
		// 		}/data/${collection.getId()}`,
		// 	},
		// 	context
		// )
	}

	const handleSelection = (
		csvField: string,
		uesioField: string,
		matchfield?: string
	): void => {
		if (csvField === "") {
			const { [uesioField]: remove, ...rest } = State.mappings

			setState({
				...State,
				mappings: {
					...rest,
				},
			})
		} else {
			const field = collection.getField(uesioField)

			if (field) {
				setState({
					...State,
					mappings: {
						...State.mappings,
						[uesioField]: {
							fieldtype: field.getType(),
							csvindex: csvFields.indexOf(csvField),
							csvfieldname: csvField,
							matchfield,
						},
					},
				})
			}
		}
	}

	const isValidMapping = (): boolean => {
		const upsertkey = State.upsertkey

		for (const [key, value] of Object.entries(State.mappings)) {
			if (value.fieldtype === "REFERENCE" && !value.matchfield) {
				alert("not valid: missing matchfield in the field: " + key)
				return false
			}
			if (value.fieldtype === "REFERENCE" && !upsertkey) {
				alert("not valid: missing upsertKey")
				return false
			}
		}

		return true
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
							setState({
								...State,
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
							isValidMapping() &&
								file &&
								upload(file, State.upsertkey)
						}}
						label={"start import"}
					/>
				</div>
			</div>
			<div className={classes.grid}>
				{collectionFields.map((fieldName) => (
					<ImportBodyItem
						context={context}
						csvOptions={csvOptions}
						handleSelection={handleSelection}
						field={collection.getField(fieldName)}
						match={
							State.mappings[fieldName]?.csvfieldname
								? State.mappings[fieldName].csvfieldname
								: ""
						}
					/>
				))}
			</div>
		</>
	)
}

export default ImportBody
