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
	[key: string]: {
		fieldname: string
		matchfield?: string
	}
}

interface CmpState {
	upsertkey?: string
	mappings: SpecMapping
}

const addBlankSelectOption = collection.addBlankSelectOption
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

	const [CmpState, setCmpState] = useState<CmpState>({
		mappings: getAllMatch(csvFields, collectionFields),
	})

	const upload = async (file: File, upsertkey: string | undefined) => {
		const jobResponse = await uesio.collection.createImportJob(
			context,
			"csv",
			collection.getFullName(),
			upsertkey,
			CmpState.mappings
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
		csvField: string,
		uesioField: string,
		matchfield?: string
	): void => {
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
