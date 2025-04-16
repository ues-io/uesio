package wire

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type MetadataCache struct {
	Collections map[string]*CollectionMetadata
	selectLists map[string]*SelectListMetadata
}

func (mc *MetadataCache) AddCollection(key string, metadata *CollectionMetadata) {
	if mc.Collections == nil {
		mc.Collections = map[string]*CollectionMetadata{}
	}
	mc.Collections[key] = metadata
}

func (mc *MetadataCache) GetCollection(key string) (*CollectionMetadata, error) {
	collectionMetadata, ok := mc.Collections[key]
	if !ok {
		return nil, errors.New("No metadata provided for collection: " + key)
	}
	return collectionMetadata, nil
}

func (mc *MetadataCache) AddSelectList(key string, metadata *SelectListMetadata) {
	if mc.selectLists == nil {
		mc.selectLists = map[string]*SelectListMetadata{}
	}
	mc.selectLists[key] = metadata
}

func (mc *MetadataCache) GetSelectList(key string) (*SelectListMetadata, error) {
	selectListMetadata, ok := mc.selectLists[key]
	if !ok {
		return nil, errors.New("No metadata found for select list: " + key)
	}
	return selectListMetadata, nil
}

func (mc *MetadataCache) LoopSelectLists(iter func(key string, metadata *SelectListMetadata)) {
	if mc.selectLists != nil {
		for key, md := range mc.selectLists {
			iter(key, md)
		}
	}
}

func (mc *MetadataCache) GetSelectLists() map[string]*SelectListMetadata {
	return mc.selectLists
}

func NewCollectionMetadata(e *meta.Collection) *CollectionMetadata {
	return &CollectionMetadata{
		Name:        e.Name,
		Namespace:   e.Namespace,
		Type:        e.Type,
		Icon:        e.Icon,
		NameField:   getNameField(e),
		UniqueKey:   e.UniqueKeyFields,
		Createable:  !e.ReadOnly,
		Accessible:  true,
		Updateable:  !e.ReadOnly,
		Deleteable:  !e.ReadOnly,
		Fields:      map[string]*FieldMetadata{},
		Access:      e.Access,
		AccessField: e.AccessField,
		TableName:   e.TableName,
		Public:      e.Public,
		Label:       e.Label,
		PluralLabel: e.PluralLabel,
		Integration: e.IntegrationRef,
		LoadBot:     e.LoadBot,
		SaveBot:     e.SaveBot,
	}
}

func getNameField(c *meta.Collection) string {
	if c.NameField != "" {
		return c.NameField
	}
	return commonfields.Id
}

type CollectionMetadata struct {
	Name                  string                       `json:"name"`
	Namespace             string                       `json:"namespace"`
	Type                  string                       `json:"-"`
	Icon                  string                       `json:"icon"`
	UniqueKey             []string                     `json:"uniqueKey"`
	NameField             string                       `json:"nameField"`
	IdField               string                       `json:"-"`
	Createable            bool                         `json:"createable"`
	Accessible            bool                         `json:"accessible"`
	Updateable            bool                         `json:"updateable"`
	Deleteable            bool                         `json:"deleteable"`
	Fields                map[string]*FieldMetadata    `json:"fields"`
	Access                string                       `json:"-"`
	AccessField           string                       `json:"-"`
	RecordChallengeTokens []*meta.RecordChallengeToken `json:"-"`
	TableName             string                       `json:"-"`
	Public                bool                         `json:"public"`
	HasAllFields          bool                         `json:"hasAllFields"`
	Label                 string                       `json:"label"`
	PluralLabel           string                       `json:"pluralLabel"`
	Integration           string                       `json:"-"`
	LoadBot               string                       `json:"-"`
	SaveBot               string                       `json:"-"`
}

func (cm *CollectionMetadata) GetIntegrationName() string {
	integrationName := cm.Integration
	if integrationName == "" {
		return meta.PLATFORM_DATA_SOURCE
	}
	return integrationName
}

func (cm *CollectionMetadata) GetExternalFieldMap() map[string]*FieldMetadata {
	externalMap := map[string]*FieldMetadata{}
	for _, field := range cm.Fields {
		externalFieldName := field.GetExternalFieldName()
		if externalFieldName != "" {
			externalMap[externalFieldName] = field
		}
	}
	return externalMap
}

func (cm *CollectionMetadata) IsDynamic() bool {
	return cm.Type == "DYNAMIC" || meta.IsBundleableCollection(cm.GetFullName())
}

func (cm *CollectionMetadata) IsWriteProtected() bool {
	return cm.Access == "protected" || cm.Access == "protected_write"
}

func (cm *CollectionMetadata) IsReadProtected() bool {
	return cm.Access == "protected"
}

func (cm *CollectionMetadata) GetTableName() string {
	// For Uesio DB collections, all data is in one table: data
	if cm.Integration == "" {
		return "data"
	}
	// For external collections, the table name should be defined in TableName
	return cm.TableName
}

func (cm *CollectionMetadata) GetBytes() ([]byte, error) {
	return json.Marshal(cm)
}

// GetKey satisfies the Depable interface
func (cm *CollectionMetadata) GetKey() string {
	return cm.GetFullName()
}

func (cm *CollectionMetadata) GetField(key string) (*FieldMetadata, error) {
	return cm.GetFieldWithMetadata(key, nil)
}

func (cm *CollectionMetadata) GetFieldWithMetadata(key string, metadata *MetadataCache) (*FieldMetadata, error) {

	names := strings.Split(key, constant.RefSep)
	if len(names) == 1 {
		fieldMetadata, ok := cm.Fields[meta.GetFullyQualifiedKey(key, cm.Namespace)]
		if !ok {
			return nil, errors.New("No metadata provided for field: " + key + " in collection: " + cm.Name)
		}
		return fieldMetadata, nil
	}
	mainFieldName := names[0]

	fieldMetadata, err := cm.GetField(meta.GetFullyQualifiedKey(mainFieldName, cm.Namespace))
	if err != nil {
		return nil, errors.New("No metadata provided for field: " + key + " in collection: " + cm.Name)
	}

	if IsReference(fieldMetadata.Type) {
		if metadata == nil {
			return nil, errors.New("no metadata found for reference field: " + mainFieldName)
		}
		if refCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferenceMetadata.GetCollection()); err != nil {
			return nil, err
		} else {
			return refCollectionMetadata.GetFieldWithMetadata(strings.Join(names[1:], constant.RefSep), metadata)
		}
	} else if fieldMetadata.Type == "STRUCT" {
		// If it is a Struct, get the subfield by navigating through the field metadata recursively
		var subFieldMetadata *FieldMetadata
		for _, namePart := range names[1:] {
			if tmp, exists := fieldMetadata.SubFields[namePart]; !exists {
				return nil, fmt.Errorf("subfield '%s' doesn't exist on Struct field: '%s'.", namePart, mainFieldName)
			} else {
				subFieldMetadata = tmp
			}
		}
		return subFieldMetadata, nil
	}
	return fieldMetadata.GetSubField(strings.Join(names[1:], constant.RefSep))

}

func (cm *CollectionMetadata) SetField(metadata *FieldMetadata) {
	cm.Fields[metadata.GetFullName()] = metadata
}

func (cm *CollectionMetadata) GetIdFieldName() string {
	// For Uesio DB collections, the id field is always the common id field,
	// but for external collections, it can be customized.
	if cm.Integration != "" && cm.IdField != "" {
		return cm.IdField
	}
	return commonfields.Id
}

func (cm *CollectionMetadata) GetIdField() (*FieldMetadata, error) {
	return cm.GetField(cm.GetIdFieldName())
}

func (cm *CollectionMetadata) GetNameField() (*FieldMetadata, error) {
	return cm.GetField(cm.NameField)
}

func (cm *CollectionMetadata) GetFullName() string {
	return cm.Namespace + "." + cm.Name
}

func (cm *CollectionMetadata) Merge(other *CollectionMetadata) {
	otherHasFields := len(other.Fields) > 0
	// Shortcuts --- if either the current or the other indicates that it "HasAllFields",
	// then we will use its fields
	if cm.HasAllFields {
		return
	} else if other.HasAllFields && otherHasFields {
		cm.Fields = other.Fields
		cm.HasAllFields = true
		return
	}
	// If the other collection has no fields, there's nothing else to do
	if !otherHasFields {
		return
	}
	// If we have no fields but the other collection has fields, use its fields
	if len(cm.Fields) == 0 {
		cm.Fields = other.Fields
		return
	}
	// Otherwise, we need to do a merge, injecting all fields from other which we don't have already,
	// and doing a "deep" merge of any fields that we DO already have, to ensure we get subfields too
	MergeFieldMaps(cm.Fields, other.Fields)
}

type SelectListMetadata struct {
	// Name will sometimes be a fully-qualified key, e.g. "uesio/core.some_name",
	// e.g. when we are requesting Select Lists by name, e.g. in a View Only SELECT field,
	// but when we serialize it to send to the client,
	// both name and namespace will be populated as you would expect.
	Name                     string                  `yaml:"name,omitempty" json:"name"`
	Namespace                string                  `yaml:"namespace,omitempty" json:"namespace"`
	Options                  []meta.SelectListOption `yaml:"options,omitempty" json:"options"`
	BlankOptionLabel         string                  `yaml:"blank_option_label,omitempty" json:"blank_option_label"`
	BlankOptionLanguageLabel string                  `yaml:"blank_option_language_label,omitempty" json:"blank_option_language_label"`
}

func (m *SelectListMetadata) GetBytes() ([]byte, error) {
	return json.Marshal(m)
}

// GetKey satisfies the Depable interface
func (m *SelectListMetadata) GetKey() string {
	// Name will sometimes be a fully-qualified key, e.g. "uesio/core.some_name",
	// e.g. when we are requesting Select Lists by name, e.g. in a View Only SELECT field,
	// but when we serialize it to send to the client,
	// both name and namespace will be populated as you would expect.
	if m.Namespace != "" {
		return m.Namespace + "." + m.Name
	}
	return m.Name
}

type FileMetadata struct {
	Accept     string `json:"accept"`
	FileSource string `json:"filesource"`
}

type NumberMetadata struct {
	Decimals int `json:"decimals"`
}

type MetadataFieldMetadata struct {
	Type      string `json:"type"`
	Grouping  string `json:"grouping"`
	Namespace string `json:"namespace"`
}

type AutoNumberMetadata struct {
	Prefix       string `json:"prefix"`
	LeadingZeros int    `json:"leadingZeros"`
}

type ReferenceMetadata struct {
	Collection      string   `json:"collection"`
	MultiCollection bool     `json:"multiCollection"`
	CollectionsRefs []string `json:"collections"`
}

func (m *ReferenceMetadata) GetCollection() string {
	if m.MultiCollection {
		return constant.CommonCollection
	}
	return m.Collection
}

func (m *ReferenceMetadata) IsMultiCollection() bool {
	return m.MultiCollection
}

func (m *ReferenceMetadata) GetCollections() []string {
	return m.CollectionsRefs
}

type ReferenceGroupMetadata struct {
	Collection string `json:"collection"`
	Field      string `json:"field"`
	OnDelete   string `json:"onDelete"`
}

type ValidationMetadata struct {
	Type      string `json:"type"`
	Regex     string `json:"regex"`
	SchemaUri string `json:"schemaUri"`
}

type FormulaMetadata struct {
	Expression string `json:"expression"`
	ReturnType string `json:"returntype"`
}

type FieldMetadata struct {
	Name                   string                    `json:"name" bot:"name"`
	Namespace              string                    `json:"namespace" bot:"namespace"`
	Createable             bool                      `json:"createable" bot:"createable"`
	Accessible             bool                      `json:"accessible" bot:"accessible"`
	Updateable             bool                      `json:"updateable" bot:"updateable"`
	Required               bool                      `json:"required" bot:"required"`
	Length                 int                       `json:"length" bot:"length"`
	Type                   string                    `json:"type" bot:"type"`
	Label                  string                    `json:"label" bot:"label"`
	LanguageLabel          string                    `json:"languageLabel,omitempty"`
	SelectListMetadata     *SelectListMetadata       `json:"selectlist,omitempty"`
	NumberMetadata         *NumberMetadata           `json:"number,omitempty"`
	ReferenceMetadata      *ReferenceMetadata        `json:"reference,omitempty"`
	ReferenceGroupMetadata *ReferenceGroupMetadata   `json:"referencegroup,omitempty"`
	FileMetadata           *FileMetadata             `json:"file,omitempty"`
	ValidationMetadata     *ValidationMetadata       `json:"validate,omitempty"`
	AutoNumberMetadata     *AutoNumberMetadata       `json:"autonumber,omitempty"`
	MetadataFieldMetadata  *MetadataFieldMetadata    `json:"metadata,omitempty"`
	FormulaMetadata        *FormulaMetadata          `json:"-"`
	AutoPopulate           string                    `json:"autopopulate,omitempty"`
	SubFields              map[string]*FieldMetadata `json:"subfields,omitempty"`
	SubType                string                    `json:"subtype,omitempty"`
	ColumnName             string                    `json:"-" bot:"externalName"`
	IsFormula              bool                      `json:"-"`
}

func MergeFieldMaps(target, other map[string]*FieldMetadata) {
	for otherFieldId, otherFieldMetadata := range other {
		targetFieldMetadata, exists := target[otherFieldId]
		// Easy case --- if we don't have the field yet, just add it
		if !exists {
			target[otherFieldId] = otherFieldMetadata
		} else {
			// Do a deep (recursive) merge on sub-fields
			targetFieldMetadata.Merge(otherFieldMetadata)
		}
	}
}

// GetExternalFieldName returns the external field name for this Uesio field, if defined.
func (fm *FieldMetadata) GetExternalFieldName() string {
	return fm.ColumnName
}

// GetReferenceMetadata returns reference field metadata, if it exists
func (fm *FieldMetadata) GetReferenceMetadata() *ReferenceMetadata {
	return fm.ReferenceMetadata
}

// Merge performs a deep merge that extends our field metadata with the other's field metadata,
// mutating the original struct in place.
func (fm *FieldMetadata) Merge(other *FieldMetadata) {
	// Mainly we are just merging SubFields, everything else is assumed to be present in both already
	otherHasSubFields := len(other.SubFields) > 0
	// Case 1 --- other metadata has no subfields. We are done.
	if !otherHasSubFields {
		return
	}
	weHaveSubFields := len(fm.SubFields) > 0
	// Case 2 --- other has subfields, but we don't. Just grab other's subfields.
	if !weHaveSubFields {
		fm.SubFields = other.SubFields
		return
	}
	// Case 3 --- both have subfields. Do a recursive merge.
	MergeFieldMaps(fm.SubFields, other.SubFields)
}

func (fm *FieldMetadata) GetFullName() string {
	if fm.Namespace == "" {
		return fm.Name
	}
	return fm.Namespace + "." + fm.Name
}

func (fm *FieldMetadata) GetSubField(key string) (*FieldMetadata, error) {
	names := strings.Split(key, constant.RefSep)
	if len(names) == 1 {
		fieldMetadata, ok := fm.SubFields[key]
		if !ok {
			return nil, errors.New("No metadata provided for sub-field: " + key + " in collection: " + fm.Name)
		}
		return fieldMetadata, nil
	}

	fieldMetadata, err := fm.GetSubField(names[0])
	if err != nil {
		return nil, errors.New("No metadata provided for sub-field: " + key + " in collection: " + fm.Name)
	}

	return fieldMetadata.GetSubField(strings.Join(names[1:], constant.RefSep))

}
