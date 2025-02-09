import { definition, component, context, metadata, styles } from "@uesio/ui"
import FieldPicker from "../mainwrapper/propertiespanel/wire/fieldpicker"
import { useRef, useState } from "react"
import { FullPath } from "../../api/path"
import PopoutPanel from "../mainwrapper/propertiespanel/popoutpanel"

type ComponentDefinition = {
  allowReferenceTraversal?: boolean
  /** Either an explicit collection name to use for the field picker,
   * or a merge string indicating a field on a context record, e.g.
   * ${referenceCollection} , $Parent.Record{referenceCollection}, etc.
   */
  collectionName?: string
  /**
   * The field on the properties wire which will contain the selected collection field
   */
  fieldId: string
  fieldWrapperVariant?: metadata.MetadataKey
  label: string
  labelPosition?: string
  namespace?: string
}

const StyleDefaults = Object.freeze({
  root: ["grid", "grid-cols-[1fr_max-content]", "gap-1"],
  button: ["p-1"],
})

/**
 * Converts the Field Picker FullPath of a selected field to a field selector, e.g. "uesio/core.owner->uesio/core.firstname")
 * @param path FullPath
 * @returns string
 */
const transformFieldPickerPath = (path: FullPath) =>
  component.path
    .toPath(path.localPath)
    .filter((x) => x !== "fields")
    .join("->")

const equalsOrStartsWith = (a: string, b: string) => a === b || a.startsWith(b)

const CollectionFieldPicker: definition.UC<ComponentDefinition> = (props) => {
  const {
    context,
    definition: {
      allowReferenceTraversal = true,
      collectionName,
      fieldId,
      fieldWrapperVariant,
      labelPosition,
    },
  } = props

  const classes = styles.useStyleTokens(StyleDefaults, props)
  const collectionKey = context.mergeString(collectionName)
  const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
  const IconButton = component.getUtility("uesio/io.iconbutton")
  const TextField = component.getUtility("uesio/io.textfield")
  const anchorEl = useRef<HTMLDivElement>(null)
  const [showPopper, setShowPopper] = useState(false)
  const record = context.getRecord()
  // The type of field that we are populating with the collection name
  const fieldMetadata = record?.getWire().getCollection().getField(fieldId)
  const allowMultiselect = fieldMetadata?.getType() === "LIST"
  // The currently-selected single Collection Field (if we are NOT in multiselect mode)
  const singleValue =
    (!allowMultiselect && record?.getFieldValue<string>(fieldId)) || undefined
  // The currently-selected Collection Fields (if we ARE in multiselect mode)
  const arrayValue =
    (allowMultiselect && record?.getFieldValue<string[]>(fieldId)) || []

  const onSelect = (ctx: context.Context, path: FullPath) => {
    // For multiselect fields, we need to add the selected path to our current value, an array
    const newValue = transformFieldPickerPath(path)
    if (allowMultiselect) {
      record?.update(
        fieldId,
        arrayValue.filter((x) => x !== newValue).concat(newValue),
        ctx,
      )
    } else {
      record?.update(fieldId, newValue, ctx)
    }
  }
  const isSelected = (
    ctx: context.Context,
    path: FullPath,
    fieldId: string,
  ) => {
    const selectedField = transformFieldPickerPath(path.addLocal(fieldId))
    if (allowMultiselect) {
      if (!arrayValue.length) return false
      return (
        arrayValue.findIndex((x) => equalsOrStartsWith(x, selectedField)) > -1
      )
    } else {
      if (!singleValue) return false
      return equalsOrStartsWith(singleValue as string, selectedField)
    }
  }
  const label = fieldMetadata?.getLabel(context)

  return (
    <>
      {showPopper && anchorEl && (
        <PopoutPanel referenceEl={anchorEl.current} context={context}>
          <FieldPicker
            allowReferenceTraversal={allowReferenceTraversal}
            allowMultiselect={allowMultiselect}
            baseCollectionKey={collectionKey || ""}
            context={context}
            onClose={() => setShowPopper(false)}
            onSelect={onSelect}
            isSelected={isSelected}
          />
        </PopoutPanel>
      )}
      <FieldWrapper
        ref={anchorEl}
        label={label}
        labelPosition={labelPosition}
        context={context}
        variant={fieldWrapperVariant}
      >
        <div className={classes.root}>
          <TextField
            mode="READ"
            value={
              allowMultiselect ? `${arrayValue.length} selected` : singleValue
            }
            label={label}
            context={context}
            variant="uesio/builder.propfield"
          />
          <IconButton
            onClick={() => {
              setShowPopper(true)
            }}
            icon="edit"
            context={context}
            label="Select Field"
            tooltipPlacement={"bottom-start"}
            className={classes.button}
          />
        </div>
      </FieldWrapper>
    </>
  )
}

export default CollectionFieldPicker
