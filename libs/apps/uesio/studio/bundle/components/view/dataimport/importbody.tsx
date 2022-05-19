import { FunctionComponent, useState } from "react"
import { definition, styles, collection, hooks, component } from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"

interface Props extends definition.BaseProps {
	usage: "site" | "workspace"
	collection: collection.Collection
	csvFields: string[]
	file: File | null
}

const addBlankSelectOption = collection.addBlankSelectOption

const Button = component.registry.getUtility("uesio/io.button")
const SelectField = component.registry.getUtility("uesio/io.selectfield")

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
	const csvOptions = addBlankSelectOption(
		csvFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	const getInitialMatch = (
		csvFields: string[],
		collectionFields: string[]
	): Record<string, definition.ImportMapping> => {
		let mappings: Record<string, definition.ImportMapping> = {}

		csvFields.forEach((key) => {
			if (collectionFields.includes(key)) {
				const field = collection.getField(key)

				if (field) {
					mappings = {
						...mappings,
						[field.getId()]: {
							columnname: key,
							type: "IMPORT",
						},
					}
				}
			}
		})

		return mappings
	}

	const [spec, setSpec] = useState<definition.ImportSpec>({
		jobtype: "IMPORT",
		collection: collection.getFullName(),
		upsertkey: "",
		filetype: "CSV",
		mappings: getInitialMatch(csvFields, collectionFields),
	})

	const upload = async (file: File) => {
		const jobResponse = await uesio.collection.createJob(context, spec)

		if (!jobResponse.id) return

		try {
			await uesio.collection.importData(context, file, jobResponse.id)
		} catch (error) {
			uesio.notification.addError(
				"Import error: " + error.message,
				context
			)
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

	const isValidMapping = (): boolean => {
		const upsertkey = spec.upsertkey

		for (const [key, value] of Object.entries(spec.mappings)) {
			const field = collection.getField(key)
			const fieldType = field?.getType()
			if (fieldType === "REFERENCE" && !value.matchfield) {
				uesio.notification.addError(
					"missing Ref. Field for row: " + key,
					context
				)
				return false
			}
			if (fieldType === "REFERENCE" && !upsertkey) {
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
							setSpec({
								...spec,
								upsertkey: value,
							})
						}}
					/>
				</div>
				<div>
					<Button
						context={context}
						variant={"uesio/io.secondary"}
						onClick={() => {
							isValidMapping() && file && upload(file)
						}}
						label={"start import"}
					/>
				</div>
			</div>
			<div className={classes.grid}>
				{collectionFields.map((fieldName, i) => {
					const field = collection.getField(fieldName)
					if (!field) return null
					return (
						<ImportBodyItem
							key={`${fieldName}.${i}`}
							context={context}
							csvOptions={csvOptions}
							mapping={spec.mappings[fieldName]}
							removeMapping={() => {
								const { [fieldName]: remove, ...rest } =
									spec.mappings
								setSpec({
									...spec,
									mappings: {
										...rest,
									},
								})
							}}
							setMapping={(mapping) => {
								const field = collection.getField(fieldName)

								if (field) {
									setSpec({
										...spec,
										mappings: {
											...spec.mappings,
											[fieldName]: mapping,
										},
									})
								}
							}}
							field={field}
						/>
					)
				})}
			</div>
		</>
	)
}

export default ImportBody
