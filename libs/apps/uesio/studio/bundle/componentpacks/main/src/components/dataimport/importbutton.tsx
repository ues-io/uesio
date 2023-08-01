import { definition, api, component, styles } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Papa, { ParseResult } from "papaparse"

interface Props {
	changeUploaded: (success: boolean, csvFields: string[], file: File) => void
	type?: "button" | "area"
}

const getHeaderFields = async (files: FileList | null): Promise<string[]> => {
	if (!files || files.length === 0) return []
	const file = files[0]
	const csvArray = await readCSV(file)
	if (!csvArray.length) return []
	//Assume that first row is the header
	const csvFields = csvArray[0]
	return csvFields
}

const readCSV = async (file: File): Promise<string[][]> =>
	new Promise<string[][]>((resolve) => {
		Papa.parse(file, {
			header: false, //If false, will omit the header row. If data is an array of arrays this option is ignored. If data is an array of objects the keys of the first object are the header row. If data is an object with the keys fields and data the fields are the header row.
			skipEmptyLines: true, //If true, lines that are completely empty (those which evaluate to an empty string) will be skipped. If set to 'greedy', lines that don't have any content (those which have only whitespace after parsing) will also be skipped.
			complete: (results: ParseResult<string[]>) => {
				resolve(results.data)
			},
			error: (parseErr) => {
				console.log(parseErr.message)
				resolve([])
			},
		})
	})

const ImportButton: definition.UtilityComponent<Props> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const UploadArea = component.getUtility("uesio/io.uploadarea")
	const { context, changeUploaded, type } = props

	const uploadLabelId = nanoid()

	const classes = styles.useUtilityStyleTokens(
		{
			div: [
				"p-24",
				"outline-1",
				"outline-dashed",
				"outline-primary",
				"text-slate-700",
				"font-light",
				"text-sm",
				"text-center",
				"grid",
				"items-center",
				"justify-center",
				"content-center",
				"gap-4",
				"rounded",
			],
			icon: ["text-7xl", "text-primary"],
		},
		props
	)

	return (
		<UploadArea
			context={context}
			accept={".csv"}
			onUpload={async (files: FileList | null) => {
				if (files && files.length > 0) {
					const csvFields = await getHeaderFields(files)
					if (csvFields.length > 0) {
						const file = files[0]
						changeUploaded(true, csvFields, file)
					} else {
						api.notification.addError("Invalid CSV", context)
					}
				} else {
					api.notification.addError("No file found", context)
				}
			}}
			uploadLabelId={uploadLabelId}
		>
			{type && type === "button" ? (
				<label htmlFor={uploadLabelId}>
					{/* A bit hacky, we the button styling but not the click event*/}
					<div style={{ pointerEvents: "none", cursor: "pointer" }}>
						<Button
							context={context}
							variant={"uesio/io.secondary"}
							label={"Upload another file"}
						/>
					</div>
				</label>
			) : (
				<label htmlFor={uploadLabelId}>
					<div className={classes.div}>
						<p>Drop your .csv file here or Click to browse.</p>
						<Icon
							className={classes.icon}
							context={context}
							icon="image"
						/>
					</div>
				</label>
			)}
		</UploadArea>
	)
}

export default ImportButton
