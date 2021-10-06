import { FunctionComponent, useRef } from "react"
import { definition, styles, hooks, component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	changeUploaded: (success: boolean, csvFields: string[], file: File) => void
}

const getHeaderFields = async (files: FileList | null): Promise<string[]> => {
	if (files && files.length > 0) {
		const file = files[0]
		const arrayBuffer = await readCSV(file)
		if (arrayBuffer) {
			const csvHeader = getHeaderString(arrayBuffer)
			const csvFields = csvHeader.split(",")
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
				resolve(e.target.result as ArrayBuffer)
			}
		}
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

const Button = component.registry.getUtility("io.button")

const ImportButton: FunctionComponent<Props> = (props) => {
	const { context, changeUploaded } = props
	const uesio = hooks.useUesio(props)

	//Upload the CSV
	// if right change the changeUploaded to true and send the CSV fields to the parent

	const fileInput = useRef<HTMLInputElement>(null)
	const classes = styles.useUtilityStyles(
		{
			fileinput: {
				display: "none",
			},
		},
		null
	)

	return (
		<>
			<Button
				context={context}
				variant={"io.secondary"}
				onClick={() => fileInput.current?.click()}
				label={"choose file"}
			/>

			<input
				className={classes.fileinput}
				type="file"
				accept={".csv"}
				onChange={async (e) => {
					if (e.target.files && e.target.files.length > 0) {
						const csvFields = await getHeaderFields(e.target.files)
						if (csvFields.length > 0) {
							const file = e.target.files[0]
							changeUploaded(true, csvFields, file)
						} else {
							uesio.notification.addError("Invalid CSV", context)
						}
					} else {
						uesio.notification.addError("No file found", context)
					}
				}}
				ref={fileInput}
			/>
		</>
	)
}

export default ImportButton
