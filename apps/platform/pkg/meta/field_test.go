package meta

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"gopkg.in/yaml.v3"
)

var field_basic = trimYamlString(`
name: myfield
type: TEXT
label: My Label
`)

var field_invalid_type = trimYamlString(`
name: myfield
type: TACO
label: My Label
`)

var field_reference = trimYamlString(`
name: myfield
type: REFERENCE
label: My Label
reference:
    collection: my/namespace.myothercollection
`)

var field_reference_local_collection = trimYamlString(`
name: myfield
type: REFERENCE
label: My Label
reference:
    collection: myothercollection
`)

var field_reference_missing_node = trimYamlString(`
name: myfield
type: REFERENCE
label: My Label
`)

var field_reference_empty_node = trimYamlString(`
name: myfield
type: REFERENCE
label: My Label
reference:
`)

var field_reference_missing_collection = trimYamlString(`
name: myfield
type: REFERENCE
label: My Label
reference:
    wrong_property: wrong_value
`)

var field_select = trimYamlString(`
name: myfield
type: SELECT
label: My Label
selectList: my/namespace.myselectlist
`)

var field_select_local = trimYamlString(`
name: myfield
type: SELECT
label: My Label
selectList: myselectlist
`)

var field_select_missing_selectlist = trimYamlString(`
name: myfield
type: SELECT
label: My Label
`)

var field_number = trimYamlString(`
name: myfield
type: NUMBER
label: My Label
`)

var field_number_decimals = trimYamlString(`
name: myfield
type: NUMBER
label: My Label
number:
    decimals: 2
`)

var field_file = trimYamlString(`
name: myfield
type: FILE
label: My Label
`)

var field_file_accept = trimYamlString(`
name: myfield
type: FILE
label: My Label
file:
    accept: IMAGE
`)

var field_referencegroup = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
referenceGroup:
    collection: my/namespace.myothercollection
    field: my/namespace.somefield
    onDelete: CASCADE
`)

var field_referencegroup_local = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
referenceGroup:
    collection: myothercollection
    field: somefield
    onDelete: CASCADE
`)

var field_referencegroup_missing_node = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
`)

var field_referencegroup_empty_node = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
referenceGroup:
`)

var field_referencegroup_missing_collection = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
referenceGroup:
    field: my/namespace.somefield
    onDelete: CASCADE
`)

var field_referencegroup_missing_field = trimYamlString(`
name: myfield
type: REFERENCEGROUP
label: My Label
referenceGroup:
    collection: my/namespace.myothercollection
    onDelete: CASCADE
`)

func TestFieldUnmarshal(t *testing.T) {

	type testCase struct {
		name        string
		description string
		yamlString  string
		path        string
		namespace   string
		expected    *Field
		expectedErr error
	}

	var tests = []testCase{
		{
			"sanity",
			"",
			field_basic,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "TEXT",
				Label:         "My Label",
			},
			nil,
		},
		{
			"invalid type",
			"",
			field_invalid_type,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("Invalid Field Type for Field: my/namespace.mycollection:my/namespace.myfield : TACO"),
		},
		{
			"reference",
			"",
			field_reference,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCE",
				Label:         "My Label",
				ReferenceMetadata: &ReferenceMetadata{
					Collection: "my/namespace.myothercollection",
					Namespace:  "my/namespace",
				},
			},
			nil,
		},
		{
			"reference local collection",
			"",
			field_reference_local_collection,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCE",
				Label:         "My Label",
				ReferenceMetadata: &ReferenceMetadata{
					Collection: "my/namespace.myothercollection",
					Namespace:  "my/namespace",
				},
			},
			nil,
		},
		{
			"reference missing reference node",
			"",
			field_reference_missing_node,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("no reference metadata property provided"),
		},
		{
			"reference missing empty node",
			"",
			field_reference_empty_node,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("reference metadata property is empty"),
		},
		{
			"reference missing collection",
			"",
			field_reference_missing_collection,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("property collection is required"),
		},
		{
			"select",
			"",
			field_select,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "SELECT",
				Label:         "My Label",
				SelectList:    "my/namespace.myselectlist",
			},
			nil,
		},
		{
			"select local",
			"",
			field_select_local,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "SELECT",
				Label:         "My Label",
				SelectList:    "my/namespace.myselectlist",
			},
			nil,
		},
		{
			"select missing selectlist",
			"",
			field_select_missing_selectlist,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("Invalid selectlist metadata provided for field: my/namespace.mycollection:my/namespace.myfield : Missing select list name"),
		},
		{
			"number",
			"",
			field_number,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef:  "my/namespace.mycollection",
				Type:           "NUMBER",
				Label:          "My Label",
				NumberMetadata: &NumberMetadata{},
			},
			nil,
		},
		{
			"number decimals",
			"",
			field_number_decimals,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "NUMBER",
				Label:         "My Label",
				NumberMetadata: &NumberMetadata{
					Decimals: 2,
				},
			},
			nil,
		},
		{
			"file",
			"",
			field_file,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "FILE",
				Label:         "My Label",
				FileMetadata: &FileMetadata{
					FileSource: "uesio/core.platform",
					Namespace:  "my/namespace",
				},
			},
			nil,
		},
		{
			"file accept image",
			"",
			field_file_accept,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "FILE",
				Label:         "My Label",
				FileMetadata: &FileMetadata{
					FileSource: "uesio/core.platform",
					Namespace:  "my/namespace",
					Accept:     "IMAGE",
				},
			},
			nil,
		},
		{
			"referencegroup",
			"",
			field_referencegroup,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCEGROUP",
				Label:         "My Label",
				ReferenceGroupMetadata: &ReferenceGroupMetadata{
					Collection: "my/namespace.myothercollection",
					Field:      "my/namespace.somefield",
					OnDelete:   "CASCADE",
					Namespace:  "my/namespace",
				},
			},
			nil,
		},
		{
			"referencegroup local collection",
			"",
			field_referencegroup_local,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCEGROUP",
				Label:         "My Label",
				ReferenceGroupMetadata: &ReferenceGroupMetadata{
					Collection: "my/namespace.myothercollection",
					Field:      "my/namespace.somefield",
					OnDelete:   "CASCADE",
					Namespace:  "my/namespace",
				},
			},
			nil,
		},
		{
			"referencegroup missing reference node",
			"",
			field_referencegroup_missing_node,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("no reference group metadata property provided"),
		},
		{
			"referencegroup missing empty node",
			"",
			field_referencegroup_empty_node,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("reference group metadata property is empty"),
		},
		{
			"referencegroup missing collection",
			"",
			field_referencegroup_missing_collection,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("property collection is required"),
		},
		{
			"referencegroup missing field",
			"",
			field_referencegroup_missing_field,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			nil,
			errors.New("property field is required"),
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			initial := (&FieldCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if tc.expectedErr != nil {
				assert.Equal(t, tc.expectedErr, err)
				return
			}
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}
			assert.Equal(t, initial, tc.expected)
		})
	}
}

func TestFieldMarshal(t *testing.T) {

	type testCase struct {
		name              string
		description       string
		initial           *Field
		expectedString    string
		expectedPath      string
		expectedNamespace string
	}

	var tests = []testCase{
		{
			"basic text field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "TEXT",
				Label:         "My Label",
			},
			field_basic,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"reference field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCE",
				Label:         "My Label",
				ReferenceMetadata: &ReferenceMetadata{
					Collection: "my/namespace.myothercollection",
				},
			},
			field_reference_local_collection,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"select field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "SELECT",
				Label:         "My Label",
				SelectList:    "my/namespace.myselectlist",
			},
			field_select_local,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"number field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef:  "my/namespace.mycollection",
				Type:           "NUMBER",
				Label:          "My Label",
				NumberMetadata: &NumberMetadata{},
			},
			field_number,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"number field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "NUMBER",
				Label:         "My Label",
				NumberMetadata: &NumberMetadata{
					Decimals: 2,
				},
			},
			field_number_decimals,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"file field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "FILE",
				Label:         "My Label",
				FileMetadata:  &FileMetadata{},
			},
			field_file,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"file field accept image",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "FILE",
				Label:         "My Label",
				FileMetadata: &FileMetadata{
					Accept: "IMAGE",
				},
			},
			field_file_accept,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
		{
			"reference group field",
			"",
			&Field{
				BundleableBase: BundleableBase{
					Name:      "myfield",
					Namespace: "my/namespace",
				},
				CollectionRef: "my/namespace.mycollection",
				Type:          "REFERENCEGROUP",
				Label:         "My Label",
				ReferenceGroupMetadata: &ReferenceGroupMetadata{
					Collection: "my/namespace.myothercollection",
					Field:      "my/namespace.somefield",
					OnDelete:   "CASCADE",
				},
			},
			field_referencegroup_local,
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {

			result, err := yaml.Marshal(tc.initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.expectedString, string(result))
			assert.Equal(t, tc.expectedPath, tc.initial.GetPath())
			assert.Equal(t, tc.expectedNamespace, tc.initial.GetNamespace())
		})
	}

}

func TestFieldRoundTrip(t *testing.T) {
	type testCase struct {
		name        string
		description string
		path        string
		namespace   string
		yamlString  string
	}

	var tests = []testCase{
		{
			"roundtrip text field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_basic,
		},
		{
			"roundtrip select field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_select_local,
		},
		{
			"roundtrip reference field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_reference_local_collection,
		},
		{
			"roundtrip number field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_number,
		},
		{
			"roundtrip number decimals field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_number_decimals,
		},
		{
			"roundtrip file field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_file,
		},
		{
			"roundtrip file accept field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_file_accept,
		},
		{
			"roundtrip reference group field",
			"",
			"my/namespace/mycollection/myfield.yaml",
			"my/namespace",
			field_referencegroup_local,
		},
	}

	for _, tc := range tests {
		t.Run("it should "+tc.description, func(t *testing.T) {
			initial := (&FieldCollection{}).GetItemFromPath(tc.path, tc.namespace)
			err := yaml.Unmarshal([]byte(tc.yamlString), initial)
			if err != nil {
				t.Errorf("Unexpected failure unmarshalling: %s", err.Error())
			}

			result, err := yaml.Marshal(initial)
			if err != nil {
				t.Errorf("Unexpected failure marshalling: %s", err.Error())
			}
			assert.Equal(t, tc.yamlString, string(result))
		})
	}
}
