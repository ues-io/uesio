import { ChangeEvent } from "react"
import { definition, styles, component, context as ctx } from "@uesio/ui"

type BulkjobDefinition = {
  id: string
  label: string
}

const handleChange = (
  selectorFiles: FileList | null,
  context: ctx.Context,
  jobId: string,
): void | never => {
  if (selectorFiles) {
    if (selectorFiles.length !== 1) {
      throw new Error("Too many files selected")
    }

    const file = selectorFiles[0]

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
        },
      )
    }
  }
}

const StyleDefaults = Object.freeze({
  root: [],
  input: ["hidden"],
})

const Bulkjob: definition.UC<BulkjobDefinition> = (props) => {
  const Button = component.getUtility("uesio/io.button")
  const {
    definition: { id, label },
    context,
  } = props

  const classes = styles.useStyleTokens(StyleDefaults, props)

  const record = context.getRecord()
  const wire = context.getWire()
  if (!wire || !record) return null

  const jobId = record.getIdFieldValue() || ""
  return (
    <div className={classes.root}>
      <label htmlFor={id}>
        <input
          type="file"
          className={classes.input}
          id={id}
          name={id}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleChange(e.target.files, context, jobId)
          }
        />
        <Button label={label} context={context} variant="uesio/io.secondary">
          {label}
        </Button>
      </label>
    </div>
  )
}

export default Bulkjob
