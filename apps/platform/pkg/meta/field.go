package meta

import (
	"errors"
	"fmt"
	"path"

	"gopkg.in/yaml.v3"
)

func NewField(collectionKey, fieldKey string) (*Field, error) {
	namespace, name, err := ParseKey(fieldKey)
	if err != nil {
		return nil, fmt.Errorf("bad key for field: %s : %s", collectionKey, fieldKey)
	}
	return NewBaseField(collectionKey, namespace, name), nil
}

func NewBaseField(collectionKey, namespace, name string) *Field {
	return &Field{
		BundleableBase: NewBase(namespace, name),
		CollectionRef:  collectionKey,
	}
}

type Field struct {
	BuiltIn                `yaml:",inline"`
	BundleableBase         `yaml:",inline"`
	CollectionRef          string                  `yaml:"-" json:"uesio/studio.collection"`
	Type                   string                  `yaml:"type" json:"uesio/studio.type"`
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
	MetadataFieldMetadata  *MetadataFieldMetadata  `yaml:"metadata,omitempty" json:"uesio/studio.metadata"`
	AutoPopulate           string                  `yaml:"autopopulate,omitempty" json:"uesio/studio.autopopulate"`
	SubFields              []SubField              `yaml:"subfields,omitempty" json:"uesio/studio.subfields"`
	SubType                string                  `yaml:"subtype,omitempty" json:"uesio/studio.subtype"`
	LanguageLabel          string                  `yaml:"languageLabel,omitempty" json:"uesio/studio.languagelabel"`
	ColumnName             string                  `yaml:"columnname,omitempty" json:"uesio/studio.columnname"`
}

type FieldWrapper Field

func GetFieldTypes() map[string]bool {
	return map[string]bool{
		"ANY":            true,
		"AUTONUMBER":     true,
		"CHECKBOX":       true,
		"DATE":           true,
		"EMAIL":          true,
		"FILE":           true,
		"FORMULA":        true,
		"LIST":           true,
		"LONGTEXT":       true,
		"MAP":            true,
		"METADATA":       true,
		"MULTIMETADATA":  true,
		"MULTISELECT":    true,
		"NUMBER":         true,
		"REFERENCE":      true,
		"REFERENCEGROUP": true,
		"SELECT":         true,
		"STRUCT":         true,
		"TEXT":           true,
		"TIMESTAMP":      true,
		"USER":           true,
	}
}

func (f *Field) GetCollection() CollectionableGroup {
	return &FieldCollection{}
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
	return path.Join(nsUser, appName, collectionName, f.Name) + ".yaml"
}

func (f *Field) SetField(fieldName string, value any) error {
	return StandardFieldSet(f, fieldName, value)
}

func (f *Field) GetField(fieldName string) (any, error) {
	return StandardFieldGet(f, fieldName)
}

func (f *Field) Loop(iter func(string, any) error) error {
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
		return fmt.Errorf("invalid field type for field: %s : %s", f.GetKey(), fieldType)
	}
	if f.CollectionRef == "" {
		return fmt.Errorf("invalid collection value for field: %s", f.GetKey())
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
			return fmt.Errorf("invalid selectlist metadata provided for field: %s : missing select list name", f.GetKey())
		}
	}

	if fieldType == "NUMBER" {
		f.NumberMetadata = &NumberMetadata{}
	}

	if fieldType == "METADATA" || fieldType == "MULTIMETADATA" {
		f.MetadataFieldMetadata = &MetadataFieldMetadata{}
	}

	if fieldType == "FILE" {
		f.FileMetadata = &FileMetadata{
			FileSource: "uesio/core.platform",
			Namespace:  f.Namespace,
		}
	}

	if err = node.Decode((*FieldWrapper)(f)); err != nil {
		return err
	}

	f.LanguageLabel = GetFullyQualifiedKey(f.LanguageLabel, f.Namespace)

	return nil
}

func (f *Field) MarshalYAML() (any, error) {

	// We have to pass our namespace down to our children so that they
	// can properly localize their references to other metadata items
	if f.ReferenceMetadata != nil {
		f.ReferenceMetadata.Namespace = f.Namespace
	}

	if f.FileMetadata != nil {
		f.FileMetadata.Namespace = f.Namespace
	}

	if f.ReferenceGroupMetadata != nil {
		f.ReferenceGroupMetadata.Namespace = f.Namespace
	}

	f.SelectList = GetLocalizedKey(f.SelectList, f.Namespace)
	f.LanguageLabel = GetLocalizedKey(f.LanguageLabel, f.Namespace)

	return (*FieldWrapper)(f), nil
}

func (c *Field) IsPublic() bool {
	return true
}
