package adapt

import (
	"errors"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type SaveOp struct {
	CollectionName string
	WireName       string
	Inserts        *ChangeItems
	Updates        *ChangeItems
	Deletes        *ChangeItems
	Options        *SaveOptions
}

type ChangeItems []ChangeItem

type ChangeItem struct {
	FieldChanges loadable.Item
	IDValue      interface{}
	Error        error
	RecordKey    interface{}
	OldValues    loadable.Item
}

// Lookup struct
type Lookup struct {
	RefField      string // The name of the reference field to lookup
	MatchField    string // The name of the field to use to match based on provided data
	MatchTemplate string // The template to use against the provided change data to equal the match field
}

// UpsertOptions struct
type UpsertOptions struct {
	MatchField    string // The field to pull from the database to determine a match
	MatchTemplate string // The template to use against the provided change data to equal the match field
}

// SaveOptions struct
type SaveOptions struct {
	Upsert  *UpsertOptions
	Lookups []Lookup
}

func GetReferenceKey(value interface{}, fieldMetadata *FieldMetadata, metadata *MetadataCache) (string, error) {
	if value == nil {
		return "", nil
	}

	valueMap, ok := value.(map[string]interface{})
	if !ok {
		return "", nil
	}

	referencedCollectionMetadata, err := metadata.GetCollection(fieldMetadata.ReferencedCollection)
	if err != nil {
		return "", err
	}
	refIDField, err := referencedCollectionMetadata.GetIDField()
	if err != nil {
		return "", err
	}

	fk, ok := valueMap[refIDField.GetFullName()]
	if !ok {
		return "", errors.New("bad change map for ref field " + fieldMetadata.GetFullName() + " -> " + refIDField.GetFullName())
	}

	fkString, ok := fk.(string)
	if !ok {
		return "", errors.New("Bad foreign key")
	}
	return fkString, nil
}

// NewFieldChanges function returns a template that can merge field changes
func NewFieldChanges(templateString string, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(item loadable.Item, key string) (interface{}, error) {
		fieldMetadata, err := collectionMetadata.GetField(key)
		if err != nil {
			return nil, err
		}
		val, err := item.GetField(key)
		if err != nil {
			return nil, errors.New("missing key " + key + " : " + collectionMetadata.GetFullName() + " : " + templateString)
		}
		if IsReference(fieldMetadata.Type) {
			key, err := GetReferenceKey(val, fieldMetadata, metadata)
			if err != nil {
				return nil, err
			}
			if key == "" {
				return nil, errors.New("Bad Reference Key in template")
			}
			return key, nil
		}
		return val, nil
	})
}
