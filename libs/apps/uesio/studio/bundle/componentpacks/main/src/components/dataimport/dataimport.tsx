import { useState, useMemo, useEffect } from "react"
import { definition, api, collection, util, component, styles } from "@uesio/ui"
import ImportBodyItem from "./importbodyitem"
import ImportButton from "./importbutton"

type DataImportDefinition = {
	collectionId: string
	namespace: string
}

interface State {
	success: boolean
	csvFields: string[]
	file: File | null
}

const StyleTokens = Object.freeze({
	root: ["flex", "gap-4", "justify-between"],
})

const DataImport: definition.UC<DataImportDefinition> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const { context, definition } = props

	const classes = styles.useUtilityStyleTokens(StyleTokens, props)

	const collectionId = context.mergeString(definition.collectionId)

	const [uploaded, setUploaded] = useState<State>({
		success: false,
		csvFields: [],
		file: null,
	})

	const memoCsvFields = useMemo(
		() => uploaded.csvFields,
		[uploaded.csvFields]
	)

	const changeUploaded = (
		success: boolean,
		csvFields: string[],
		file: File
	): void => {
		setUploaded({ success, csvFields, file })
	}

	const collectionInstance = api.collection.useCollection(
		context,
		collectionId
	)
	// useCollection returns a different Collection object every time.
	// But we only need to recompute collectionFields if the collectionInstance's underlying fields have changed
	const collectionFields = useMemo(
		() => Object.keys(collectionInstance?.source.fields || {}),
		[collectionInstance?.source.fields]
	)

	const [spec, setSpec] = useState<definition.ImportSpec>({
		jobtype: "IMPORT",
		collection: collectionInstance?.getFullName() || "",
		filetype: "CSV",
		mappings: {},
	})

	useEffect(() => {
		if (uploaded.success) {
			setSpec((previousSpec) => ({
				...previousSpec,
				collection: collectionInstance?.getFullName() || "",
				mappings: memoCsvFields.reduce((mapping, key) => {
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
				}, {}),
			}))
		}
	}, [uploaded.success, collectionFields, collectionInstance, memoCsvFields])

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
		const jobResponse = await api.collection.createJob(context, spec)
		if (!jobResponse.id) return

		try {
			await api.collection.importData(context, file, jobResponse.id)
		} catch (error) {
			const message = util.getErrorString(error)
			api.notification.addError("Import error: " + message, context)
			return
		}

		if (!collectionInstance) return
		api.signal.run(
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
			<div>
				{!uploaded.success && (
					<ImportButton
						changeUploaded={changeUploaded}
						context={context}
						type={"area"}
						id={api.component.getComponentIdFromProps(props)}
					/>
				)}
				{uploaded.success && (
					<div className={classes.root}>
						<Button
							context={context}
							variant={"uesio/io.primary"}
							onClick={() => {
								uploaded.file && upload(uploaded.file)
							}}
							label={"start import"}
						/>
						<ImportButton
							changeUploaded={changeUploaded}
							context={context}
							type={"button"}
						/>
					</div>
				)}
			</div>

			{uploaded.success &&
				collectionFields.map((fieldName, i) => {
					const field = collectionInstance?.getField(fieldName)
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
