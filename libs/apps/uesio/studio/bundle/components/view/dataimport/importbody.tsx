import { FunctionComponent, useState } from "react"
import {
	definition,
	styles,
	collection,
	hooks,
	component,
	util,
} from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"

interface Props extends definition.BaseProps {
	collection: collection.Collection
	csvFields: string[]
	file: File | null
}

const addBlankSelectOption = collection.addBlankSelectOption

const Button = component.getUtility("uesio/io.button")

const ImportBody: FunctionComponent<Props> = (props) => {
	const { context, collection, csvFields, file } = props
	const uesio = hooks.useUesio(props)

	const tenant = context.getTenant()
	if (!tenant) throw new Error("Invalid context for collection list")
	const tenantType = context.getTenantType()

	if (!collection?.source.fields) return null
	const collectionFields = Object.keys(collection?.source.fields)

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
		filetype: "CSV",
		mappings: getInitialMatch(csvFields, collectionFields),
	})

	const upload = async (file: File) => {
		const jobResponse = await uesio.collection.createJob(context, spec)
		if (!jobResponse.id) return

		try {
			await uesio.collection.importData(context, file, jobResponse.id)
		} catch (error) {
			const message = util.getErrorString(error)
			uesio.notification.addError("Import error: " + message, context)
			return
		}

		uesio.signal.run(
			{
				signal: "route/REDIRECT",
				path: `/app/${tenant.app}/${tenantType}/${
					tenant.name
				}/data/${collection.getNamespace()}/${collection.getId()}`,
			},
			context
		)
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
				<div>
					<Button
						context={context}
						variant={"uesio/io.secondary"}
						onClick={() => {
							file && upload(file)
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
