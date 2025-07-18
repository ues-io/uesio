import { Context } from "../context/context"
import { create, dispatch } from "../store/store"
import {
  addDefaultPropertyAndSlotValues,
  resolveDeclarativeComponentDefinition,
  mergeContextVariants,
} from "./component"

import { setMany as setComponentVariant } from "../bands/componentvariant"
import { ComponentVariant } from "../definition/componentvariant"
import { DefinitionMap } from "../definition/definition"
import { MetadataKey } from "../metadata/types"
import { Component } from "../definition/component"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`
const componentTypeWithoutSlots = {
  type: "DECLARATIVE",
  namespace: "uesio/tests",
  name: "noslots",
  slots: [],
  definition: [
    {
      "uesio/io.text": {
        text: "$Prop{title}",
      },
    },
    {
      "uesio/io.text": {
        text: "$Prop{subtitle}",
      },
    },
  ],
  properties: [],
}
const componentTypeWithSlots = {
  type: "DECLARATIVE",
  namespace: "uesio/tests",
  name: "hasslots",
  definition: [
    {
      "uesio/io.box": {
        components: ["$Slot{header}"],
      },
    },
    {
      "uesio/io.text": {
        text: "$Prop{title}",
      },
    },
  ],
  slots: [{ name: "header" }],
  properties: [],
}

const componentTypeWithSlotsAndContext = {
  type: "DECLARATIVE",
  namespace: "uesio/tests",
  name: "hasslots",
  definition: [
    {
      "uesio/io.box": {
        components: ["$Slot{header}"],
      },
    },
    {
      "uesio/io.text": {
        text: "$Prop{title}",
      },
    },
  ],
  slots: [
    {
      name: "header",
      providesContexts: [
        {
          type: "WIRE" as const,
          wireProperty: "wire",
        },
      ],
    },
  ],
}

const getViewContext = () =>
  new Context().addViewFrame({
    params: { foo: "oof", bar: "rab" },
    view: viewName,
    viewDef,
  })

const resolveDeclarativeComponentDefinitionTests = [
  {
    name: "no props provided - should not merge empty strings",
    context: new Context(),
    inputDefinition: {},
    componentDef: componentTypeWithoutSlots,
    expected: [
      {
        "uesio/io.text": {},
      },
      {
        "uesio/io.text": {},
      },
    ],
  },
  {
    name: "props provided",
    context: new Context(),
    inputDefinition: {
      title: "foo",
      subtitle: "bar",
    },
    componentDef: componentTypeWithoutSlots,
    expected: [
      {
        "uesio/io.text": {
          text: "foo",
        },
      },
      {
        "uesio/io.text": {
          text: "bar",
        },
      },
    ],
  },
  {
    name: "props provided that include merges",
    context: getViewContext(),
    inputDefinition: {
      title: "$Param{foo}",
      subtitle: "$Param{bar}",
    },
    componentDef: componentTypeWithoutSlots,
    expected: [
      {
        "uesio/io.text": {
          text: "$Param{foo}",
        },
      },
      {
        "uesio/io.text": {
          text: "$Param{bar}",
        },
      },
    ],
  },
  {
    name: "props provided that include merges and slots",
    context: getViewContext(),
    inputDefinition: {
      title: "$Param{foo}",
      header: [
        {
          "uesio/io.text": {
            // This should NOT get merged yet because it's in a slot,
            // and we should strip slots out of the definition when merging Props,
            // since these properties will be merged later as part of rendering the Slot contents.
            text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
          },
        },
      ],
    },
    componentDef: componentTypeWithSlots,
    expected: [
      {
        "uesio/io.box": {
          components: [
            {
              "uesio/core.slot": {
                name: "header",
                definition: {
                  header: [
                    {
                      "uesio/io.text": {
                        text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
                      },
                    },
                  ],
                },
                path: "",
                componentType: "me/myapp.testcomponent",
                readonly: false,
                slotDef: {
                  name: "header",
                },
                context: expect.objectContaining({
                  stack: [
                    {
                      componentType: "me/myapp.testcomponent",
                      data: {
                        header: [
                          {
                            "uesio/io.text": {
                              text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
                            },
                          },
                        ],
                        title: "$Param{foo}",
                      },
                      path: "",
                      slots: [
                        {
                          name: "header",
                        },
                      ],
                      type: "PROPS",
                    },
                    {
                      params: { foo: "oof", bar: "rab" },
                      view: viewName,
                      viewDef,
                      type: "VIEW",
                    },
                  ],
                }),
              },
            },
          ],
        },
      },
      {
        "uesio/io.text": {
          text: "$Param{foo}",
        },
      },
    ],
  },
  {
    name: "props provided that include merges and slots - with providing context",
    context: getViewContext(),
    inputDefinition: {
      title: "$Param{foo}",
      header: [
        {
          "uesio/io.text": {
            // This should NOT get merged yet because it's in a slot,
            // and we should strip slots out of the definition when merging Props,
            // since these properties will be merged later as part of rendering the Slot contents.
            text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
          },
        },
      ],
    },
    componentDef: componentTypeWithSlotsAndContext,
    expected: [
      {
        "uesio/io.box": {
          components: [
            {
              "uesio/core.slot": {
                name: "header",
                definition: {
                  header: [
                    {
                      "uesio/io.text": {
                        text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
                      },
                    },
                  ],
                },
                path: "",
                componentType: "me/myapp.testcomponent",
                readonly: false,
                slotDef: {
                  name: "header",
                  providesContexts: [
                    {
                      type: "WIRE",
                      wireProperty: "wire",
                    },
                  ],
                },
                context: expect.objectContaining({
                  stack: [
                    {
                      componentType: "me/myapp.testcomponent",
                      data: {
                        header: [
                          {
                            "uesio/io.text": {
                              text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
                            },
                          },
                        ],
                        title: "$Param{foo}",
                      },
                      path: "",
                      slots: [
                        {
                          name: "header",
                          providesContexts: [
                            {
                              type: "WIRE",
                              wireProperty: "wire",
                            },
                          ],
                        },
                      ],
                      type: "PROPS",
                    },
                    {
                      params: { foo: "oof", bar: "rab" },
                      view: viewName,
                      viewDef,
                      type: "VIEW",
                    },
                  ],
                }),
              },
            },
          ],
        },
      },
      {
        "uesio/io.text": {
          text: "$Param{foo}",
        },
      },
    ],
  },
]

describe("resolveDeclarativeComponentDefinition", () => {
  resolveDeclarativeComponentDefinitionTests.forEach((tc) => {
    test(tc.name, () => {
      const actual = resolveDeclarativeComponentDefinition(
        tc.context || new Context(),
        tc.inputDefinition,
        tc.componentDef.definition,
        tc.componentDef.slots,
        "",
        "me/myapp.testcomponent",
      )
      expect(actual).toEqual(tc.expected)
    })
  })
})

const componentTypeWithSlotAndPropertyDefaults = {
  type: "DECLARATIVE",
  namespace: "uesio/tests",
  name: "hasslotandpropertydefaults",
  definition: [
    {
      "uesio/io.box": {
        components: ["$Slot{header}"],
      },
    },
    {
      "uesio/io.text": {
        text: "$Prop{title}",
      },
    },
  ],
  slots: [
    {
      name: "header",
      defaultContent: [
        {
          "uesio/io.titlebar": {
            title:
              "Merge: $Prop{title} This is a title: ${uesio/core.uniquekey}",
          },
        },
      ],
    },
  ],
  properties: [{ name: "title", defaultValue: "Hello $User{email}!" }],
}

const addDefaultPropertyAndSlotValuesTests = [
  {
    name: "component type has no slots",
    inputDefinition: {},
    componentDef: componentTypeWithoutSlots,
    expected: {},
  },
  {
    name: "no defaults defined on the component type for either slots or properties",
    inputDefinition: {
      title: "foo",
    },
    componentDef: componentTypeWithSlots,
    expected: {
      title: "foo",
    },
  },
  {
    name: "no slot/prop values provided, for component type with defaults defined",
    inputDefinition: {},
    componentDef: componentTypeWithSlotAndPropertyDefaults,
    expected: {
      header: [
        {
          "uesio/io.titlebar": {
            title: "Merge:  This is a title: ${uesio/core.uniquekey}",
          },
        },
      ],
      title: "Hello $User{email}!",
    },
  },
  {
    name: "values provided for slots and props, for component type with defaults defined",
    inputDefinition: {
      header: [
        {
          "uesio/io.text": {
            text: "We provided our own header",
          },
        },
      ],
      title: "We provided our own title",
    },
    componentDef: componentTypeWithSlotAndPropertyDefaults,
    expected: {
      header: [
        {
          "uesio/io.text": {
            text: "We provided our own header",
          },
        },
      ],
      title: "We provided our own title",
    },
  },
  {
    name: "value provided for props but not slots, for component type with defaults defined and prop merge in slot default",
    inputDefinition: {
      title: "We provided our own title",
    },
    componentDef: componentTypeWithSlotAndPropertyDefaults,
    expected: {
      header: [
        {
          "uesio/io.titlebar": {
            title:
              "Merge: We provided our own title This is a title: ${uesio/core.uniquekey}",
          },
        },
      ],
      title: "We provided our own title",
    },
  },
  {
    name: "value provided for props but not slots, however, the props are explicitly set to undefined",
    inputDefinition: {
      title: undefined,
    },
    componentDef: componentTypeWithSlotAndPropertyDefaults,
    expected: {
      header: [
        {
          "uesio/io.titlebar": {
            title: "Merge:  This is a title: ${uesio/core.uniquekey}",
          },
        },
      ],
      title: "Hello $User{email}!",
    },
  },
]

describe("addDefaultPropertyAndSlotValues", () => {
  addDefaultPropertyAndSlotValuesTests.forEach((tc) => {
    test(tc.name, () => {
      const actual = addDefaultPropertyAndSlotValues(
        tc.inputDefinition,
        tc.componentDef.properties,
        tc.componentDef.slots,
        "",
        "",
        new Context(),
      )
      expect(actual).toEqual(tc.expected)
    })
  })
})

type MergeContextVariantsTestCase = {
  name: string
  inputDefinition: DefinitionMap | undefined
  componentType: MetadataKey
  componentDef: Component | undefined
  variants: ComponentVariant[]
  expected: DefinitionMap | undefined
}

const simpleReactComponentDef = {
  type: "REACT" as const,
  namespace: "uesio/tests" as const,
  name: "simple",
  properties: [],
}

const simpleVariant: ComponentVariant = {
  namespace: "uesio/tests",
  name: "main",
  label: "Main",
  component: "uesio/tests.simple",
  definition: {
    foo: "bar",
    "uesio.styleTokens": {
      root: ["m-5"],
    },
  },
}

const mergeContextVariantsTests: MergeContextVariantsTestCase[] = [
  {
    name: "sanity",
    inputDefinition: {},
    componentType: "uesio/tests.simple",
    componentDef: simpleReactComponentDef,
    variants: [],
    expected: {},
  },
  {
    name: "no merge if no default",
    inputDefinition: {},
    componentType: "uesio/tests.simple",
    componentDef: simpleReactComponentDef,
    variants: [simpleVariant],
    expected: {},
  },
  {
    name: "no merge if no default and missing componentDef",
    inputDefinition: {},
    componentType: "uesio/tests.simple",
    componentDef: undefined,
    variants: [simpleVariant],
    expected: {},
  },
  {
    name: "add default if exists",
    inputDefinition: {},
    componentType: "uesio/tests.simple",
    componentDef: {
      ...simpleReactComponentDef,
      defaultVariant: "uesio/tests.main",
    },
    variants: [simpleVariant],
    expected: {
      "uesio.variant": "uesio/tests.main",
      foo: "bar",
    },
  },
  {
    name: "add default if exists - existing props win",
    inputDefinition: {
      foo: "woo",
    },
    componentType: "uesio/tests.simple",
    componentDef: {
      ...simpleReactComponentDef,
      defaultVariant: "uesio/tests.main",
    },
    variants: [simpleVariant],
    expected: {
      "uesio.variant": "uesio/tests.main",
      foo: "woo",
    },
  },
  {
    name: "simple variant merge",
    inputDefinition: {
      "uesio.variant": "uesio/tests.main",
    },
    componentType: "uesio/tests.simple",
    componentDef: simpleReactComponentDef,
    variants: [simpleVariant],
    expected: {
      "uesio.variant": "uesio/tests.main",
      foo: "bar",
    },
  },
  {
    name: "simple variant merge - no componentDef",
    inputDefinition: {
      "uesio.variant": "uesio/tests.main",
    },
    componentType: "uesio/tests.simple",
    componentDef: undefined,
    variants: [simpleVariant],
    expected: {
      "uesio.variant": "uesio/tests.main",
      foo: "bar",
    },
  },
]

describe("mergeContextVariants", () => {
  mergeContextVariantsTests.forEach((tc) => {
    test(tc.name, () => {
      create({})
      if (tc.variants) {
        dispatch(setComponentVariant(tc.variants))
      }
      const actual = mergeContextVariants(
        tc.inputDefinition,
        tc.componentType,
        tc.componentDef,
        new Context(),
      )
      expect(actual).toEqual(tc.expected)
    })
  })
})
