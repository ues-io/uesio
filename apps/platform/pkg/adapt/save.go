package adapt

import (
	"errors"
	"fmt"
	"text/template"

	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type SaveOp struct {
	CollectionName string
	WireName       string
	Inserts        ChangeItems
	Updates        ChangeItems
	Deletes        ChangeItems
	Options        *SaveOptions
	Errors         *[]SaveError
	InsertCount    int
}

func (op *SaveOp) AddError(saveError *SaveError) {
	if op.Errors == nil {
		op.Errors = &[]SaveError{}
	}
	*op.Errors = append(*op.Errors, *saveError)
}

func (op *SaveOp) HasErrors() bool {
	return len(*op.Errors) > 0
}

func (op *SaveOp) LoopInserts(changeFunc func(change *ChangeItem) error) error {
	if op.Inserts != nil {
		for i := range op.Inserts {
			// Since some of our inserts could have been converted to updates
			// We need this check to skip them.
			if !op.Inserts[i].IsNew {
				continue
			}
			err := changeFunc(op.Inserts[i])
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (op *SaveOp) LoopUpdates(changeFunc func(change *ChangeItem) error) error {
	if op.Updates != nil {
		for i := range op.Updates {
			err := changeFunc(op.Updates[i])
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (op *SaveOp) LoopChanges(changeFunc func(change *ChangeItem) error) error {
	err := op.LoopInserts(changeFunc)
	if err != nil {
		return err
	}
	return op.LoopUpdates(changeFunc)
}

type ChangeItems []*ChangeItem

type ChangeItem struct {
	FieldChanges    loadable.Item
	IDValue         string
	UniqueKey       string
	Error           error
	RecordKey       string
	OldValues       loadable.Item
	ReadTokens      []string
	ReadWriteTokens []string
	Autonumber      int
	IsNew           bool
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

func (ci *ChangeItem) GetFieldAsString(fieldID string) (string, error) {
	value, err := ci.GetField(fieldID)
	if err != nil {
		return "", err
	}
	valueString, ok := value.(string)
	if !ok {
		return "", errors.New("Could not get value as string: " + fieldID)
	}
	return valueString, nil
}

func (ci *ChangeItem) GetOldField(fieldID string) (interface{}, error) {
	if ci.OldValues != nil {
		return ci.OldValues.GetField(fieldID)
	}
	return nil, nil
}

func (ci *ChangeItem) GetField(fieldID string) (interface{}, error) {
	changeVal, err := ci.FieldChanges.GetField(fieldID)
	if err == nil && changeVal != nil {
		return changeVal, nil
	}
	return ci.GetOldField(fieldID)
}

func (ci *ChangeItem) SetField(fieldID string, value interface{}) error {
	return ci.FieldChanges.SetField(fieldID, value)
}

func (ci *ChangeItem) Loop(iter func(string, interface{}) error) error {
	return ci.FieldChanges.Loop(iter)
}

func (ci *ChangeItem) Len() int {
	return ci.FieldChanges.Len()
}

func (ci *ChangeItem) GetOwnerID() (string, error) {

	if ci.IsNew {
		ownerVal, err := ci.GetField("uesio/core.owner->uesio/core.id")
		if err != nil {
			return "", err
		}
		return GetReferenceKey(ownerVal)
	}

	ownerVal, err := ci.GetOldField("uesio/core.owner->uesio/core.id")
	if err != nil {
		return "", err
	}
	return GetReferenceKey(ownerVal)

}

type SaveOptions struct {
	Upsert bool `json:"upsert"`
}

func GetFieldValueString(value interface{}, key string) (string, error) {
	value, err := GetFieldValue(value, key)
	if err != nil {
		return "", err
	}
	valueString, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("Could not get value as string: %T", value)
	}
	return valueString, nil
}

func GetFieldValue(value interface{}, key string) (interface{}, error) {
	valueMap, ok := value.(map[string]interface{})
	if ok {
		fk, ok := valueMap[key]
		if !ok {
			return "", fmt.Errorf("could not get map property: "+key+" %T", value)
		}
		return fk, nil
	}

	valueItem, ok := value.(Item)
	if ok {
		return valueItem.GetField(key)
	}

	loadableValueItem, ok := value.(loadable.Item)
	if ok {
		return loadableValueItem.GetField(key)
	}

	return nil, fmt.Errorf("not a valid map or item: %T", value)
}

func GetReferenceKey(value interface{}) (string, error) {
	if value == nil {
		return "", nil
	}

	valueString, ok := value.(string)
	if ok {
		return valueString, nil
	}

	fk, err := GetFieldValue(value, ID_FIELD)
	if err != nil {
		return "", err
	}

	return GetReferenceKey(fk)
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
