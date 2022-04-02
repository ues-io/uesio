package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	collectionKeys := map[string]bool{}
	var workspaceID string

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		err := checkWorkspaceID(&workspaceID, change)
		if err != nil {
			return err
		}

		ftype, err := change.GetFieldAsString("uesio/studio.type")
		if err != nil || ftype == "" {
			return errors.New("Field: Type is required")
		}
		if ftype == "REFERENCE" {
			referencedCollection, _ := change.GetFieldAsString("uesio/studio.reference->uesio/studio.collection")
			if referencedCollection == "" {
				return errors.New("Field: Referenced Collection is required")
			}
			collectionKeys[referencedCollection] = true
		}
		return nil
	})
	if err != nil {
		return err
	}

	items, err := meta.NewCollections(collectionKeys)
	if err != nil {
		return err
	}

	return checkValidItems(workspaceID, items, session, connection)

}

func checkValidItems(workspaceID string, items []meta.BundleableItem, session *sess.Session, connection adapt.Connection) error {
	if len(items) == 0 {
		return nil
	}

	//This creates a copy of the session
	wsSession := session.RemoveWorkspaceContext()
	idSplit := strings.Split(workspaceID, "_")

	err := AddWorkspaceContext(idSplit[0], idSplit[1], wsSession)
	if err != nil {
		return err
	}
	if err != nil {
		return err
	}
	return bundle.IsValid(items, wsSession, connection)

}

func checkWorkspaceID(currentWorkspace *string, change *adapt.ChangeItem) error {

	workspaceID, err := change.GetFieldAsString("uesio/studio.workspace->uesio/core.id")
	if err != nil {
		return err
	}

	if *currentWorkspace == "" {
		*currentWorkspace = workspaceID
	}

	if *currentWorkspace != workspaceID {
		return errors.New("Can't change different WS or APPS")
	}

	return nil
}
