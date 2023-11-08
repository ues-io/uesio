package datasource

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetCollectionMetadata(e *meta.Collection) *adapt.CollectionMetadata {
	fieldMetadata := map[string]*adapt.FieldMetadata{}

	return &adapt.CollectionMetadata{
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
			MetadataFieldMetadata: GetMetadataFieldMetadata(&meta.Field{
				Type:                  subField.Type,
				MetadataFieldMetadata: subField.Metadata,
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

func GetMetadataFieldMetadata(f *meta.Field) *adapt.MetadataFieldMetadata {
	if f.Type == "METADATA" || f.Type == "MULTIMETADATA" && f.MetadataFieldMetadata != nil {
		return &adapt.MetadataFieldMetadata{
			Type:      f.MetadataFieldMetadata.Type,
			Grouping:  f.MetadataFieldMetadata.Grouping,
			Namespace: f.MetadataFieldMetadata.Namespace,
		}
	}
	return nil
}

func GetFileMetadata(f *meta.Field) *adapt.FileMetadata {
	if f.Type == "FILE" && f.FileMetadata != nil {
		return &adapt.FileMetadata{
			Accept:     f.FileMetadata.Accept,
			FileSource: f.FileMetadata.FileSource,
		}
	}
	return nil
}

func GetNumberMetadata(f *meta.Field) *adapt.NumberMetadata {
	if (f.Type == "NUMBER" || (f.Type == "FORMULA" && f.FormulaMetadata.ReturnType == "NUMBER")) && f.NumberMetadata != nil {
		return &adapt.NumberMetadata{
			Decimals: f.NumberMetadata.Decimals,
		}
	}
	return nil
}

func GetAutoNumberMetadata(f *meta.Field) *adapt.AutoNumberMetadata {
	if f.Type == "AUTONUMBER" && f.AutoNumberMetadata != nil {
		return &adapt.AutoNumberMetadata{
			Prefix:       f.AutoNumberMetadata.Prefix,
			LeadingZeros: f.AutoNumberMetadata.LeadingZeros,
		}
	}
	return nil
}

func GetFormulaMetadata(f *meta.Field) *adapt.FormulaMetadata {
	if f.Type == "FORMULA" && f.FormulaMetadata != nil {
		return &adapt.FormulaMetadata{
			Expression: f.FormulaMetadata.Expression,
			ReturnType: f.FormulaMetadata.ReturnType,
		}
	}
	return nil
}

func GetReferenceMetadata(f *meta.Field) *adapt.ReferenceMetadata {
	if f.Type == "REFERENCE" && f.ReferenceMetadata != nil {
		return &adapt.ReferenceMetadata{
			Collection: f.ReferenceMetadata.Collection,
		}
	}
	return nil
}

func GetReferenceGroupMetadata(f *meta.Field) *adapt.ReferenceGroupMetadata {
	if f.Type == "REFERENCEGROUP" && f.ReferenceGroupMetadata != nil {
		return &adapt.ReferenceGroupMetadata{
			Collection: f.ReferenceGroupMetadata.Collection,
			Field:      f.ReferenceGroupMetadata.Field,
			OnDelete:   f.ReferenceGroupMetadata.OnDelete,
		}
	}
	return nil
}

func GetValidationMetadata(f *meta.Field) *adapt.ValidationMetadata {
	if f.ValidationMetadata != nil {
		return &adapt.ValidationMetadata{
			Type:      f.ValidationMetadata.Type,
			Regex:     f.ValidationMetadata.Regex,
			SchemaUri: f.ValidationMetadata.SchemaUri,
		}
	}
	return nil
}

func LoadCollectionMetadata(key string, metadataCache *adapt.MetadataCache, session *sess.Session, connection adapt.Connection) (*adapt.CollectionMetadata, error) {
	// Check to see if the collection is already in our metadata cache
	collectionMetadata, err := metadataCache.GetCollection(key)
	if err == nil {
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

func LoadAllFieldsMetadata(collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session, connection adapt.Connection) error {
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

func LoadFieldsMetadata(keys []string, collectionKey string, collectionMetadata *adapt.CollectionMetadata, session *sess.Session, connection adapt.Connection) error {

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
		collectionMetadata.SetField(GetFieldMetadata(item.(*meta.Field), session))
	}
	return nil
}

func LoadSelectListMetadata(key string, metadataCache *adapt.MetadataCache, session *sess.Session, connection adapt.Connection) error {

	collectionKey, fieldKey, selectListKey := ParseSelectListKey(key)

	selectListMetadata, ok := metadataCache.SelectLists[selectListKey]

	if !ok {

		selectList, err := meta.NewSelectList(selectListKey)
		if err != nil {
			return err
		}
		err = bundle.Load(selectList, session, connection)
		if err != nil {
			return err
		}
		selectListMetadata = &adapt.SelectListMetadata{
			Name:                     selectList.Name,
			Options:                  selectList.Options,
			BlankOptionLabel:         selectList.BlankOptionLabel,
			BlankOptionLanguageLabel: selectList.BlankOptionLanguageLabel,
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
