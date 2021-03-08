import React, { FunctionComponent, ChangeEvent } from "react"
import { definition, hooks, styles } from "@uesio/ui"
import { Button } from "@material-ui/core"

type BulkjobDefinition = {
	id: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: BulkjobDefinition
}

const useStyles = styles.getUseStyles(["root", "input"], {
	root: (props: Props) => ({
		margin: styles.getSpacing(props.context.getTheme(), 1),
	}),
	input: {
		display: "none",
	},
})

const handleChange = (
	selectorFiles: FileList | null,
	uesio: hooks.Uesio,
	jobId: string
): void | never => {
	if (selectorFiles) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]
		const context = uesio.getContext()
		const workspace = context.getWorkspace()

		if (file.type === "text/csv") {
			fetch(
				`/workspace/${workspace?.app}/${workspace?.name}/bulk/job/${jobId}/batch`,
				{
					method: "post",
					body: file,
					headers: {
						"Content-Type": "application/json",
					},
				}
			)
		}
	}
}

const Bulkjob: FunctionComponent<Props> = (props) => {
	const {
		definition: { id, label },
		context,
	} = props

	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null

	const wireCollection = wire.getCollection()
	const idField = wireCollection.getIdField()
	if (!idField) return null

	const jobId = record.getFieldValue(idField.getId()) as string

	return (
		<div className={classes.root}>
			<label htmlFor={id}>
				<input
					type="file"
					className={classes.input}
					id={id}
					name={id}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						handleChange(e.target.files, uesio, jobId)
					}
				/>
				<Button color="primary" variant="contained" component="span">
					{label}
				</Button>
			</label>
		</div>
	)
}

export default Bulkjob
