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
	DataSource            string                                 `json:"-"`
	Access                string                                 `json:"-"`
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

// SelectListMetadata type
type SelectListMetadata struct {
	Name    string                  `json:"name"`
	Options []meta.SelectListOption `json:"options"`
}

// FieldMetadata struct
type FieldMetadata struct {
	Name               string                   `json:"name"`
	Namespace          string                   `json:"namespace"`
	Createable         bool                     `json:"createable"`
	Accessible         bool                     `json:"accessible"`
	Updateable         bool                     `json:"updateable"`
	Required           bool                     `json:"required"`
	Length             int                      `json:"length"`
	Type               string                   `json:"type"`
	Label              string                   `json:"label"`
	SelectListMetadata *SelectListMetadata      `json:"selectlist,omitempty"`
	NumberMetadata     *meta.NumberMetadata     `json:"number,omitempty"`
	ReferenceMetadata  *meta.ReferenceMetadata  `json:"reference,omitempty"`
	FileMetadata       *meta.FileMetadata       `json:"file,omitempty"`
	ValidationMetadata *meta.ValidationMetadata `json:"validate,omitempty"`
	AutoPopulate       string                   `json:"autopopulate,omitempty"`
	SubFields          []meta.SubField          `json:"subfields,omitempty"`
	SubType            string                   `json:"subtype,omitempty"`
}

// GetFullName function
func (fm *FieldMetadata) GetFullName() string {
	return fm.Namespace + "." + fm.Name
}
