package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

// MetadataCache type
type MetadataCache struct {
	Collections map[string]*CollectionMetadata
	SelectLists map[string]*SelectListMetadata
}

// AddCollection function
func (mc *MetadataCache) AddCollection(key string, metadata *CollectionMetadata) {
	if mc.Collections == nil {
		mc.Collections = map[string]*CollectionMetadata{}
	}
	mc.Collections[key] = metadata
}

// GetCollection function
func (mc *MetadataCache) GetCollection(key string) (*CollectionMetadata, error) {
	collectionMetadata, ok := mc.Collections[key]
	if !ok {
		return nil, errors.New("No metadata provided for collection: " + key)
	}
	return collectionMetadata, nil
}

// SelectListOptionMetadata type
type SelectListOptionMetadata struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// SelectListMetadata type
type SelectListMetadata struct {
	Name    string
	Options []SelectListOptionMetadata
}

// CollectionMetadata struct
type CollectionMetadata struct {
	Name                  string                                 `json:"name"`
	Namespace             string                                 `json:"namespace"`
	IDField               string                                 `json:"idField"`
	IDFormat              string                                 `json:"-"`
	NameField             string                                 `json:"nameField"`
	Createable            bool                                   `json:"createable"`
	Accessible            bool                                   `json:"accessible"`
	Updateable            bool                                   `json:"updateable"`
	Deleteable            bool                                   `json:"deleteable"`
	Fields                map[string]*FieldMetadata              `json:"fields"`
	CollectionName        string                                 `json:"-"`
	DataSource            string                                 `json:"-"`
	Access                string                                 `json:"-"`
	UserResponseTokens    []*meta.UserResponseTokenDefinition    `json:"-"`
	RecordChallengeTokens []*meta.RecordChallengeTokenDefinition `json:"-"`
}

// GetField function
func (cm *CollectionMetadata) GetField(key string) (*FieldMetadata, error) {
	fieldMetadata, ok := cm.Fields[key]
	if !ok {
		return nil, errors.New("No metadata provided for field: " + key + " in collection: " + cm.Name)
	}
	return fieldMetadata, nil
}

func (cm *CollectionMetadata) SetField(metadata *FieldMetadata) {
	cm.Fields[metadata.GetFullName()] = metadata
}

// GetNameField function
func (cm *CollectionMetadata) GetNameField() (*FieldMetadata, error) {
	return cm.GetField(cm.NameField)
}

// GetIDField function
func (cm *CollectionMetadata) GetIDField() (*FieldMetadata, error) {
	return cm.GetField(cm.IDField)
}

// GetFullName function
func (cm *CollectionMetadata) GetFullName() string {
	return cm.Namespace + "." + cm.Name
}

// ValidationMetadata struct
type ValidationMetadata struct {
	Type  string `json:"type"`
	Regex string `json:"regex"`
}

// SubField struct
type SubField struct {
	Name string `json:"name"`
}

// FieldMetadata struct
type FieldMetadata struct {
	Name                 string                     `json:"name"`
	Namespace            string                     `json:"namespace"`
	Createable           bool                       `json:"createable"`
	Accessible           bool                       `json:"accessible"`
	Updateable           bool                       `json:"updateable"`
	Type                 string                     `json:"type"`
	Label                string                     `json:"label"`
	PropertyName         string                     `json:"-"`
	SelectListOptions    []SelectListOptionMetadata `json:"options"`
	SelectListName       string                     `json:"-"`
	ReferencedCollection string                     `json:"referencedCollection"`
	Required             bool                       `json:"required"`
	Validate             *ValidationMetadata        `json:"validate"`
	AutoPopulate         string                     `json:"autopopulate"`
	OnDelete             string                     `json:"ondelete"`
	FileCollection       string                     `json:"fileCollection"`
	SubFields            []SubField                 `json:"subfields"`
	SubType              string                     `json:"subtype"`
}

// GetFullName function
func (fm *FieldMetadata) GetFullName() string {
	return fm.Namespace + "." + fm.Name
}
