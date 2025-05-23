package datasource

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func TestGetFieldMetadata(t *testing.T) {
	builtIn := meta.BuiltIn{}
	bundleableBase := meta.BundleableBase{
		Name:      "fieldname",
		Namespace: "luigi/appname",
	}
	tests := []struct {
		name  string
		input *meta.Field
		want  *wire.FieldMetadata
	}{
		{
			"FORMULA fields - TEXT return type",
			&meta.Field{
				BuiltIn:        builtIn,
				BundleableBase: bundleableBase,
				CollectionRef:  "",
				Type:           "FORMULA",
				FormulaMetadata: &meta.FormulaMetadata{
					Expression: `luigi/foo.first_name + " " + zach/foo.last_name`,
					ReturnType: "TEXT",
				},
			},
			&wire.FieldMetadata{
				Name:       "fieldname",
				Namespace:  "luigi/appname",
				Accessible: true,
				Createable: false,
				Updateable: false,
				Type:       "TEXT",
				FormulaMetadata: &wire.FormulaMetadata{
					Expression: `luigi/foo.first_name + " " + zach/foo.last_name`,
					ReturnType: "TEXT",
				},
				IsFormula: true,
			},
		},
		{
			"FORMULA fields - CHECKBOX return type",
			&meta.Field{
				BuiltIn:        builtIn,
				BundleableBase: bundleableBase,
				CollectionRef:  "",
				Type:           "FORMULA",
				FormulaMetadata: &meta.FormulaMetadata{
					Expression: `luigi/foo.somenumber > 0`,
					ReturnType: "CHECKBOX",
				},
			},
			&wire.FieldMetadata{
				Name:       "fieldname",
				Namespace:  "luigi/appname",
				Accessible: true,
				Createable: false,
				Updateable: false,
				Type:       "CHECKBOX",
				FormulaMetadata: &wire.FormulaMetadata{
					Expression: `luigi/foo.somenumber > 0`,
					ReturnType: "CHECKBOX",
				},
				IsFormula: true,
			},
		},
		{
			"STRUCT fields - support for nested subfields",
			&meta.Field{
				BuiltIn:        builtIn,
				BundleableBase: bundleableBase,
				CollectionRef:  "",
				Type:           "STRUCT",
				SubFields: []meta.SubField{
					{
						Name:       "first_name",
						Label:      "First Name",
						Type:       "TEXT",
						CreateOnly: false,
					},
					{
						Name:       "is_ai",
						Label:      "Is Artificial Intelligence",
						Type:       "CHECKBOX",
						CreateOnly: true,
					},
					{
						Name:       "salutation",
						Label:      "Salutation",
						Type:       "SELECT",
						SelectList: "uesio/core.salutations",
					},
					{
						Name:  "accuracy",
						Label: "Accuracy",
						Type:  "STRUCT",
						SubFields: []meta.SubField{
							{
								Name:  "value",
								Label: "Accuracy Value",
								Type:  "NUMBER",
								Number: &meta.NumberMetadata{
									Decimals: 4,
								},
							},
							{
								Name:  "source",
								Label: "Source Integration",
								Type:  "METADATA",
								Metadata: &meta.MetadataFieldMetadata{
									Type: "INTEGRATION",
								},
								CreateOnly: true,
							},
						},
					},
				},
			},
			&wire.FieldMetadata{
				Name:       "fieldname",
				Namespace:  "luigi/appname",
				Accessible: true,
				Createable: true,
				Updateable: true,
				Type:       "STRUCT",
				SubFields: map[string]*wire.FieldMetadata{
					"first_name": {
						Name:       "first_name",
						Createable: true,
						Accessible: true,
						Updateable: true,
						Type:       "TEXT",
						Label:      "First Name",
					},
					"is_ai": {
						Name:       "is_ai",
						Createable: true,
						Accessible: true,
						Updateable: false,
						Type:       "CHECKBOX",
						Label:      "Is Artificial Intelligence",
					},
					"salutation": {
						Name:       "salutation",
						Createable: true,
						Accessible: true,
						Updateable: true,
						Type:       "SELECT",
						Label:      "Salutation",
						SelectListMetadata: &wire.SelectListMetadata{
							Name: "uesio/core.salutations",
						},
					},
					"accuracy": {
						Name:       "accuracy",
						Createable: true,
						Accessible: true,
						Updateable: true,
						Type:       "STRUCT",
						Label:      "Accuracy",
						SubFields: map[string]*wire.FieldMetadata{
							"value": {
								Name:  "value",
								Label: "Accuracy Value",
								Type:  "NUMBER",
								NumberMetadata: &wire.NumberMetadata{
									Decimals: 4,
								},
								Createable: true,
								Accessible: true,
								Updateable: true,
							},
							"source": {
								Name:  "source",
								Label: "Source Integration",
								Type:  "METADATA",
								MetadataFieldMetadata: &wire.MetadataFieldMetadata{
									Type: "INTEGRATION",
								},
								Createable: true,
								Accessible: true,
								Updateable: false,
							},
						},
					},
				},
				IsFormula: false,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, GetFieldMetadata(tt.input), "GetFieldMetadata(%v)", tt.input)
		})
	}
}
