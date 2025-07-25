package wire

import (
	"encoding/json"
	"errors"
	"fmt"
	"text/template"

	"github.com/francoispqt/gojay"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type SaveOp struct {
	CollectionName string
	WireName       string
	Inserts        ChangeItems
	Updates        ChangeItems
	Deletes        ChangeItems
	Options        *SaveOptions
	Errors         *[]*exceptions.SaveException
	InsertCount    int
	Params         map[string]any

	metadata              *MetadataCache
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
		op.Errors = &[]*exceptions.SaveException{}
	}
	*op.Errors = append(*op.Errors, saveError)
}

func (op *SaveOp) HasErrors() bool {
	return len(*op.Errors) > 0
}

func (op *SaveOp) GetErrorStrings() []string {
	errorStrings := make([]string, len(*op.Errors))
	for i, saveError := range *op.Errors {
		errorStrings[i] = saveError.Error()
	}
	return errorStrings
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

func (op *SaveOp) HasInserts() bool {
	return len(op.Inserts) > 0
}

func (op *SaveOp) HasUpdates() bool {
	return len(op.Updates) > 0
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

func (op *SaveOp) LoopAllChanges(changeFunc func(change *ChangeItem) error) error {
	err := op.LoopInserts(changeFunc)
	if err != nil {
		return err
	}
	err = op.LoopUpdates(changeFunc)
	if err != nil {
		return err
	}
	return op.LoopDeletes(changeFunc)
}

func (op *SaveOp) GetCollectionMetadata() (*CollectionMetadata, error) {
	if op.metadata != nil {
		return op.metadata.GetCollection(op.CollectionName)
	}
	return nil, errors.New("no collection metadata available on SaveOp")

}

func (op *SaveOp) GetMetadata() (*MetadataCache, error) {
	if op.metadata != nil {
		return op.metadata, nil
	}
	return nil, errors.New("no metadata available on SaveOp")
}

func (op *SaveOp) AttachMetadataCache(response *MetadataCache) *SaveOp {
	op.metadata = response
	return op
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
	RecordKey       string
	OldValues       meta.Item
	ReadTokens      []string
	ReadWriteTokens []string
	IsNew           bool
	Metadata        *CollectionMetadata
}

func (ci *ChangeItem) IsNil() bool {
	return ci == nil
}

func (ci *ChangeItem) MarshalJSONObject(enc *gojay.Encoder) {

	err := ci.FieldChanges.Loop(func(fieldID string, value any) error {
		// Skip marshalling builtin fields
		switch fieldID {
		case
			commonfields.Id,
			commonfields.UniqueKey,
			commonfields.Owner,
			commonfields.CreatedBy,
			commonfields.CreatedAt,
			commonfields.UpdatedBy,
			commonfields.UpdatedAt:
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
			return fmt.Errorf("error getting json value: %s", fieldMetadata.GetFullName())
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

func (ci *ChangeItem) GetOldField(fieldID string) (any, error) {
	if ci.OldValues != nil {
		return ci.OldValues.GetField(fieldID)
	}
	return nil, nil
}

func (ci *ChangeItem) GetField(fieldID string) (any, error) {
	changeVal, err := ci.FieldChanges.GetField(fieldID)
	if err == nil && changeVal != nil {
		return changeVal, nil
	}
	return ci.GetOldField(fieldID)
}

func (ci *ChangeItem) HasFieldChanges(fieldID string) bool {
	changeVal, err := ci.FieldChanges.GetField(fieldID)
	return err == nil && changeVal != nil
}

func (ci *ChangeItem) SetField(fieldID string, value any) error {
	return ci.FieldChanges.SetField(fieldID, value)
}

func (ci *ChangeItem) Loop(iter func(string, any) error) error {
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

	return ci.GetOldReferenceKey(commonfields.Owner)

}

// This get the owner id that may be changing
func (ci *ChangeItem) GetProposedOwnerID() (string, error) {
	return ci.GetReferenceKey(commonfields.Owner)
}

func (ci *ChangeItem) GetCreatedByID() (string, error) {
	return ci.GetReferenceKey(commonfields.CreatedBy)
}

func (ci *ChangeItem) GetUpdatedByID() (string, error) {
	return ci.GetReferenceKey(commonfields.UpdatedBy)
}

type SaveOptions struct {
	// Convert inserts to upserts if the unique key matches an existing record
	Upsert bool `json:"upsert" bot:"upsert"`
	// Ignore issues where we can't find old data for an update or delete. This
	// is usually used to prevent issues in cascade delete where records have already been deleted.
	IgnoreMissingRecords bool `json:"ignoreMissingRecords"`
	// Ignore issues where we can't find references, just remove them from the save.
	IgnoreMissingReferences bool `json:"ignoreMissingReferences"`
	// If we encounter a validation error, just remove that change and keep going with the other ones.
	IgnoreValidationErrors bool `json:""`
}

func GetValueInt(value any) (int64, error) {
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

func GetValueString(value any) (string, error) {
	valueString, ok := value.(string)
	// TODO: This needs to be evaluated and likely adjusted. This could be an interface{} and the field may not exist but it could be a valid
	// field and therefore this should either return a typed error for that situation (e.g., ErrNoFieldValue) or possibly even just empty string.
	// As it stands, callers get an error and there is no way to know if the error was because there wasn't actually a value present or if some
	// other error occurred.
	if !ok {
		return "", fmt.Errorf("could not get value as string: %T", value)
	}
	return valueString, nil
}

func GetFieldValueString(value any, key string) (string, error) {
	value, err := GetFieldValue(value, key)
	if err != nil {
		return "", err
	}
	return GetValueString(value)
}

func GetLoadable(value any) (meta.Item, error) {
	valueMap, ok := value.(map[string]any)
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

func GetFieldValue(value any, key string) (any, error) {
	valueMap, ok := value.(map[string]any)
	if ok {
		fk, ok := valueMap[key]
		if !ok {
			return "", fmt.Errorf("could not get map property: %s %T", key, value)
		}
		return fk, nil
	}

	loadableValueItem, ok := value.(meta.Item)
	if ok {
		return loadableValueItem.GetField(key)
	}

	return nil, fmt.Errorf("not a valid map or item: %T", value)
}

func GetReferenceKey(value any) (string, error) {
	if value == nil {
		return "", nil
	}

	valueString, ok := value.(string)
	if ok {
		return valueString, nil
	}

	fk, err := GetFieldValue(value, commonfields.Id)
	if err != nil {
		return "", err
	}

	return GetReferenceKey(fk)
}

// NewFieldChanges function returns a template that can merge field changes
func NewFieldChanges(templateString string, collectionMetadata *CollectionMetadata, metadata *MetadataCache) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(item meta.Item, key string) (any, error) {
		fieldMetadata, err := collectionMetadata.GetFieldWithMetadata(key, metadata)
		if err != nil {
			return nil, err
		}
		val, err := item.GetField(key)
		if err != nil {
			return nil, fmt.Errorf("missing key %s : %s : %s", key, collectionMetadata.GetFullName(), templateString)
		}
		if IsReference(fieldMetadata.Type) {
			key, err := GetReferenceKey(val)
			if err != nil {
				return nil, err
			}
			if key == "" {
				return nil, fmt.Errorf("bad reference key in template: %s", templateString)
			}
			return key, nil
		}
		return val, nil
	})
}
