package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetCollectionMetadata function
func GetCollectionMetadata(e *meta.Collection) *adapt.CollectionMetadata {
	fieldMetadata := map[string]*adapt.FieldMetadata{}

	return &adapt.CollectionMetadata{
		Name:                  e.Name,
		Namespace:             e.Namespace,
		NameField:             GetNameField(e),
		UniqueKey:             e.UniqueKeyFields,
		Createable:            !e.ReadOnly,
		Accessible:            true,
		Updateable:            !e.ReadOnly,
		Deleteable:            !e.ReadOnly,
		Fields:                fieldMetadata,
		DataSource:            e.DataSourceRef,
		Access:                e.Access,
		AccessField:           e.AccessField,
		RecordChallengeTokens: e.RecordChallengeTokens,
		TableName:             e.TableName,
		Public:                e.Public,
	}
}

func GetNameField(c *meta.Collection) string {
	if c.NameField != "" {
		return c.NameField
	}
	return adapt.ID_FIELD
}

func GetFieldLabel(f *meta.Field, session *sess.Session) string {
	if f.LanguageLabel == "" {
		return f.Label
	}
	translation := session.GetLabel(f.LanguageLabel)
	if translation == "" {
		return f.Label
	}
	return translation
}

// GetFieldMetadata function
func GetFieldMetadata(f *meta.Field, session *sess.Session) *adapt.FieldMetadata {
	return &adapt.FieldMetadata{
		Name:                   f.Name,
		Namespace:              f.Namespace,
		Createable:             !f.ReadOnly && f.Type != "AUTONUMBER",
		Accessible:             true,
		Updateable:             GetUpdateable(f),
		Type:                   GetType(f),
		IsFormula:              f.Type == "FORMULA",
		Label:                  GetFieldLabel(f, session),
		ReferenceMetadata:      f.ReferenceMetadata,
		ReferenceGroupMetadata: f.ReferenceGroupMetadata,
		FileMetadata:           f.FileMetadata,
		NumberMetadata:         f.NumberMetadata,
		ValidationMetadata:     f.ValidationMetadata,
		AutoNumberMetadata:     f.AutoNumberMetadata,
		FormulaMetadata:        f.FormulaMetadata,
		SelectListMetadata:     GetSelectListMetadata(f),
		Required:               f.Required,
		AutoPopulate:           f.AutoPopulate,
		SubFields:              GetSubFieldMetadata(f),
		SubType:                f.SubType,
		ColumnName:             f.ColumnName,
	}
}

func GetType(f *meta.Field) string {
	if f.Type == "FORMULA" {
		return f.FormulaMetadata.ReturnType
	}
	return f.Type
}

func GetUpdateable(f *meta.Field) bool {
	return !f.ReadOnly && !f.CreateOnly && f.Type != "AUTONUMBER" && f.Type != "FORMULA"
}

func GetSubFieldMetadata(f *meta.Field) map[string]*adapt.FieldMetadata {
	fieldMetadata := map[string]*adapt.FieldMetadata{}
	for _, subField := range f.SubFields {
		fieldMetadata[subField.Name] = &adapt.FieldMetadata{
			Name:       subField.Name,
			Label:      subField.Label,
			Type:       subField.Type,
			Updateable: !f.ReadOnly && !f.CreateOnly,
			Createable: !f.ReadOnly,
			Accessible: true,
			SelectListMetadata: GetSelectListMetadata(&meta.Field{
				Type:       subField.Type,
				SelectList: subField.SelectList,
			}),
		}
	}
	return fieldMetadata
}

func GetSelectListMetadata(f *meta.Field) *adapt.SelectListMetadata {
	if f.Type == "SELECT" || f.Type == "MULTISELECT" {
		return &adapt.SelectListMetadata{
			Name: f.SelectList,
		}
	}
	return nil
}

func LoadCollectionMetadata(key string, metadataCache *adapt.MetadataCache, session *sess.Session) (*adapt.CollectionMetadata, error) {
	// Check to see if the collection is already in our metadata cache
	collectionMetadata, err := metadataCache.GetCollection(key)
	if err == nil {
		return collectionMetadata, nil
	}

	collection, err := meta.NewCollection(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(collection, session)
	if err != nil {
		return nil, err
	}

	collectionMetadata = GetCollectionMetadata(collection)
	metadataCache.AddCollection(key, collectionMetadata)

	return collectionMetadata, nil
}

// LoadAllFieldsMetadata function
func LoadAllFieldsMetadata(collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var fields meta.FieldCollection

	err := bundle.LoadAllFromAny(&fields, meta.BundleConditions{
		"uesio/studio.collection": collectionKey,
	}, session)
	if err != nil {
		return err
	}

	if len(fields) == 0 {
		return errors.New("No fields found for collection")
	}

	for _, field := range fields {
		collectionMetadata.SetField(GetFieldMetadata(field, session))
	}
	return nil
}

// LoadFieldsMetadata function
func LoadFieldsMetadata(keys []string, collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {

	fields := []meta.BundleableItem{}
	for _, key := range keys {
		_, err := collectionMetadata.GetField(key)
		if err != nil {
			field, err := meta.NewField(collectionKey, key)
			if err != nil {
				return err
			}
			fields = append(fields, field)
		}
	}
	if len(fields) == 0 {
		return nil
	}
	err := bundle.LoadMany(fields, session)
	if err != nil {
		return fmt.Errorf("collection: %s : %v", collectionKey, err)
	}

	for _, item := range fields {
		collectionMetadata.SetField(GetFieldMetadata(item.(*meta.Field), session))
	}
	return nil
}

// LoadSelectListMetadata function
func LoadSelectListMetadata(key string, metadataCache *adapt.MetadataCache, session *sess.Session) error {

	collectionKey, fieldKey, selectListKey := ParseSelectListKey(key)

	selectListMetadata, ok := metadataCache.SelectLists[selectListKey]

	if !ok {
		namespace, name, err := meta.ParseKey(selectListKey)
		if err != nil {
			return errors.New("Field Key: " + selectListKey + ":" + err.Error())
		}
		selectList := meta.SelectList{
			Name:      name,
			Namespace: namespace,
		}
		err = bundle.Load(&selectList, session)
		if err != nil {
			return err
		}
		selectListMetadata = &adapt.SelectListMetadata{
			Name:             selectList.Name,
			Options:          selectList.Options,
			BlankOptionLabel: selectList.BlankOptionLabel,
		}
	}

	collectionMetadata, err := metadataCache.GetCollection(collectionKey)
	if err != nil {
		return errors.New("Collection not Found for Select List: " + collectionKey)
	}

	fieldMetadata, err := collectionMetadata.GetField(fieldKey)
	if err != nil {
		return errors.New("Field not Found for Select List: " + fieldKey)
	}

	fieldMetadata.SelectListMetadata = selectListMetadata

	return nil
}

// CollateMetadata function
func CollateMetadata(collectionKey string, collectionMetadata *adapt.CollectionMetadata, collatedMetadata map[string]*adapt.MetadataCache) {
	dsKey := collectionMetadata.DataSource
	_, ok := collatedMetadata[dsKey]
	if !ok {
		collatedMetadata[dsKey] = &adapt.MetadataCache{}
	}
	_, ok = collatedMetadata[dsKey].Collections[collectionKey]
	if !ok {
		cache := collatedMetadata[dsKey]
		cache.AddCollection(collectionKey, collectionMetadata)
	}
}
