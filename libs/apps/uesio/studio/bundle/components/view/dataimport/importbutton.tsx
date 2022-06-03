import { FunctionComponent } from "react"
import { definition, hooks, component, styles } from "@uesio/ui"
import { nanoid } from "nanoid"

interface Props extends definition.BaseProps {
	changeUploaded: (success: boolean, csvFields: string[], file: File) => void
}

const getHeaderFields = async (files: FileList | null): Promise<string[]> => {
	if (!files || files.length === 0) return []
	const file = files[0]
	const arrayBuffer = await readCSV(file)
	if (!arrayBuffer) return []
	const csvHeader = getHeaderString(arrayBuffer)
	const csvFields = csvHeader.split(",")
	return csvFields
}

const readCSV = async (file: File): Promise<ArrayBuffer | null> =>
	new Promise<ArrayBuffer | null>((resolve) => {
		const reader = new FileReader()
		reader.readAsArrayBuffer(file)
		reader.onload = function (e) {
			if (e && e.target && e.target.result) {
				resolve(e.target.result as ArrayBuffer)
			}
		}
	})

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
