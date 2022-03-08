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
	FieldChanges    loadable.Item
	IDValue         interface{}
	Error           error
	RecordKey       interface{}
	OldValues       loadable.Item
	ReadTokens      []string
	ReadWriteTokens []string
	Autonumber      int
}

func (ci *ChangeItem) AddReadToken(token string) {
	if ci.ReadTokens == nil {
		ci.ReadTokens = []string{}
	}
	ci.ReadTokens = append(ci.ReadTokens, token)
}

func (ci *ChangeItem) AddReadWriteToken(token string) {
	if ci.ReadWriteTokens == nil {
		ci.ReadWriteTokens = []string{}
	}
	ci.ReadWriteTokens = append(ci.ReadWriteTokens, token)
}

func (ci *ChangeItem) GetOwnerID() (string, error) {
	ownerChange, err := ci.FieldChanges.GetField("uesio.owner")
	if err != nil || ownerChange == nil {
		oldOwner, err := ci.OldValues.GetField("uesio.owner")
		if err != nil {
			return "", err
		}
		return GetReferenceKey(oldOwner)
	}
	return GetReferenceKey(ownerChange)
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

func GetReferenceKey(value interface{}) (string, error) {
	if value == nil {
		return "", nil
	}

	valueString, ok := value.(string)
	if ok {
		return valueString, nil
	}

	valueMap, ok := value.(map[string]interface{})
	if ok {
		fk, ok := valueMap[ID_FIELD]
		if !ok {
			return "", errors.New("bad change map for ref field")
		}
		return GetReferenceKey(fk)
	}

	valueItem, ok := value.(Item)
	if ok {
		fk, err := valueItem.GetField(ID_FIELD)
		if err != nil {
			return "", errors.New("bad change map for ref field")
		}
		return GetReferenceKey(fk)

	}

	return "", errors.New("Bad foreign key")
}

// NewFieldChanges function returns a template that can merge field changes
func NewFieldChanges(templateString string, collectionMetadata *CollectionMetadata) (*template.Template, error) {
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
			key, err := GetReferenceKey(val)
			if err != nil {
				return nil, err
			}
			if key == "" {
				return nil, errors.New("Bad Reference Key in template: " + templateString)
			}
			return key, nil
		}
		return val, nil
	})
}
