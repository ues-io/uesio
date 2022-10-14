import { FunctionComponent, useState, useEffect } from "react"
import { definition, hooks, collection, util, component } from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"
import ImportButton from "./importbutton"

type DataImportDefinition = {
	collectionId: string
	namespace: string
}

interface Props extends definition.BaseProps {
	definition: DataImportDefinition
}

interface State {
	success: boolean
	csvFields: string[]
	file: File | null
}
const Button = component.getUtility("uesio/io.button")
const DataImport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionId = context.merge(definition.collectionId)

	const [uploaded, setUploaded] = useState<State>({
		success: false,
		csvFields: [],
		file: null,
	})

	const changeUploaded = (
		success: boolean,
		csvFields: string[],
		file: File
	): void => {
		setUploaded({ success, csvFields, file })
	}

	const collectionInstance = uesio.collection.useCollection(
		context,
		collectionId
	)
	const collectionFields = Object.keys(
		collectionInstance?.source.fields || {}
	)

	const getInitialMatch = (
		csvFields: string[],
		collectionFields: string[]
	): Record<string, definition.ImportMapping> =>
		csvFields.reduce((mapping, key) => {
			const field = collectionInstance?.getField(key) || ""
			return !field || !collectionFields.includes(key)
				? mapping
				: {
						...mapping,
						[field.getId()]: {
							columnname: key,
							type: "IMPORT",
						},
				  }
		}, {})

	const [spec, setSpec] = useState<definition.ImportSpec>({
		jobtype: "IMPORT",
		collection: collectionInstance?.getFullName() || "",
		filetype: "CSV",
		mappings: getInitialMatch(uploaded.csvFields, collectionFields),
	})

	useEffect(() => {
		uploaded.success &&
			setSpec({
				...spec,
				collection: collectionInstance?.getFullName() || "",
				mappings: getInitialMatch(uploaded.csvFields, collectionFields),
			})
	}, [uploaded.success])

	if (!collectionInstance) return null

	const addBlankSelectOption = collection.addBlankSelectOption
	const csvOptions = addBlankSelectOption(
		uploaded.csvFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	const upload = async (file: File) => {
		const tenant = context.getTenant()
		if (!tenant) throw new Error("Invalid context for collection list")
		const tenantType = context.getTenantType()
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
				}/data/${collectionInstance.getNamespace()}/${collectionInstance.getId()}`,
			},
			context
		)
	}

	return (
		<>
			<div style={{ display: "flex", gap: "5px", marginBottom: "1em" }}>
				<div style={{ flex: 1 }}>
					<ImportButton
						changeUploaded={changeUploaded}
						context={context}
						type={uploaded.success ? "button" : "area"}
					/>
				</div>
				{uploaded.success && (
					<Button
						context={context}
						variant={"uesio/io.primary"}
						onClick={() => {
							uploaded.file && upload(uploaded.file)
						}}
						label={"start import"}
					/>
				)}
			</div>

			{uploaded.success &&
				collectionFields.map((fieldName, i) => {
					const field = collectionInstance.getField(fieldName)
					if (!field) return null
					return (
						<ImportBodyItem
							key={`${fieldName}.${i}`}
							index={i + 1}
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
							setMapping={(mapping) =>
								setSpec({
									...spec,
									mappings: {
										...spec.mappings,
										[fieldName]: mapping,
									},
								})
							}
							field={field}
						/>
					)
				})}
		</>
	)
}

export default DataImport
