package datasource

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection metadata.CollectionableGroup
	Options    *adapters.SaveOptions
}

// RecordNotFoundError struct
type RecordNotFoundError struct {
	message string
}

func (e *RecordNotFoundError) Error() string { return e.message }

// NewRecordNotFoundError creates a new record not found error
func NewRecordNotFoundError(message string) *RecordNotFoundError {
	return &RecordNotFoundError{
		message: message,
	}
}

// PlatformLoads function
func PlatformLoads(ops []adapters.LoadOp, session *sess.Session) error {

	_, err := Load(
		ops,
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	return nil
}

// PlatformLoad function
func PlatformLoad(group metadata.CollectionableGroup, conditions []adapters.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoads([]adapters.LoadOp{
		{
			WireName:       group.GetName() + "Wire",
			CollectionName: "uesio." + group.GetName(),
			Collection:     group,
			Conditions:     conditions,
			Fields:         group.GetFields(),
		},
	}, session)
}

// PlatformLoadOne function
func PlatformLoadOne(item metadata.CollectionableItem, conditions []adapters.LoadRequestCondition, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}

	err := PlatformLoad(collection, conditions, session)
	if err != nil {
		return err
	}

	length := collection.Len()

	if length == 0 {
		return NewRecordNotFoundError("Couldn't find item from platform load: " + collection.GetName())
	}
	if length > 1 {
		return errors.New("Duplicate item found from platform load: " + collection.GetName())
	}

	return nil
}

// PlatformDelete function
func PlatformDelete(collectionID string, request map[string]adapters.DeleteRequest, session *sess.Session) error {
	requests := []adapters.SaveRequest{{
		Wire:       "deleteRequest",
		Collection: "uesio." + collectionID,
		Deletes:    request,
	}}
	_, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)

	return err
}

// PlatformSaves function
func PlatformSaves(psrs []PlatformSaveRequest, session *sess.Session) error {

	requests := []adapters.SaveRequest{}

	for _, psr := range psrs {
		collection := psr.Collection
		collectionName := collection.GetName()

		changeRequests := map[string]adapters.ChangeRequest{}

		index := 0

		err := collection.Loop(func(item adapters.LoadableItem) error {
			fieldChanges := map[string]interface{}{}
			for _, field := range collection.GetFields() {
				fieldValue, err := item.GetField(field.ID)
				if err != nil {
					return err
				}
				fieldChanges[field.ID] = fieldValue
			}
			changeRequests[strconv.Itoa(index)] = adapters.ChangeRequest{
				FieldChanges: fieldChanges,
			}
			index++
			return nil
		})
		if err != nil {
			return err
		}

		requests = append(requests, adapters.SaveRequest{
			Collection: "uesio." + collectionName,
			Wire:       "AnyKey",
			Changes:    changeRequests,
			Options:    psr.Options,
		})
	}

	saveResponse, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	for i, psr := range psrs {
		collection := psr.Collection
		wire := saveResponse.Wires[i]
		for j := range wire.ChangeResults {
			num, err := strconv.Atoi(j)
			if err != nil {
				return err
			}
			result, ok := wire.ChangeResults[j]
			if !ok {
				continue
			}

			item := collection.GetItem(num)
			for fieldName, value := range result.Data {
				err := item.SetField(fieldName, value)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// PlatformSave function
func PlatformSave(psr PlatformSaveRequest, session *sess.Session) error {
	return PlatformSaves([]PlatformSaveRequest{
		psr,
	}, session)
}

func PlatformSaveOne(item metadata.CollectionableItem, options *adapters.SaveOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}
	return PlatformSave(PlatformSaveRequest{
		Collection: collection,
		Options:    options,
	}, session)
}
