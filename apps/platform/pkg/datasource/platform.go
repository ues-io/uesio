package datasource

import (
	"errors"
	"strconv"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection metadata.CollectionableGroup
	Options    *reqs.SaveOptions
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

// platformLoads function
func platformLoads(ops []adapters.LoadOp, session *sess.Session) error {

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
func PlatformLoad(group metadata.CollectionableGroup, conditions []reqs.LoadRequestCondition, session *sess.Session) error {
	return platformLoads([]adapters.LoadOp{
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
func PlatformLoadOne(item metadata.CollectionableItem, conditions []reqs.LoadRequestCondition, session *sess.Session) error {
	collection := item.GetCollection()

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

	return copier.Copy(item, collection.GetItem(0))
}

// PlatformDelete function
func PlatformDelete(collectionID string, request map[string]reqs.DeleteRequest, session *sess.Session) error {
	requests := []reqs.SaveRequest{{
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

// PlatformSave function
func PlatformSave(psrs []PlatformSaveRequest, session *sess.Session) ([]reqs.SaveResponse, error) {

	requests := []reqs.SaveRequest{}

	for _, psr := range psrs {
		collection := psr.Collection
		collectionName := collection.GetName()

		changeRequests := map[string]reqs.ChangeRequest{}

		index := 0

		err := collection.Loop(func(item metadata.LoadableItem) error {
			fieldChanges := map[string]interface{}{}
			for _, field := range collection.GetFields() {
				fieldValue, err := item.GetField(field.ID)
				if err != nil {
					return err
				}
				fieldChanges[field.ID] = fieldValue
			}
			changeRequests[strconv.Itoa(index)] = reqs.ChangeRequest{
				FieldChanges: fieldChanges,
			}
			index++
			return nil
		})
		if err != nil {
			return nil, err
		}

		requests = append(requests, reqs.SaveRequest{
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
		return nil, err
	}

	return saveResponse.Wires, nil
}
