package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetCollectionMetadata(e *meta.Collection) *wire.CollectionMetadata {
	fieldMetadata := map[string]*wire.FieldMetadata{}

	return &wire.CollectionMetadata{
		Name:        e.Name,
		Namespace:   e.Namespace,
		Type:        e.Type,
		NameField:   GetNameField(e),
		UniqueKey:   e.UniqueKeyFields,
		Createable:  !e.ReadOnly,
		Accessible:  true,
		Updateable:  !e.ReadOnly,
		Deleteable:  !e.ReadOnly,
		Fields:      fieldMetadata,
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

func GetNameField(c *meta.Collection) string {
	if c.NameField != "" {
		return c.NameField
	}
	return commonfields.Id
}

func GetFieldMetadata(f *meta.Field, session *sess.Session) *wire.FieldMetadata {
	fieldMetadata := &wire.FieldMetadata{
		Name:                   f.Name,
		Namespace:              f.Namespace,
		Createable:             !f.ReadOnly && f.Type != "AUTONUMBER" && f.Type != "FORMULA",
		Accessible:             true,
		Updateable:             GetUpdateable(f),
		Type:                   GetType(f),
		IsFormula:              f.Type == "FORMULA",
		Label:                  f.Label,
		LanguageLabel:          f.LanguageLabel,
		ReferenceMetadata:      GetReferenceMetadata(f),
		ReferenceGroupMetadata: GetReferenceGroupMetadata(f),
		FileMetadata:           GetFileMetadata(f),
		NumberMetadata:         GetNumberMetadata(f),
		ValidationMetadata:     GetValidationMetadata(f),
		AutoNumberMetadata:     GetAutoNumberMetadata(f),
		FormulaMetadata:        GetFormulaMetadata(f),
		SelectListMetadata:     GetSelectListMetadata(f),
		MetadataFieldMetadata:  GetMetadataFieldMetadata(f),
		Required:               f.Required,
		AutoPopulate:           f.AutoPopulate,
		SubType:                f.SubType,
		ColumnName:             f.ColumnName,
	}
	if subFieldsSupported(f.Type, f.SubType) && len(f.SubFields) > 0 {
		fieldMetadata.SubFields = map[string]*wire.FieldMetadata{}
		for _, subField := range f.SubFields {
			fieldMetadata.SubFields[subField.Name] = GetSubFieldMetadata(&subField)
		}
	}
	return fieldMetadata
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

func subFieldsSupported(fieldType, fieldSubType string) bool {
	return fieldType == "STRUCT" || ((fieldType == "LIST" || fieldType == "MAP") && fieldSubType == "STRUCT")
}

func GetSubFieldMetadata(f *meta.SubField) *wire.FieldMetadata {
	fieldMetadata := &wire.FieldMetadata{
		Name:       f.Name,
		Label:      f.Label,
		Type:       f.Type,
		Updateable: !f.CreateOnly,
		Createable: true,
		Accessible: true,
		SelectListMetadata: GetSelectListMetadata(&meta.Field{
			Type:       f.Type,
			SelectList: f.SelectList,
		}),
		NumberMetadata: GetNumberMetadata(&meta.Field{
			Type:           f.Type,
			NumberMetadata: f.Number,
		}),
		MetadataFieldMetadata: GetMetadataFieldMetadata(&meta.Field{
			Type:                  f.Type,
			MetadataFieldMetadata: f.Metadata,
		}),
		SubType: f.SubType,
	}
	if subFieldsSupported(f.Type, f.SubType) && len(f.SubFields) > 0 {
		subFieldsMetadata := map[string]*wire.FieldMetadata{}
		for i := range f.SubFields {
			subField := f.SubFields[i]
			subFieldsMetadata[subField.Name] = GetSubFieldMetadata(&subField)
		}
		fieldMetadata.SubFields = subFieldsMetadata
	}
	return fieldMetadata
}

func GetSelectListMetadata(f *meta.Field) *wire.SelectListMetadata {
	if f.Type == "SELECT" || f.Type == "MULTISELECT" {
		return &wire.SelectListMetadata{
			Name: f.SelectList,
		}
	}
	return nil
}

func GetMetadataFieldMetadata(f *meta.Field) *wire.MetadataFieldMetadata {
	if f.Type == "METADATA" || f.Type == "MULTIMETADATA" && f.MetadataFieldMetadata != nil {
		return &wire.MetadataFieldMetadata{
			Type:      f.MetadataFieldMetadata.Type,
			Grouping:  f.MetadataFieldMetadata.Grouping,
			Namespace: f.MetadataFieldMetadata.Namespace,
		}
	}
	return nil
}

func GetFileMetadata(f *meta.Field) *wire.FileMetadata {
	if f.Type == "FILE" && f.FileMetadata != nil {
		return &wire.FileMetadata{
			Accept:     f.FileMetadata.Accept,
			FileSource: f.FileMetadata.FileSource,
		}
	}
	return nil
}

func GetNumberMetadata(f *meta.Field) *wire.NumberMetadata {
	if (f.Type == "NUMBER" || (f.Type == "FORMULA" && f.FormulaMetadata.ReturnType == "NUMBER")) && f.NumberMetadata != nil {
		return &wire.NumberMetadata{
			Decimals: f.NumberMetadata.Decimals,
		}
	}
	return nil
}

func GetAutoNumberMetadata(f *meta.Field) *wire.AutoNumberMetadata {
	if f.Type == "AUTONUMBER" && f.AutoNumberMetadata != nil {
		return &wire.AutoNumberMetadata{
			Prefix:       f.AutoNumberMetadata.Prefix,
			LeadingZeros: f.AutoNumberMetadata.LeadingZeros,
		}
	}
	return nil
}

func GetFormulaMetadata(f *meta.Field) *wire.FormulaMetadata {
	if f.Type == "FORMULA" && f.FormulaMetadata != nil {
		return &wire.FormulaMetadata{
			Expression: f.FormulaMetadata.Expression,
			ReturnType: f.FormulaMetadata.ReturnType,
		}
	}
	return nil
}

func GetReferenceMetadata(f *meta.Field) *wire.ReferenceMetadata {
	if f.Type == "REFERENCE" && f.ReferenceMetadata != nil {
		return &wire.ReferenceMetadata{
			Collection:      f.ReferenceMetadata.Collection,
			MultiCollection: f.ReferenceMetadata.MultiCollection,
			CollectionsRefs: f.ReferenceMetadata.CollectionsRefs,
		}
	}
	return nil
}

func GetReferenceGroupMetadata(f *meta.Field) *wire.ReferenceGroupMetadata {
	if f.Type == "REFERENCEGROUP" && f.ReferenceGroupMetadata != nil {
		return &wire.ReferenceGroupMetadata{
			Collection: f.ReferenceGroupMetadata.Collection,
			Field:      f.ReferenceGroupMetadata.Field,
			OnDelete:   f.ReferenceGroupMetadata.OnDelete,
		}
	}
	return nil
}

func GetValidationMetadata(f *meta.Field) *wire.ValidationMetadata {
	if f.ValidationMetadata != nil {
		return &wire.ValidationMetadata{
			Type:      f.ValidationMetadata.Type,
			Regex:     f.ValidationMetadata.Regex,
			SchemaUri: f.ValidationMetadata.SchemaUri,
		}
	}
	return nil
}

func LoadCollectionMetadata(key string, metadataCache *wire.MetadataCache, session *sess.Session, connection wire.Connection) (*wire.CollectionMetadata, error) {

	// Check to see if the collection is already in our metadata cache
	collectionMetadata, err := metadataCache.GetCollection(key)
	if err == nil {
		return collectionMetadata, nil
	}

	// special handling for the common collection metadata
	if key == constant.CommonCollection {
		collectionMetadata = GetCommonCollectionMetadata()
		metadataCache.AddCollection(key, collectionMetadata)
		return collectionMetadata, nil
	}

	collection, err := meta.NewCollection(key)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(collection, session, connection)
	if err != nil {
		return nil, err
	}

	collectionMetadata = GetCollectionMetadata(collection)

	// To fetch record challenge tokens, enter an admin context, since we don't have separate permissions for these things.
	adminSession := GetSiteAdminSession(session)

	var recordChallengeTokens meta.RecordChallengeTokenCollection
	err = bundle.LoadAllFromAny(&recordChallengeTokens, meta.BundleConditions{"uesio/studio.collection": collectionMetadata.GetKey()}, adminSession, connection)
	if err != nil {
		return nil, err
	}
	if recordChallengeTokens.Len() > 0 {
		for _, rct := range recordChallengeTokens {
			collectionMetadata.RecordChallengeTokens = append(collectionMetadata.RecordChallengeTokens, rct)
		}
	}

	metadataCache.AddCollection(key, collectionMetadata)

	return collectionMetadata, nil
}

func LoadAllFieldsMetadata(collectionKey string, collectionMetadata *wire.CollectionMetadata, session *sess.Session, connection wire.Connection) error {
	var fields meta.FieldCollection

	err := bundle.LoadAllFromAny(&fields, meta.BundleConditions{
		"uesio/studio.collection": collectionKey,
	}, session, connection)
	if err != nil {
		return err
	}

	AddAllBuiltinFields(&fields, collectionKey)

	for _, field := range fields {
		collectionMetadata.SetField(GetFieldMetadata(field, session))
	}
	return nil
}

func LoadFieldsMetadata(keys []string, collectionKey string, collectionMetadata *wire.CollectionMetadata, session *sess.Session, connection wire.Connection) error {

	fields := []meta.BundleableItem{}
	for _, key := range keys {
		_, err := collectionMetadata.GetField(key)
		if err != nil {
			// Check if this field is built-in, if so, handle its metadata here
			builtInField, isBuiltIn := GetBuiltinField(key, collectionKey)
			if isBuiltIn {
				collectionMetadata.SetField(GetFieldMetadata(&builtInField, session))
				continue
			}
			field, err := meta.NewField(collectionKey, meta.GetFullyQualifiedKey(key, collectionMetadata.Namespace))
			if err != nil {
				return err
			}
			fields = append(fields, field)
		}
	}
	if len(fields) == 0 {
		return nil
	}
	err := bundle.LoadMany(fields, session, connection)
	if err != nil {
		return fmt.Errorf("collection: %s : %v", collectionKey, err)
	}

	for _, item := range fields {
		field := item.(*meta.Field)
		// If we don't have a field type that means the field didn't load
		// because we don't have permission to it.
		if field.Type == "" {
			continue
		}
		collectionMetadata.SetField(GetFieldMetadata(field, session))
	}
	return nil
}

func LoadSelectListMetadata(key string, metadataCache *wire.MetadataCache, session *sess.Session, connection wire.Connection) error {
	if _, err := metadataCache.GetSelectList(key); err != nil {
		selectList, err := meta.NewSelectList(key)
		if err != nil {
			return err
		}
		if err = bundle.Load(selectList, session, connection); err != nil {
			return err
		}
		metadataCache.AddSelectList(key, &wire.SelectListMetadata{
			Name:                     selectList.Name,
			Namespace:                selectList.Namespace,
			Options:                  selectList.Options,
			BlankOptionLabel:         selectList.BlankOptionLabel,
			BlankOptionLanguageLabel: selectList.BlankOptionLanguageLabel,
		})
	}
	return nil
}
