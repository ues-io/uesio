package wire

import (
	"encoding/json"
	"errors"
	"fmt"
	"text/template"

	"github.com/francoispqt/gojay"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SaveOp struct {
	WireName    string
	Inserts     ChangeItems
	Updates     ChangeItems
	Deletes     ChangeItems
	Options     *SaveOptions
	Errors      *[]exceptions.SaveException
	InsertCount int
	Metadata    *CollectionMetadata
	Params      map[string]string

	integrationConnection *IntegrationConnection
}

func (op *SaveOp) GetIntegration() (*IntegrationConnection, error) {
	if op.integrationConnection != nil {
		return op.integrationConnection, nil
	}
	return nil, errors.New("integrationConnection not available on SaveOp")
}

func (op *SaveOp) AttachIntegrationConnection(ic *IntegrationConnection) {
	op.integrationConnection = ic
}

func (op *SaveOp) AddError(saveError *exceptions.SaveException) {
	if op.Errors == nil {
		op.Errors = &[]exceptions.SaveException{}
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

func (op *SaveOp) LoopDeletes(changeFunc func(change *ChangeItem) error) error {
	if op.Deletes != nil {
		for i := range op.Deletes {
			err := changeFunc(op.Deletes[i])
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (op *SaveOp) HasChanges() bool {
	return len(op.Updates)+len(op.Inserts) > 0
}

func (op *SaveOp) HasDeletes() bool {
	return len(op.Deletes) > 0
}

func (op *SaveOp) LoopChanges(changeFunc func(change *ChangeItem) error) error {
	err := op.LoopInserts(changeFunc)
	if err != nil {
		return err
	}
	return op.LoopUpdates(changeFunc)
}

func (ci *ChangeItems) GetIDs() []string {
	ids := make([]string, len(*ci))
	for _, item := range *ci {
		ids = append(ids, item.IDValue)
	}
	return ids
}

type ChangeItems []*ChangeItem

type ChangeItem struct {
	FieldChanges    meta.Item
	IDValue         string
	UniqueKey       string
	Error           error
	RecordKey       string
	OldValues       meta.Item
	ReadTokens      []string
	ReadWriteTokens []string
	Autonumber      int
	IsNew           bool
	Metadata        *CollectionMetadata
}

func (ci *ChangeItem) IsNil() bool {
	return ci == nil
}

func (ci *ChangeItem) MarshalJSONObject(enc *gojay.Encoder) {

	err := ci.FieldChanges.Loop(func(fieldID string, value interface{}) error {
		// Skip marshalling builtin fields
		switch fieldID {
		case
			ID_FIELD,
			UNIQUE_KEY_FIELD,
			OWNER_FIELD,
			CREATED_BY_FIELD,
			CREATED_AT_FIELD,
			UPDATED_BY_FIELD,
			UPDATED_AT_FIELD:
			return nil
		}

		fieldMetadata, err := ci.Metadata.GetField(fieldID)
		if err != nil {
			return err
		}

		if IsReference(fieldMetadata.Type) {
			refValue, err := GetReferenceKey(value)
			if err != nil || refValue == "" {
				enc.NullKey(fieldID)
				return nil
			}
			enc.StringKey(fieldID, refValue)
			return nil
		}

		jsonValue, err := json.Marshal(value)
		if err != nil {
			return errors.New("Error getting json value: " + fieldMetadata.GetFullName())
		}
		ej := gojay.EmbeddedJSON(jsonValue)
		enc.AddEmbeddedJSONKey(fieldID, &ej)
		return nil

	})
	if err != nil {
		// this should add an error to the encoder and make it bomb
		fmt.Println(err)
		badValue := []string{}
		enc.AddInterface(badValue)
	}
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
	return GetValueString(value)
}

func (ci *ChangeItem) GetReferenceKey(fieldID string) (string, error) {
	value, err := ci.GetField(fieldID)
	if err != nil {
		return "", err
	}
	return GetReferenceKey(value)
}

func (ci *ChangeItem) GetOldReferenceKey(fieldID string) (string, error) {
	value, err := ci.GetOldField(fieldID)
	if err != nil {
		return "", err
	}
	return GetReferenceKey(value)
}

func (ci *ChangeItem) GetOldFieldAsString(fieldID string) (string, error) {
	value, err := ci.GetOldField(fieldID)
	if err != nil {
		return "", err
	}
	return GetValueString(value)
}

func (ci *ChangeItem) GetFieldAsInt(fieldID string) (int64, error) {
	value, err := ci.GetField(fieldID)
	if err != nil {
		return 0, err
	}
	return GetValueInt(value)
}

func (ci *ChangeItem) GetOldFieldAsInt(fieldID string) (int64, error) {
	value, err := ci.GetOldField(fieldID)
	if err != nil {
		return 0, err
	}
	return GetValueInt(value)
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

// This assures that you get the real current owner id.
// If someone was changing the owner id, we don't want that here,
// because we haven't verified it yet.
func (ci *ChangeItem) GetOwnerID() (string, error) {

	if ci.IsNew {
		return ci.GetProposedOwnerID()
	}

	return ci.GetOldReferenceKey(OWNER_FIELD)

}

// This get the owner id that may be changing
func (ci *ChangeItem) GetProposedOwnerID() (string, error) {
	return ci.GetReferenceKey(OWNER_FIELD)
}

func (ci *ChangeItem) GetCreatedByID() (string, error) {
	return ci.GetReferenceKey(CREATED_BY_FIELD)
}

func (ci *ChangeItem) GetUpdatedByID() (string, error) {
	return ci.GetReferenceKey(UPDATED_BY_FIELD)
}

type SaveOptions struct {
	Upsert               bool `json:"upsert"`
	IgnoreMissingRecords bool `json:"ignoreMissingRecords"`
}

func GetValueInt(value interface{}) (int64, error) {
	switch typedVal := value.(type) {
	case nil:
		return 0, nil
	case int:
		return int64(typedVal), nil
	case int64:
		return typedVal, nil
	case float64:
		return int64(typedVal), nil
	}
	return 0, fmt.Errorf("could not get value as int: %T", value)
}

func GetValueString(value interface{}) (string, error) {
	valueString, ok := value.(string)
	if !ok {
		return "", fmt.Errorf("could not get value as string: %T", value)
	}
	return valueString, nil
}

func GetFieldValueString(value interface{}, key string) (string, error) {
	value, err := GetFieldValue(value, key)
	if err != nil {
		return "", err
	}
	return GetValueString(value)
}

func GetLoadable(value interface{}) (meta.Item, error) {
	valueMap, ok := value.(map[string]interface{})
	if ok {
		loadableItem := Item(valueMap)
		return &loadableItem, nil
	}

	loadableValueItem, ok := value.(meta.Item)
	if ok {
		return loadableValueItem, nil
	}

	return nil, fmt.Errorf("invalid Loadable type: %T", value)
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

	loadableValueItem, ok := value.(meta.Item)
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
func NewFieldChanges(templateString string, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(item meta.Item, key string) (interface{}, error) {
		fieldMetadata, err := collectionMetadata.GetFieldWithMetadata(key, metadata)
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
