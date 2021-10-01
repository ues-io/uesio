import { FunctionComponent, useRef, useState, useEffect } from "react"
import {
	definition,
	styles,
	collection,
	hooks,
	component,
	context,
} from "@uesio/ui"
import DataImportItem from "../studio.dataimportitem/dataimportitem"

type DataImportDefinition = {
	collectionId: string
	namespace: string
	usage: "site" | "workspace"
}

interface Props extends definition.BaseProps {
	definition: DataImportDefinition
}

type SpecMapping = {
	[key: string]: {
		fieldname: string
		matchfield?: string
	}
}

interface CmpState {
	success: boolean
	csvFields: string[]
	upsertkey?: string
	files?: FileList | null
	mappings: SpecMapping
	options: collection.SelectOption[]
}

const initialState = {
	success: false,
	csvFields: [],
	mappings: {},
	options: [],
}

const init = (
	usage: string,
	collectionMrg: string,
	namespaceMrg: string,
	context: context.Context
): [string, string, context.Context] => {
	if (usage === "site") {
		console.log("SITE CONTEXT")
		const view = context.getView()
		const appName = view?.params?.appname
		const siteName = view?.params?.sitename
		const [namespace, name] = component.path.parseKey(collectionMrg)
		return [
			namespace,
			collectionMrg,
			context.addFrame({
				siteadmin: {
					name: siteName || "",
					app: appName || "",
				},
			}),
		]
	}
	return [namespaceMrg, `${namespaceMrg}.${collectionMrg}`, context]
}

const getHeaderFields = async (files: FileList | null): Promise<string[]> => {
	if (files && files.length > 0) {
		const file = files[0]
		const arrayBuffer = await readCSV(file)
		if (arrayBuffer) {
			const csvHeader = getHeaderString(arrayBuffer)
			const csvFields = csvHeader.split(",")
			console.log("csvFields", csvFields)

			return csvFields
		}
	}
	return []
}

const readCSV = async (file: File): Promise<ArrayBuffer | null> => {
	const pm = new Promise<ArrayBuffer | null>((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsArrayBuffer(file)
		reader.onload = function (e) {
			if (e && e.target && e.target.result) {
				console.log("readCSV ArrayBuffer")
				resolve(e.target.result as ArrayBuffer)
			}
		}
		console.log("readCSV null")
	})

	return pm
}

const getHeaderString = (data: ArrayBuffer): string => {
	const byteLength = data.byteLength
	const ui8a = new Uint8Array(data, 0)
	let headerString = ""
	for (let i = 0; i < byteLength; i++) {
		const char = String.fromCharCode(ui8a[i])
		if (char.match(/[^\r\n]+/g) !== null) {
			headerString += char
		} else {
			break
		}
	}
	return headerString
}

const isValidCSV = (arr: string[], target: string[]) =>
	target.every((v) => arr.includes(v))

const addBlankSelectOption = collection.addBlankSelectOption
const Button = component.registry.getUtility("io.button")
const SelectField = component.registry.getUtility("io.selectfield")

const DataImport: FunctionComponent<Props> = (props) => {
	const { context, definition } = props
	const uesio = hooks.useUesio(props)
	const collectionMrg = context.merge(definition.collectionId)
	const namespaceMrg = context.merge(definition.namespace)
	const usage = definition.usage
	const fileInput = useRef<HTMLInputElement>(null)
	const [CmpState, setCmpState] = useState<CmpState>(initialState)

	const [namespace, collectionId, newContext] = init(
		usage,
		collectionMrg,
		namespaceMrg,
		context
	)

	const upload = async (
		files: FileList | null,
		upsertkey: string | undefined
	) => {
		if (files && files.length > 0) {
			console.log("Mappings -->", CmpState.mappings)

			const file = files[0]
			console.log("UPLOAD", file)

			const jobResponse = await uesio.collection.createImportJob(
				newContext,
				"csv",
				collectionId,
				upsertkey,
				CmpState.mappings
			)

			console.log("jobId", jobResponse.id)

			if (!jobResponse.id) return

			const batchResponse = await uesio.collection.importData(
				newContext,
				file,
				jobResponse.id
			)

			console.log("batchResponse", batchResponse)

			if (batchResponse.status === 200) {
				uesio.notification.addNotification(
					"import successful",
					"success",
					newContext
				)
			} else {
				const error = await batchResponse.text()
				uesio.notification.addError(
					"Import error: " + error,
					newContext
				)
			}

			//RESET the component to initial state or redirect to manage data view
			setCmpState(initialState)
		}
	}

	const handleSelection = (csvField: string, uesioField: string): void => {
		console.log("handleSelection", { csvField, uesioField })

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
					[csvField]: { fieldname: uesioField },
				},
			})
		}

		console.log("handleSelection 2", CmpState.mappings)
	}

	const findMatch = (record: string): string => {
		const opt = CmpState.options.find((option) => option.value === record)
		console.log("OPT", opt)
		if (opt) {
			//handleSelection(record, opt.value)
			return record
		}
		return CmpState.options[0].value
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

		console.log("ABEL mappings", mappings)
		return mappings
	}

	const classes = styles.useUtilityStyles(
		{
			header: { display: "flex", justifyContent: "space-between" },
			headerItem: { width: "200px" },
			grid: {
				//gridTemplateColumns: "auto auto auto auto",
				//columnGap: "10px",
			},
			fileinput: {
				display: "none",
			},
		},
		null
	)

	///PLAY-STATION

	type LResponse = {
		[key: string]: {
			[key: string]: string | number | null
		}
	}

	const [fieldsMeta, setNodes] = useState<LResponse>({})

	// useEffect(() => {
	// 	getAllNodes()
	// }, [])

	//const getAllNodes = () => {
	// 	const fieldsMeta = uesio.collection.getMetadata<LResponse>(
	// 		newContext,
	// 		"FIELD",
	// 		namespace,
	// 		collectionId
	// 	)

	// 	fieldsMeta.then((response) => {
	// 		setNodes(response)
	// 	})
	// }
	///END PLAY-STATION

	// const fieldsMeta = uesio.builder.useMetadataList(
	// 	newContext,
	// 	"FIELD",
	// 	namespace,
	// 	collectionId
	// )

	if (!fieldsMeta) return null

	console.log("FIELDS META VALUE", fieldsMeta)

	const collectionFields = Object.keys(fieldsMeta)
	console.log("collectionFields", collectionFields)

	return !CmpState.success ? (
		<>
			<Button
				context={newContext}
				variant={"io.secondary"}
				onClick={() => fileInput.current?.click()}
				label={"choose file"}
			/>

			<input
				className={classes.fileinput}
				type="file"
				accept={".csv"}
				onChange={async (e) => {
					const csvFields = await getHeaderFields(e.target.files)

					if (
						csvFields.length > 0
						//&& isValidCSV(collectionFields, csvFields)
					) {
						setCmpState({
							...initialState,
							success: true,
							csvFields,
							files: e.target.files,
							options: addBlankSelectOption(
								collectionFields.map((key) => ({
									value: key,
									label: key,
								}))
							),
							mappings: getAllMatch(csvFields, collectionFields),
						})
					} else {
						uesio.notification.addError("Invalid CSV", newContext)
						setCmpState(initialState)
					}
				}}
				ref={fileInput}
			/>
		</>
	) : (
		<>
			<div className={classes.header}>
				<div className={classes.headerItem}>
					<SelectField
						label={"Upsert key:"}
						context={newContext}
						options={CmpState.options}
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
						context={newContext}
						variant={"io.secondary"}
						onClick={() => {
							CmpState.files &&
								upload(CmpState.files, CmpState.upsertkey)
						}}
						label={"start import"}
					/>
				</div>
			</div>
			<div className={classes.grid}>
				{CmpState.csvFields.map((record) => (
					<DataImportItem
						definition={{
							namespace,
							record,
							options: CmpState.options,
							selOption: findMatch(record),
							collectionId,
							fieldsMeta,
						}}
						handleSelection={handleSelection}
						context={newContext}
					/>
				))}
			</div>
		</>
	)
}

export default DataImport
