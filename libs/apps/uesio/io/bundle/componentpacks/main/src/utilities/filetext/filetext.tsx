import { FunctionComponent } from "react"
import { definition, context, api } from "@uesio/ui"
import { UserFileMetadata } from "../../components/field/field"
import CodeField from "../codefield/codefield"
import MarkDownField from "../markdownfield/markdownfield"
import { MDOptions } from "../markdownfield/types"

interface FileTextProps extends definition.UtilityProps {
	path: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | File | null) => void
	displayAs?: string
	options?: MDOptions
}

const stringToFile = (value: string, fileName: string, mimeType: string) => {
	const blob = new Blob([value], {
		type: mimeType,
	})
	return new File([blob], fileName, {
		type: mimeType,
	})
}

const FileText: FunctionComponent<FileTextProps> = (props) => {
	const { context, userFile, onUpload, mode, options, displayAs } = props

	const [content, original, setContent, reset, cancel] = api.file.useUserFile(
		context,
		userFile
	)

	const onUploadSignal = () => {
		if (!userFile) return
		const fileName = userFile["uesio/core.path"]
		const mimeType = userFile["uesio/core.mimetype"]
		reset()
		onUpload(stringToFile(content, fileName, mimeType))
	}

	const onCancelSignal = () => {
		cancel()
	}

	const changeHandler = (value: string) => {
		setContent(value)
	}

	const uploadSignal = "upload"
	const cancelSignal = "cancel"

	api.event.useEvent(uploadSignal, onUploadSignal, [content])
	api.event.useEvent(cancelSignal, onCancelSignal, [original])

	if (displayAs === "MARKDOWN") {
		return (
			<MarkDownField
				context={context}
				value={content}
				mode={mode}
				setValue={changeHandler}
				options={options}
				variant={props.variant}
			/>
		)
	}

	return (
		<CodeField context={context} value={content} setValue={changeHandler} />
	)
}

export default FileText
