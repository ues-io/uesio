package meta

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/humandad/yaml"
)

// NewField function
func NewField(collectionKey, fieldKey string) (*Field, error) {
	namespace, name, err := ParseKey(fieldKey)
	if err != nil {
		return nil, errors.New("Bad Key for Field: " + collectionKey + " : " + fieldKey)
	}
	return &Field{
		Name:          name,
		Namespace:     namespace,
		CollectionRef: collectionKey,
	}, nil
}

//ValidationMetadata struct
type ValidationMetadata struct {
	Type  string `json:"type" yaml:"type,omitempty" uesio:"studio.type"`
	Regex string `json:"regex" yaml:"regex,omitempty" uesio:"studio.regex"`
}

// SubField struct
type SubField struct {
	Name       string `yaml:"name,omitempty" uesio:"studio.name"`
	Label      string `yaml:"label,omitempty" uesio:"studio.label"`
	Type       string `yaml:"type,omitempty" uesio:"studio.type"`
	SelectList string `yaml:"selectList,omitempty" uesio:"studio.selectlist"`
}

// NumberMetadata struct
type NumberMetadata struct {
	Decimals int `json:"decimals" uesio:"studio.decimals"`
}

// FileMetadata type
type FileMetadata struct {
	Accept         string `json:"accept" yaml:"accept,omitempty" uesio:"studio.accept"`
	FileCollection string `json:"filecollection" yaml:"filecollection,omitempty" uesio:"studio.filecollection"`
}

// ReferenceMetadata type
type ReferenceMetadata struct {
	Collection string `json:"collection" yaml:"collection,omitempty" uesio:"studio.collection"`
}

// ReferenceMetadata type
type ReferenceGroupMetadata struct {
	Collection string `json:"collection" yaml:"collection,omitempty" uesio:"studio.collection"`
	Field      string `json:"field" yaml:"field,omitempty" uesio:"studio.field"`
	OnDelete   string `json:"onDelete" yaml:"onDelete,omitempty" uesio:"studio.ondelete"`
}

// AutoNumberMetadata struct
type AutoNumberMetadata struct {
	Prefix       string `json:"prefix" yaml:"prefix,omitempty" uesio:"studio.prefix"`
	LeadingZeros int    `json:"leadingZeros" yaml:"leadingZeros,omitempty" uesio:"studio.leadingzeros"`
}

// FormulaMetadata struct
type FormulaMetadata struct {
	Expression string `json:"expression" yaml:"expression,omitempty" uesio:"studio.expression"`
	ReturnType string `json:"returntype" yaml:"returntype,omitempty" uesio:"studio.returntype"`
}

// Field struct
type Field struct {
	ID                     string                  `yaml:"-" uesio:"uesio.id"`
	Name                   string                  `yaml:"name" uesio:"studio.name"`
	CollectionRef          string                  `yaml:"collection" uesio:"studio.collection"`
	Namespace              string                  `yaml:"-" uesio:"-"`
	Type                   string                  `yaml:"type" uesio:"studio.type"`
	Label                  string                  `yaml:"label" uesio:"studio.label"`
	ReadOnly               bool                    `yaml:"readOnly,omitempty" uesio:"studio.readonly"`
	CreateOnly             bool                    `yaml:"createOnly,omitempty" uesio:"studio.createonly"`
	SelectList             string                  `yaml:"selectList,omitempty" uesio:"studio.selectlist"`
	Workspace              *Workspace              `yaml:"-" uesio:"studio.workspace"`
	Required               bool                    `yaml:"required,omitempty" uesio:"studio.required"`
	NumberMetadata         *NumberMetadata         `yaml:"number,omitempty" uesio:"studio.number"`
	FileMetadata           *FileMetadata           `yaml:"file,omitempty" uesio:"studio.file"`
	ReferenceMetadata      *ReferenceMetadata      `yaml:"reference,omitempty" uesio:"studio.reference"`
	ReferenceGroupMetadata *ReferenceGroupMetadata `yaml:"referenceGroup,omitempty" uesio:"studio.referencegroup"`
	ValidationMetadata     *ValidationMetadata     `yaml:"validate,omitempty" uesio:"studio.validate"`
	AutoNumberMetadata     *AutoNumberMetadata     `yaml:"autonumber,omitempty" uesio:"studio.autonumber"`
	FormulaMetadata        *FormulaMetadata        `yaml:"formula,omitempty" uesio:"studio.formula"`
	AutoPopulate           string                  `yaml:"autopopulate,omitempty" uesio:"studio.autopopulate"`
	itemMeta               *ItemMeta               `yaml:"-" uesio:"-"`
	CreatedBy              *User                   `yaml:"-" uesio:"uesio.createdby"`
	Owner                  *User                   `yaml:"-" uesio:"uesio.owner"`
	UpdatedBy              *User                   `yaml:"-" uesio:"uesio.updatedby"`
	UpdatedAt              int64                   `yaml:"-" uesio:"uesio.updatedat"`
	CreatedAt              int64                   `yaml:"-" uesio:"uesio.createdat"`
	SubFields              []SubField              `yaml:"subfields,omitempty" uesio:"studio.subfields"`
	SubType                string                  `yaml:"subtype,omitempty" uesio:"studio.subtype"`
	LanguageLabel          string                  `yaml:"languageLabel,omitempty" uesio:"studio.languagelabel"`
	ColumnName             string                  `yaml:"columnname,omitempty" uesio:"studio.columnname"`
}

// GetFieldTypes function
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
	}
}

// GetCollectionName function
func (f *Field) GetCollectionName() string {
	return f.GetBundleGroup().GetName()
}

// GetCollection function
func (f *Field) GetCollection() CollectionableGroup {
	var fc FieldCollection
	return &fc
}

func (f *Field) GetDBID(workspace string) string {
	return fmt.Sprintf("%s_%s_%s", workspace, f.CollectionRef, f.Name)
}

// GetBundleGroup function
func (f *Field) GetBundleGroup() BundleableGroup {
	var fc FieldCollection
	return &fc
}

// GetKey function
func (f *Field) GetKey() string {
	return filepath.Join(f.CollectionRef, f.Namespace+"."+f.Name)
}

// GetPath function
func (f *Field) GetPath() string {
	return f.GetKey() + ".yaml"
}

// GetPermChecker function
func (f *Field) GetPermChecker() *PermissionSet {
	return nil
}

// SetField function
func (f *Field) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(f, fieldName, value)
}

// GetField function
func (f *Field) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(f, fieldName)
}

// GetNamespace function
func (f *Field) GetNamespace() string {
	return f.Namespace
}

// SetNamespace function
func (f *Field) SetNamespace(namespace string) {
	f.Namespace = namespace
}

// SetWorkspace function
func (f *Field) SetWorkspace(workspace string) {
	f.Workspace = &Workspace{
		ID: workspace,
	}
}

// Loop function
func (f *Field) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(f, iter)
}

// Len function
func (f *Field) Len() int {
	return StandardItemLen(f)
}

// GetItemMeta function
func (f *Field) GetItemMeta() *ItemMeta {
	return f.itemMeta
}

// SetItemMeta function
func (f *Field) SetItemMeta(itemMeta *ItemMeta) {
	f.itemMeta = itemMeta
}

func (f *Field) UnmarshalYAML(node *yaml.Node) error {
	err := validateNodeName(node, f.Name)
	if err != nil {
		return err
	}
	fieldType := getNodeValueAsString(node, "type")
	_, ok := GetFieldTypes()[fieldType]
	if !ok {
		return errors.New("Invalid Field Type for Field: " + f.GetKey() + " : " + fieldType)
	}
	collection := getNodeValueAsString(node, "collection")
	if f.CollectionRef != collection {
		return errors.New("Invalid Collection Value for Field: " + f.GetKey() + " : " + collection)
	}
	if fieldType == "REFERENCE" {
		err := validateReferenceField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	if fieldType == "SELECT" {
		err := validateSelectListField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	if fieldType == "NUMBER" {
		err := validateNumberField(node, f.GetKey())
		if err != nil {
			return err
		}
	}

	if fieldType == "FILE" {
		err := validateFileField(node, f.GetKey())
		if err != nil {
			return err
		}
	}
	return node.Decode(f)
}

func validateFileField(node *yaml.Node, fieldKey string) error {
	fileNode, err := getOrCreateMapNode(node, "file")
	if err != nil {
		return fmt.Errorf("Invalid File metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	return setDefaultValue(fileNode, "filecollection", "uesio.platform")
}

func validateNumberField(node *yaml.Node, fieldKey string) error {
	numberNode, err := getMapNode(node, "number")
	if err != nil {
		return fmt.Errorf("Invalid Number metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	decimals := getNodeValueAsString(numberNode, "decimals")
	if decimals == "" {
		return fmt.Errorf("Invalid Number metadata provided for field: " + fieldKey + " : No decimals value provided")
	}
	return nil
}

func validateSelectListField(node *yaml.Node, fieldKey string) error {
	selectListName := getNodeValueAsString(node, "selectList")
	if selectListName == "" {
		return fmt.Errorf("Invalid selectlist metadata provided for field: " + fieldKey + " : Missing select list name")
	}
	return nil
}

func validateReferenceField(node *yaml.Node, fieldKey string) error {
	referenceNode, err := getMapNode(node, "reference")
	if err != nil {
		return fmt.Errorf("Invalid Reference metadata provided for field: " + fieldKey + " : " + err.Error())
	}
	referencedCollection := getNodeValueAsString(referenceNode, "collection")
	if referencedCollection == "" {
		return fmt.Errorf("Invalid Reference metadata provided for field: " + fieldKey + " : No collection provided")
	}
	return nil
}

// IsPublic function
func (c *Field) IsPublic() bool {
	return true
}
