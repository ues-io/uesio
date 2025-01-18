import { forwardRef } from "react"
import { definition, styles, wire } from "@uesio/ui"
import { LabelPosition } from "../../components/field/field"
import FieldLabel from "../fieldlabel/fieldlabel"
import Icon from "../icon/icon"

interface FieldWrapperUtilityProps extends definition.UtilityProps {
  // The label to display
  label?: string
  // The id of the element that this is a label for
  labelFor?: string
  labelPosition?: LabelPosition
  errors?: wire.SaveError[]
}

const StyleDefaults = Object.freeze({
  root: [],
  labelTop: [],
  labelLeft: [],
  labelRight: [],
  label: [],
  errorwrapper: [],
  erroricon: [],
  error: [],
})

const FieldWrapper = forwardRef<HTMLDivElement, FieldWrapperUtilityProps>(
  (props, ref) => {
    const { label, labelFor, labelPosition, children, context, errors } = props
    const classes = styles.useUtilityStyleTokens(
      StyleDefaults,
      props,
      "uesio/io.fieldwrapper",
    )
    return (
      <div
        ref={ref}
        className={styles.cx(
          classes.root,
          (labelPosition === "top" || !labelPosition) && classes.labelTop,
          labelPosition === "left" && classes.labelLeft,
          labelPosition === "right" && classes.labelRight,
        )}
      >
        {labelPosition !== "none" && (
          <FieldLabel
            classes={{ root: classes.label }}
            label={label}
            labelFor={labelFor}
            context={context}
          />
        )}

        {children}

        {errors?.map((error) => (
          <div
            className={classes.errorwrapper}
            key={error.recordid + ":" + error.fieldid}
          >
            <Icon
              icon="error_outline"
              context={props.context}
              className={classes.erroricon}
            />
            <div className={classes.error}>{error.message}</div>
          </div>
        ))}
      </div>
    )
  },
)

export default FieldWrapper
