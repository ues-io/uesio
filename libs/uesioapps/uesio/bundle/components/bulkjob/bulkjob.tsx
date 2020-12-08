import React, { ReactElement } from "react"
import { definition, material, hooks, signal } from "@uesio/ui"

type BulkjobDefinition = {
	id: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: BulkjobDefinition
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: () => ({
			margin: theme.spacing(1),
		}),
		input: (props: Props) => ({
			display: "none",
		}),
	})
)

async function handleChange(
	selectorFiles: FileList | null,
	uesio: hooks.Uesio,
	jobId: string
) {
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

function Bulkjob(props: Props): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) return null

	const id = props.definition.id
	const label = props.definition.label
	const wireCollection = wire.getCollection()
	const idField = wireCollection.getIdField()
	if (!idField) return null

	const collectionNamespace = wireCollection.getNamespace()
	const jobId = record.getFieldValue(idField.getId()) as string

	const BulkjobProps = {
		className: classes.root,
	}

	return (
		<div {...BulkjobProps}>
			<label htmlFor={id}>
				<input
					type="file"
					className={classes.input}
					id={id}
					name={id}
					onChange={(e) => handleChange(e.target.files, uesio, jobId)}
				/>
				<material.Button
					color="primary"
					variant="contained"
					component="span"
				>
					{label}
				</material.Button>
			</label>
		</div>
	)
}

export default Bulkjob
