import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"
import { nanoid } from "nanoid"
import Papa, { ParseResult } from "papaparse"

interface Props extends definition.BaseProps {
	changeUploaded: (success: boolean, csvFields: string[], file: File) => void
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
			header: false,
			complete: function (results: ParseResult<string[]>) {
				console.log("Finished:", results.data)
				resolve(results.data)
			},
			error: (parseErr) => {
				console.log("ERROR:", parseErr)
				resolve([])
			},
		})
	})

const Icon = component.getUtility("uesio/io.icon")
const UploadArea = component.getUtility("uesio/io.uploadarea")

const ImportButton: FunctionComponent<Props> = (props) => {
	const { context, changeUploaded } = props
	const uesio = hooks.useUesio(props)
	const uploadLabelId = nanoid()

	const classes = styles.useUtilityStyles(
		{
			div: {
				padding: "100px",
				outline: "dashed 1px " + context.merge("$Theme{color.primary}"),
				textAlign: "center",
				color: "rgb(196, 195, 196)",
			},
			icon: {
				fontSize: "80px",
				padding: "32px",
				color: context.merge("$Theme{color.primary}"),
			},
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
						uesio.notification.addError("Invalid CSV", context)
					}
				} else {
					uesio.notification.addError("No file found", context)
				}
			}}
			uploadLabelId={uploadLabelId}
		>
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
		</UploadArea>
	)
}

export default ImportButton
