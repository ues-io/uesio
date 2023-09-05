package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

func NewField(collectionKey, fieldKey string) (*Field, error) {
	namespace, name, err := ParseKey(fieldKey)
	if err != nil {
		return nil, errors.New("Bad Key for Field: " + collectionKey + " : " + fieldKey)
	}
	return NewBaseField(collectionKey, namespace, name), nil
}

func NewBaseField(collectionKey, namespace, name string) *Field {
	return &Field{
		BundleableBase: NewBase(namespace, name),
		CollectionRef:  collectionKey,
	}
}

func NewFields(keys map[string]bool, collectionKey string) ([]BundleableItem, error) {
	items := []BundleableItem{}

	for key := range keys {
		newField, err := NewField(collectionKey, key)
		if err != nil {
			return nil, err
		}
		items = append(items, newField)
	}

	return items, nil
}

type Field struct {
	BuiltIn                `yaml:",inline"`
	BundleableBase         `yaml:",inline"`
	CollectionRef          string                  `yaml:"-" json:"uesio/studio.collection"`
	Type                   string                  `yaml:"type" json:"uesio/studio.type"`
	Label                  string                  `yaml:"label" json:"uesio/studio.label"`
	ReadOnly               bool                    `yaml:"readOnly,omitempty" json:"uesio/studio.readonly"`
	CreateOnly             bool                    `yaml:"createOnly,omitempty" json:"uesio/studio.createonly"`
	SelectList             string                  `yaml:"selectList,omitempty" json:"uesio/studio.selectlist"`
	Required               bool                    `yaml:"required,omitempty" json:"uesio/studio.required"`
	NumberMetadata         *NumberMetadata         `yaml:"number,omitempty" json:"uesio/studio.number"`
	FileMetadata           *FileMetadata           `yaml:"file,omitempty" json:"uesio/studio.file"`
	ReferenceMetadata      *ReferenceMetadata      `yaml:"reference,omitempty" json:"uesio/studio.reference"`
	ReferenceGroupMetadata *ReferenceGroupMetadata `yaml:"referenceGroup,omitempty" json:"uesio/studio.referencegroup"`
	ValidationMetadata     *ValidationMetadata     `yaml:"validate,omitempty" json:"uesio/studio.validate"`
	AutoNumberMetadata     *AutoNumberMetadata     `yaml:"autonumber,omitempty" json:"uesio/studio.autonumber"`
	FormulaMetadata        *FormulaMetadata        `yaml:"formula,omitempty" json:"uesio/studio.formula"`
	AutoPopulate           string                  `yaml:"autopopulate,omitempty" json:"uesio/studio.autopopulate"`
	SubFields              []SubField              `yaml:"subfields,omitempty" json:"uesio/studio.subfields"`
	SubType                string                  `yaml:"subtype,omitempty" json:"uesio/studio.subtype"`
	LanguageLabel          string                  `yaml:"languageLabel,omitempty" json:"uesio/studio.languagelabel"`
	ColumnName             string                  `yaml:"columnname,omitempty" json:"uesio/studio.columnname"`
	ValidFor               string                  `yaml:"validFor,omitempty" json:"uesio/studio.validfor"`
}

type FieldWrapper Field

func GetFieldTypes() map[string]bool {
	return map[string]bool{
		"TEXT":           true,
		"NUMBER":         true,
		"LONGTEXT":       true,
		"CHECKBOX":       true,
		"MULTISELECT":    true,
		"SELECT":         true,
		"REFERENCE":      true,
		"FILE":           true,
		"USER":           true,
		"LIST":           true,
		"DATE":           true,
		"MAP":            true,
		"TIMESTAMP":      true,
		"EMAIL":          true,
		"AUTONUMBER":     true,
		"REFERENCEGROUP": true,
		"FORMULA":        true,
		"STRUCT":         true,
	}
}

func (f *Field) GetCollectionName() string {
	return FIELD_COLLECTION_NAME
}

func (f *Field) GetBundleFolderName() string {
	return FIELD_FOLDER_NAME
}

func (f *Field) GetDBID(workspace string) string {
	return fmt.Sprintf("%s:%s:%s", workspace, f.CollectionRef, f.Name)
}

func (f *Field) GetKey() string {
	return fmt.Sprintf("%s:%s.%s", f.CollectionRef, f.Namespace, f.Name)
}

func (f *Field) GetPath() string {
	collectionNamespace, collectionName, _ := ParseKey(f.CollectionRef)
	nsUser, appName, _ := ParseNamespace(collectionNamespace)
	return filepath.Join(nsUser, appName, collectionName, f.Name) + ".yaml"
}

func (f *Field) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(f, fieldName, value)
}

func (f *Field) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(f, fieldName)
}

func (f *Field) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

func (f *Field) Len() int {
	return StandardItemLen(f)
}

func (f *Field) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	fieldType := pickStringProperty(node, "type", "")
	f.Type = fieldType

	_, ok := GetFieldTypes()[fieldType]
	if !ok {
		return errors.New("Invalid Field Type for Field: " + f.GetKey() + " : " + fieldType)
	}
	if f.CollectionRef == "" {
		return errors.New("Invalid Collection Value for Field: " + f.GetKey())
	}

	if fieldType == "REFERENCE" {
		f.ReferenceMetadata = &ReferenceMetadata{
			Namespace: f.Namespace,
		}
		referenceNode := pickNodeFromMap(node, "reference")
		if referenceNode == nil {
			return errors.New("no reference metadata property provided")
		}
		// It's unfortunate that we have to do this check, but golang's YAML
		// library doesn't call the custom unmarshaler if the node is a null scalar.
		if nodeIsNull(referenceNode) {
			return errors.New("reference metadata property is empty")
		}
		err := referenceNode.Decode(f.ReferenceMetadata)
		if err != nil {
			return err
		}
	}

	if fieldType == "REFERENCEGROUP" {
		f.ReferenceGroupMetadata = &ReferenceGroupMetadata{
			Namespace: f.Namespace,
		}
		referenceGroupNode := pickNodeFromMap(node, "referenceGroup")
		if referenceGroupNode == nil {
			return errors.New("no reference group metadata property provided")
		}
		// It's unfortunate that we have to do this check, but golang's YAML
		// library doesn't call the custom unmarshaler if the node is a null scalar.
		if nodeIsNull(referenceGroupNode) {
			return errors.New("reference group metadata property is empty")
		}
		err := referenceGroupNode.Decode(f.ReferenceGroupMetadata)
		if err != nil {
			return err
		}
	}

	if fieldType == "SELECT" || fieldType == "MULTISELECT" {
		f.SelectList, err = pickRequiredMetadataItem(node, "selectList", f.Namespace)
		if err != nil {
			return fmt.Errorf("Invalid selectlist metadata provided for field: " + f.GetKey() + " : Missing select list name")
		}
	}

	if fieldType == "NUMBER" {
		f.NumberMetadata = &NumberMetadata{}
	}

	if fieldType == "FILE" {
		f.FileMetadata = &FileMetadata{
			FileSource: "uesio/core.platform",
			Namespace:  f.Namespace,
		}
	}

	return node.Decode((*FieldWrapper)(f))
}

func (f *Field) MarshalYAML() (interface{}, error) {

	// We have to pass our namespace down to our childen so they
	// can propery localize their references to other metadata items
	if f.ReferenceMetadata != nil {
		f.ReferenceMetadata.Namespace = f.Namespace
	}

	if f.FileMetadata != nil {
		f.FileMetadata.Namespace = f.Namespace
	}

	if f.ReferenceGroupMetadata != nil {
		f.ReferenceGroupMetadata.Namespace = f.Namespace
	}

	f.SelectList = localize(f.SelectList, f.Namespace)

	return (*FieldWrapper)(f), nil
}

func (c *Field) IsPublic() bool {
	return true
}
