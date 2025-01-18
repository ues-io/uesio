import { definition, component, wire, collection, context } from "@uesio/ui"
import { add, get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import { useSelectedPath } from "../../../../api/stateapi"
import { getFieldMetadata } from "../../../../api/wireapi"
import {
  TextProperty,
  NumberProperty,
  CheckboxProperty,
  SelectProperty,
  DateProperty,
  ListPropertyItemChildrenFunctionOptions,
  ComponentProperty,
} from "../../../../properties/componentproperty"

import ListPropertyItem from "../../../../utilities/listpropertyitem/listpropertyitem"

function getConditionPropertiesPanelTitle(
  condition: wire.WireConditionState,
): string {
  return `${condition.type === "GROUP" ? "Group " : ""} Condition Properties`
}

const multiValueOperators = ["HAS_ANY", "HAS_ALL", "IN", "NOT_IN"]
const textAlikeFiledTypes = ["TEXT", "AUTONUMBER", "EMAIL", "LONGTEXT"]

function getConditionTitle(condition: wire.WireConditionState): string {
  if (condition.type === "GROUP" && !condition.valueSource) {
    return `GROUP ${condition.conjunction || "AND"}`
  }

  if (condition.valueSource === "PARAM") {
    const valueCondition = condition as wire.ParamConditionState
    const valuesString = valueCondition.params
      ? "(" + valueCondition.params.join(",") + ")"
      : valueCondition.param
    return `${valueCondition.field} ${
      valueCondition.operator || ""
    } Param{${valuesString}}`
  }

  if (condition.valueSource === "LOOKUP") {
    const valueCondition = condition as wire.LookupConditionState
    return `${valueCondition.field} ${
      valueCondition.operator || ""
    } Lookup{${valueCondition.lookupWire || ""}.${
      valueCondition.lookupField || ""
    }}`
  }

  if (condition.type === "SEARCH") {
    return `SEARCH${
      condition.fields ? "[" + condition.fields?.join(", ") + "]" : ""
    }`
  }

  if (condition.type === "SUBQUERY") {
    return `SUBQUERY: ${condition.field || "[No field]"} ${
      condition.operator || "IN"
    } (SELECT ${condition.subfield || "[No field]"} FROM ${
      condition.subcollection || "[No collection]"
    })`
  }

  if (
    condition.operator === "IS_BLANK" ||
    condition.operator === "IS_NOT_BLANK"
  ) {
    return `${condition.field} ${condition.operator}`
  }

  if (condition.valueSource === "VALUE" || !condition.valueSource) {
    const valueCondition = condition as wire.ValueConditionState
    const valuesString = valueCondition.values
      ? "(" + valueCondition.values.join(",") + ")"
      : valueCondition.value || "[No value]"
    return `${valueCondition.field || "[No field]"} ${
      valueCondition.operator || ""
    } ${valuesString || ""}`
  }

  return "NEW_VALUE"
}

function getOperatorOptions(fieldDisplayType: string | undefined) {
  if (fieldDisplayType === "MULTISELECT")
    return [
      {
        label: "",
        value: "",
      },
      {
        label: "Has Any",
        value: "HAS_ANY",
      },
      {
        label: "Has All",
        value: "HAS_ALL",
      },
    ]
  return [
    {
      label: "",
      value: "",
    },
    {
      label: "Equals",
      value: "EQ",
    },
    {
      label: "Not Equal To",
      value: "NOT_EQ",
    },
    {
      label: "Greater Than",
      value: "GT",
    },
    {
      label: "Less Than",
      value: "LT",
    },
    {
      label: "Greater Than or Equal To",
      value: "GTE",
    },
    {
      label: "Less Than or Equal To",
      value: "LTE",
    },
    {
      label: "In",
      value: "IN",
    },
    {
      label: "Not In",
      value: "NOT_IN",
    },
    {
      label: "Is Blank",
      value: "IS_BLANK",
    },
    {
      label: "Is Not Blank",
      value: "IS_NOT_BLANK",
    },
    {
      label: "Between",
      value: "BETWEEN",
    },
    ...(fieldDisplayType && textAlikeFiledTypes.includes(fieldDisplayType)
      ? [
          {
            label: "Contains",
            value: "CONTAINS",
          },
          {
            label: "Starts With",
            value: "STARTS_WITH",
          },
        ]
      : []),
  ]
}

function getValueProperty(
  fieldDisplayType: wire.FieldType | undefined,
  fieldMetadata: collection.Field | undefined,
  context: context.Context,
):
  | TextProperty
  | NumberProperty
  | CheckboxProperty
  | SelectProperty
  | DateProperty {
  // TODO: Add additional property types here to support things like DATE

  const baseValueProp = {
    name: "value",
    label: "Value",
    displayConditions: [
      {
        field: "valueSource",
        value: "VALUE",
        type: "fieldValue",
        operator: "EQUALS",
      },
      {
        type: "fieldValue",
        field: "operator",
        operator: "NOT_IN",
        values: multiValueOperators.concat(["BETWEEN"]),
      },
    ],
  }

  if (fieldDisplayType === "CHECKBOX") {
    return { ...baseValueProp, type: "CHECKBOX" } as CheckboxProperty
  }

  if (fieldDisplayType === "NUMBER") {
    return { ...baseValueProp, type: "NUMBER" } as NumberProperty
  }

  if (fieldDisplayType === "DATE") {
    return { ...baseValueProp, type: "DATE" } as DateProperty
  }

  if (fieldDisplayType === "SELECT") {
    return {
      ...baseValueProp,
      type: "SELECT",
      options: fieldMetadata?.getSelectOptions({ context }),
    } as SelectProperty
  }

  return { ...baseValueProp, type: "TEXT" } as TextProperty
}

const getWireConditionItemsChildrenFunction =
  (wireName: string) => (options: ListPropertyItemChildrenFunctionOptions) => {
    const { context, item, index, path } = options
    const wireCondition = item as wire.WireConditionState
    const isGroup = wireCondition.type === "GROUP"
    const groupConditions =
      isGroup && !wireCondition.valueSource ? wireCondition.conditions : null
    if (!groupConditions) return null
    return groupConditions.map(
      (conditionOnGroup: wire.WireConditionState, secindex: number) => {
        const conditionOnGroupPath = path.addLocal("conditions")

        return (
          <ListPropertyItem
            key={index + "." + secindex}
            context={context.addRecordDataFrame(
              conditionOnGroup as wire.PlainWireRecord,
              secindex,
            )}
            parentPath={conditionOnGroupPath}
            displayTemplate={getConditionTitle(conditionOnGroup)}
            itemProperties={getItemPropertiesFunction(
              context,
              conditionOnGroupPath,
              wireName,
            )}
            itemPropertiesPanelTitle="Condition Properties"
          />
        )
      },
    )
  }

const getItemPropertiesFunction =
  (context: context.Context, parentPath: FullPath, wireName: string) =>
  (itemState: wire.PlainWireRecord): ComponentProperty[] => {
    const fieldMetadata =
      itemState.field && wireName
        ? getFieldMetadata(
            context,
            wireName as string,
            itemState.field as string,
          )
        : undefined

    const fieldDisplayType = fieldMetadata?.getType() || undefined

    return [
      {
        name: "id",
        type: "TEXT",
        label: "Condition Id",
        unique: true,
      },
      {
        name: "field",
        type: "COLLECTION_FIELD",
        label: "Field",
        collectionPath: `${"../".repeat(parentPath.size() - 3)}../collection`,
        displayConditions: [
          {
            operator: "NOT_IN",
            field: "type",
            values: ["GROUP", "SUBQUERY"],
            type: "fieldValue",
          },
        ],
        onChange: [
          {
            // Clear out all of these wire condition properties whenever field is changed
            updates: [
              "operator",
              "value",
              "values",
              "start",
              "end",
              "inclusiveStart",
              "inclusiveEnd",
            ].map((field) => ({ field })),
          },
        ],
      },
      {
        name: "operator",
        type: "SELECT",
        label: "Operator",
        options: getOperatorOptions(fieldDisplayType),
        displayConditions: [
          {
            operator: "NOT_EQUALS",
            field: "type",
            value: "GROUP",
            type: "fieldValue",
          },
        ],
        onChange: [
          // Clear out value if operator IS NOW a multi-value operator
          {
            updates: [
              {
                field: "value",
              },
            ],
            conditions: [
              {
                field: "operator",
                operator: "IN",
                values: multiValueOperators,
                type: "fieldValue",
              },
            ],
          },
          // Clear out param if operator IS NOW a multi-value operator
          {
            updates: [
              {
                field: "param",
              },
            ],
            conditions: [
              {
                field: "operator",
                operator: "IN",
                values: multiValueOperators,
                type: "fieldValue",
              },
            ],
          },
          // Clear out values (PLURAL) if operator IS NO LONGER a multi-value operator
          {
            updates: [
              {
                field: "values",
              },
            ],
            conditions: [
              {
                field: "operator",
                operator: "NOT_IN",
                values: multiValueOperators,
                type: "fieldValue",
              },
            ],
          },
          // Clear out params (PLURAL) if operator IS NO LONGER a multi-value operator
          {
            updates: [
              {
                field: "params",
              },
            ],
            conditions: [
              {
                field: "operator",
                operator: "NOT_IN",
                values: multiValueOperators,
                type: "fieldValue",
              },
            ],
          },
          // Clear out special BETWEEN properties if operator is not BETWEEN
          {
            conditions: [
              {
                field: "operator",
                operator: "NOT_EQUALS",
                value: "BETWEEN",
                type: "fieldValue",
              },
            ],
            updates: ["start", "end", "inclusiveStart", "inclusiveEnd"].map(
              (field) => ({ field }),
            ),
          },
        ],
      },
      {
        name: "valueSource",
        type: "SELECT",
        label: "Value Source",
        options: [
          {
            label: "",
            value: "",
          },
          {
            label: "Value",
            value: "VALUE",
          },
          {
            label: "Lookup",
            value: "LOOKUP",
          },
          {
            label: "Param",
            value: "PARAM",
          },
        ],
        displayConditions: [
          {
            type: "fieldValue",
            operator: "IN",
            field: "operator",
            values: [
              "EQ",
              "NOT_EQ",
              "GT",
              "LT",
              "GTE",
              "LTE",
              "IN",
              "NOT_IN",
              "BETWEEN",
              "HAS_ANY",
              "HAS_ALL",
              "CONTAINS",
              "STARTS_WITH",
            ],
          },
        ],
        onChange: [
          {
            updates: [
              {
                field: "value",
              },
              {
                field: "values",
              },
              {
                field: "param",
              },
              {
                field: "params",
              },
              {
                field: "lookupWire",
              },
              {
                field: "lookupField",
              },
              {
                field: "start",
              },
              {
                field: "end",
              },
              {
                field: "inclusiveStart",
              },
              {
                field: "inclusiveEnd",
              },
            ],
          },
        ],
      },
      {
        name: "start",
        type: "TEXT",
        label: "Start",
        displayConditions: [
          {
            field: "valueSource",
            value: "VALUE",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            type: "fieldValue",
            operator: "EQUALS",
            field: "operator",
            value: "BETWEEN",
          },
        ],
      },
      {
        name: "end",
        type: "TEXT",
        label: "End",
        displayConditions: [
          {
            field: "valueSource",
            value: "VALUE",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            type: "fieldValue",
            operator: "EQUALS",
            field: "operator",
            value: "BETWEEN",
          },
        ],
      },
      {
        name: "inclusiveStart",
        type: "CHECKBOX",
        label: "Inclusive Start",
        displayConditions: [
          {
            field: "valueSource",
            value: "VALUE",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            type: "fieldValue",
            operator: "EQUALS",
            field: "operator",
            value: "BETWEEN",
          },
        ],
      },
      {
        name: "inclusiveEnd",
        type: "CHECKBOX",
        label: "Inclusive End",
        displayConditions: [
          {
            field: "valueSource",
            value: "VALUE",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            type: "fieldValue",
            operator: "EQUALS",
            field: "operator",
            value: "BETWEEN",
          },
        ],
      },
      {
        ...getValueProperty(fieldDisplayType, fieldMetadata, context),
      },
      {
        name: "values",
        type: "LIST",
        label: "Values",
        subtype: fieldDisplayType,
        subtypeOptions:
          fieldDisplayType === "CHECKBOX"
            ? [
                { label: "True", value: "true" },
                { label: "False", value: "false" },
              ]
            : fieldMetadata?.getSelectOptions({ context }),
        displayConditions: [
          {
            field: "valueSource",
            value: "VALUE",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            field: "operator",
            type: "fieldValue",
            operator: "IN",
            values: multiValueOperators,
          },
        ],
      },
      {
        name: "lookupWire",
        type: "WIRE",
        label: "Lookup Wire",
        displayConditions: [
          {
            field: "valueSource",
            value: "LOOKUP",
            type: "fieldValue",
            operator: "EQUALS",
          },
        ],
      },
      {
        name: "lookupField",
        type: "FIELD",
        label: "Lookup Field",
        wireField: "lookupWire",
        displayConditions: [
          {
            field: "valueSource",
            value: "LOOKUP",
            type: "fieldValue",
            operator: "EQUALS",
          },
        ],
      },
      {
        name: "params",
        type: "LIST",
        label: "Params",
        subtype: fieldDisplayType,
        displayConditions: [
          {
            field: "valueSource",
            value: "PARAM",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            field: "operator",
            type: "fieldValue",
            operator: "IN",
            values: multiValueOperators,
          },
        ],
      },
      {
        name: "param",
        type: "PARAM",
        label: "Param",
        displayConditions: [
          {
            field: "valueSource",
            value: "PARAM",
            type: "fieldValue",
            operator: "EQUALS",
          },
          {
            field: "operator",
            type: "fieldValue",
            operator: "NOT_IN",
            values: multiValueOperators,
          },
        ],
      },
      {
        name: "inactive",
        type: "CHECKBOX",
        label: "Inactive by default",
      },
      {
        name: "type",
        type: "SELECT",
        label: "Type",
        options: [
          {
            label: "Group",
            value: "GROUP",
          },
        ],
        displayConditions: [
          {
            field: "type",
            value: "GROUP",
            type: "fieldValue",
            operator: "EQUALS",
          },
        ],
      },
      {
        name: "conjunction",
        type: "SELECT",
        label: "Conjunction",
        options: [
          {
            label: "AND",
            value: "AND",
          },
          {
            label: "OR",
            value: "OR",
          },
        ],
        displayConditions: [
          {
            field: "type",
            value: "GROUP",
            type: "fieldValue",
            operator: "EQUALS",
          },
        ],
      },
    ]
  }

const ConditionsProperties: definition.UC = (props) => {
  const { context } = props
  const ListPropertyUtility = component.getUtility("uesio/builder.listproperty")

  const propertyName = "conditions"
  const selectedPath = useSelectedPath(context)
  const wirePath = selectedPath.trimToSize(2)
  const conditionsPath = wirePath.addLocal(propertyName)
  const [wireName] = wirePath.pop()

  const items = get(context, conditionsPath) as wire.WireConditionState[]

  const defaultConditionDef = {}

  const defaultConditionGroupDef = {
    type: "GROUP",
    conjunction: "OR",
    conditions: [defaultConditionDef],
  }

  return (
    <>
      <ListPropertyUtility
        context={context}
        path={conditionsPath}
        actions={[
          {
            label: "Add Group",
            action: () => {
              add(
                context,
                conditionsPath.addLocal(`${items?.length || 0}`),
                defaultConditionGroupDef,
              )
            },
          },
          {
            label: "Add Condition",
            action: () => {
              let targetPath = conditionsPath
              let conditionsArray = items
              // If the selected path is a Group, add the condition to the group
              if (
                (get(context, selectedPath) as wire.WireConditionState)
                  ?.type === "GROUP"
              ) {
                targetPath = selectedPath.addLocal("conditions")
                conditionsArray = get(
                  context,
                  targetPath,
                ) as wire.WireConditionState[]
              }
              add(
                context,
                targetPath.addLocal(`${conditionsArray?.length || 0}`),
                defaultConditionDef,
              )
            },
          },
        ]}
        items={items}
        itemProperties={getItemPropertiesFunction(
          context,
          conditionsPath,
          wireName || "",
        )}
        itemDisplayTemplate={getConditionTitle}
        itemPropertiesPanelTitle={getConditionPropertiesPanelTitle}
        itemChildren={getWireConditionItemsChildrenFunction(wireName || "")}
      />
    </>
  )
}

ConditionsProperties.displayName = "ConditionsProperties"

export default ConditionsProperties
