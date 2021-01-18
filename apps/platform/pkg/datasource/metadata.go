package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// GetCollectionMetadata function
func GetCollectionMetadata(e *metadata.Collection) *adapters.CollectionMetadata {
	fieldMetadata := map[string]*adapters.FieldMetadata{}

	return &adapters.CollectionMetadata{
		Name:           e.Name,
		Namespace:      e.Namespace,
		IDField:        e.IDField,
		IDFormat:       e.IDFormat,
		NameField:      e.NameField,
		Createable:     !e.ReadOnly,
		Accessible:     true,
		Updateable:     !e.ReadOnly,
		Deleteable:     !e.ReadOnly,
		Fields:         fieldMetadata,
		CollectionName: e.CollectionName,
		DataSource:     e.DataSourceRef,
	}
}

// GetFieldMetadata function
func GetFieldMetadata(f *metadata.Field) *adapters.FieldMetadata {
	return &adapters.FieldMetadata{
		Name:                 f.Name,
		Namespace:            f.Namespace,
		Createable:           !f.ReadOnly,
		Accessible:           true,
		Updateable:           !f.ReadOnly,
		Type:                 f.Type,
		Label:                f.Label,
		PropertyName:         f.PropertyName,
		ReferencedCollection: f.ReferencedCollection,
		SelectListName:       f.SelectList,
		ForeignKeyField:      f.ForeignKeyField,
		Required:             f.Required,
		Validate:             GetValidateMetadata(f.Validate),
		AutoPopulate:         f.AutoPopulate,
		OnDelete:             f.OnDelete,
	}
}

// GetValidateMetadata function
func GetValidateMetadata(v metadata.Validate) *adapters.ValidationMetadata {
	return &adapters.ValidationMetadata{
		Type:  v.Type,
		Regex: v.Regex,
	}
}

// GetSelectListMetadata function
func GetSelectListMetadata(sl *metadata.SelectList) *adapters.SelectListMetadata {
	return &adapters.SelectListMetadata{
		Name:    sl.Name,
		Options: GetSelectListOptionsMetadata(sl.Options),
	}
}

// GetSelectListOptionsMetadata function
func GetSelectListOptionsMetadata(options []metadata.SelectListOption) []adapters.SelectListOptionMetadata {
	optionsMetadata := []adapters.SelectListOptionMetadata{}
	for _, option := range options {
		optionsMetadata = append(optionsMetadata, adapters.SelectListOptionMetadata{
			Label: option.Label,
			Value: option.Value,
		})
	}
	return optionsMetadata
}

// LoadCollectionMetadata function
func LoadCollectionMetadata(key string, metadataCache *adapters.MetadataCache, session *sess.Session) (*adapters.CollectionMetadata, error) {
	// Check to see if the collection is already in our metadata cache
	collectionMetadata, err := metadataCache.GetCollection(key)
	if err != nil {
		collection, err := metadata.NewCollection(key)
		if err != nil {
			return nil, err
		}

		err = bundles.Load(collection, session)
		if err != nil {
			return nil, err
		}

		collectionMetadata = GetCollectionMetadata(collection)
		metadataCache.AddCollection(key, collectionMetadata)
	}
	return collectionMetadata, nil
}

// LoadAllFieldsMetadata function
func LoadAllFieldsMetadata(collectionKey string, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	var fields metadata.FieldCollection

	err := bundles.LoadAllFromAny(&fields, metadata.BundleConditions{
		"uesio.collection": collectionKey,
	}, session)
	if err != nil {
		return err
	}

	for _, field := range fields {
		collectionMetadata.SetField(GetFieldMetadata(&field))
	}
	return nil
}

// LoadFieldsMetadata function
func LoadFieldsMetadata(keys []string, collectionKey string, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) error {
	// TODO: Batch this
	for _, key := range keys {
		_, err := LoadFieldMetadata(key, collectionKey, collectionMetadata, session)
		if err != nil {
			return err
		}
	}
	return nil
}

// LoadFieldMetadata function
func LoadFieldMetadata(key string, collectionKey string, collectionMetadata *adapters.CollectionMetadata, session *sess.Session) (*adapters.FieldMetadata, error) {
	// Check to see if the field is already in our metadata cache
	fieldMetadata, err := collectionMetadata.GetField(key)
	if err != nil {
		field, err := metadata.NewField(collectionKey, key)
		if err != nil {
			return nil, err
		}
		err = bundles.Load(field, session)
		if err != nil {
			return nil, fmt.Errorf("field: %s collection: %s : %v", key, collectionKey, err)
		}
		fieldMetadata = GetFieldMetadata(field)
		collectionMetadata.SetField(fieldMetadata)
	}
	return fieldMetadata, nil
}

// LoadSelectListMetadata function
func LoadSelectListMetadata(key string, metadataCache *adapters.MetadataCache, session *sess.Session) error {

	collectionKey, fieldKey, selectListKey := ParseSelectListKey(key)

	selectListMetadata, ok := metadataCache.SelectLists[selectListKey]

	if !ok {
		namespace, name, err := metadata.ParseKey(selectListKey)
		if err != nil {
			return errors.New("Field Key: " + selectListKey + ":" + err.Error())
		}
		selectList := metadata.SelectList{
			Name:      name,
			Namespace: namespace,
		}
		err = bundles.Load(&selectList, session)
		if err != nil {
			return err
		}
		selectListMetadata = GetSelectListMetadata(&selectList)
	}

	collectionMetadata, err := metadataCache.GetCollection(collectionKey)
	if err != nil {
		return errors.New("Collection not Found for Select List: " + collectionKey)
	}

	fieldMetadata, err := collectionMetadata.GetField(fieldKey)
	if err != nil {
		return errors.New("Field not Found for Select List: " + fieldKey)
	}

	fieldMetadata.SelectListOptions = (*selectListMetadata).Options

	return nil
}

// CollateMetadata function
func CollateMetadata(collectionKey string, collectionMetadata *adapters.CollectionMetadata, collatedMetadata map[string]*adapters.MetadataCache) {
	dsKey := collectionMetadata.DataSource
	_, ok := collatedMetadata[dsKey]
	if !ok {
		collatedMetadata[dsKey] = &adapters.MetadataCache{}
	}
	_, ok = collatedMetadata[dsKey].Collections[collectionKey]
	if !ok {
		cache := collatedMetadata[dsKey]
		cache.AddCollection(collectionKey, collectionMetadata)
	}
}
