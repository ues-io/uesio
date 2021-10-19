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
		columnname: string
		type: "IMPORT" | "VALUE"
		matchfield?: string
		fieldtype: collection.FieldType
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
		csvFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	const getInitialMatch = (
		csvFields: string[],
		collectionFields: string[]
	): SpecMapping => {
		let mappings: SpecMapping = {}

		csvFields.forEach((key) => {
			if (collectionFields.includes(key)) {
				const field = collection.getField(key)

				if (field) {
					mappings = {
						...mappings,
						[field.getId()]: {
							fieldtype: field.getType(),
							columnname: key,
							type: "IMPORT",
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

	const upload = async (file: File) => {
		console.log("upsertkey", State.upsertkey)
		console.log("MAPPINGS", State.mappings)

		const jobResponse = await uesio.collection.createImportJob(
			context,
			"csv",
			collection.getFullName(),
			State.upsertkey,
			State.mappings
		)

		if (!jobResponse.id) return

		const batchResponse = await uesio.collection.importData(
			context,
			file,
			jobResponse.id
		)

		if (batchResponse.status !== 200) {
			const error = await batchResponse.text()
			uesio.notification.addError("Import error: " + error, context)
			return
		}

		if (usage === "site") {
			uesio.signal.run(
				{
					signal: "route/REDIRECT",
					path: `/app/${context.getSiteAdmin()?.app}/site/${
						context.getSiteAdmin()?.name
					}/data/${collection.getFullName()}`,
				},
				context
			)
			return
		}

		uesio.signal.run(
			{
				signal: "route/REDIRECT",
				path: `/app/${context.getWorkspace()?.app}/workspace/${
					context.getWorkspace()?.name
				}/data/${collection.getId()}`,
			},
			context
		)
	}

	const handleSelection = (
		columnname: string,
		uesioField: string,
		matchfield?: string
	): void => {
		if (columnname === "") {
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
							columnname,
							matchfield,
							type:
								columnname === "hardcoded" ? "VALUE" : "IMPORT",
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
				uesio.notification.addError(
					"missing Ref. Field for row: " + key,
					context
				)
				return false
			}
			if (value.fieldtype === "REFERENCE" && !upsertkey) {
				uesio.notification.addError("missing upsertKey", context)
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
							isValidMapping() && file && upload(file)
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
							State.mappings[fieldName]?.columnname
								? State.mappings[fieldName].columnname
								: ""
						}
					/>
				))}
			</div>
		</>
	)
}

export default ImportBody
