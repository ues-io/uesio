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
		IDField:               "uesio.id",
		IDFormat:              e.IDFormat,
		NameField:             e.NameField,
		Createable:            !e.ReadOnly,
		Accessible:            true,
		Updateable:            !e.ReadOnly,
		Deleteable:            !e.ReadOnly,
		Fields:                fieldMetadata,
		DataSource:            e.DataSourceRef,
		Access:                e.Access,
		RecordChallengeTokens: e.RecordChallengeTokens,
	}
}

// GetFieldMetadata function
func GetFieldMetadata(f *meta.Field) *adapt.FieldMetadata {
	return &adapt.FieldMetadata{
		Name:                 f.Name,
		Namespace:            f.Namespace,
		Createable:           !f.ReadOnly,
		Accessible:           true,
		Updateable:           !f.ReadOnly && !f.CreateOnly,
		Type:                 f.Type,
		Label:                f.Label,
		ReferencedCollection: f.ReferencedCollection,
		SelectListName:       f.SelectList,
		Required:             f.Required,
		Validate:             GetValidateMetadata(f.Validate),
		AutoPopulate:         f.AutoPopulate,
		OnDelete:             f.OnDelete,
		FileCollection:       f.FileCollection,
		Accept:               f.Accept,
		SubFields:            GetSubFieldsMetadata(f.SubFields),
		SubType:              f.SubType,
	}
}

// GetSubFieldsMetadata function
func GetSubFieldsMetadata(subfields []meta.SubField) []adapt.SubField {
	subfieldsMetadata := []adapt.SubField{}
	for _, subfield := range subfields {
		subfieldsMetadata = append(subfieldsMetadata, adapt.SubField{
			Name: subfield.Name,
		})
	}
	return subfieldsMetadata
}

// GetValidateMetadata function
func GetValidateMetadata(v meta.Validate) *adapt.ValidationMetadata {
	return &adapt.ValidationMetadata{
		Type:  v.Type,
		Regex: v.Regex,
	}
}

// GetSelectListMetadata function
func GetSelectListMetadata(sl *meta.SelectList) *adapt.SelectListMetadata {
	return &adapt.SelectListMetadata{
		Name:    sl.Name,
		Options: GetSelectListOptionsMetadata(sl.Options),
	}
}

// GetSelectListOptionsMetadata function
func GetSelectListOptionsMetadata(options []meta.SelectListOption) []adapt.SelectListOptionMetadata {
	optionsMetadata := []adapt.SelectListOptionMetadata{}
	for _, option := range options {
		optionsMetadata = append(optionsMetadata, adapt.SelectListOptionMetadata{
			Label: option.Label,
			Value: option.Value,
		})
	}
	return optionsMetadata
}

// LoadCollectionMetadata function
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
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:       "id",
		Namespace:  "uesio",
		Createable: false,
		Accessible: true,
		Updateable: false,
		Type:       "TEXT",
		Label:      "Id",
	})
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:         "owner",
		Namespace:    "uesio",
		Createable:   false,
		Accessible:   true,
		Updateable:   false,
		Type:         "USER",
		Label:        "Owner",
		AutoPopulate: "CREATE",
	})
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:         "createdby",
		Namespace:    "uesio",
		Createable:   false,
		Accessible:   true,
		Updateable:   false,
		Type:         "USER",
		Label:        "Created By",
		AutoPopulate: "CREATE",
	})
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:         "updatedby",
		Namespace:    "uesio",
		Createable:   false,
		Accessible:   true,
		Updateable:   false,
		Type:         "USER",
		Label:        "Updated By",
		AutoPopulate: "UPDATE",
	})
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:         "createdat",
		Namespace:    "uesio",
		Createable:   false,
		Accessible:   true,
		Updateable:   false,
		Type:         "TIMESTAMP",
		Label:        "Created At",
		AutoPopulate: "CREATE",
	})
	collectionMetadata.SetField(&adapt.FieldMetadata{
		Name:         "updatedat",
		Namespace:    "uesio",
		Createable:   false,
		Accessible:   true,
		Updateable:   false,
		Type:         "TIMESTAMP",
		Label:        "Updated At",
		AutoPopulate: "UPDATE",
	})

	metadataCache.AddCollection(key, collectionMetadata)

	return collectionMetadata, nil
}

// LoadAllFieldsMetadata function
func LoadAllFieldsMetadata(collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
	var fields meta.FieldCollection

	err := bundle.LoadAllFromAny(&fields, meta.BundleConditions{
		"studio.collection": collectionKey,
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
func LoadFieldsMetadata(keys []string, collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) error {
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
func LoadFieldMetadata(key string, collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session) (*adapt.FieldMetadata, error) {
	// Check to see if the field is already in our metadata cache
	fieldMetadata, err := collectionMetadata.GetField(key)
	if err != nil {
		field, err := meta.NewField(collectionKey, key)
		if err != nil {
			return nil, err
		}
		err = bundle.Load(field, session)
		if err != nil {
			return nil, fmt.Errorf("field: %s collection: %s : %v", key, collectionKey, err)
		}
		fieldMetadata = GetFieldMetadata(field)
		collectionMetadata.SetField(fieldMetadata)
	}
	return fieldMetadata, nil
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
