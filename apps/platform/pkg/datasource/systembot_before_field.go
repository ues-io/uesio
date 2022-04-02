package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
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

	if len(collectionKeys) > 0 {
		//This creates a copy of the session
		//wsSession := session.RemoveWorkspaceContext()

		idSplit := strings.Split(workspaceID, "_")

		fmt.Println("Doing this")
		fmt.Println("app: " + idSplit[0])
		fmt.Println("workspace: " + idSplit[1])

		fmt.Println("Should Check Keys:")
		fmt.Println(collectionKeys)

		/*
			for key := range collectionKeys {
				newCollection, _ := meta.NewCollection(key)
				items = append(items, newCollection)
			}

			err := AddWorkspaceContext(idSplit[0], idSplit[1], wsSession)
			if err != nil {
				println(err.Error())
			}

			err = bundle.IsValid(items, wsSession)
			if err != nil {
				return err
			}
		*/
	}
	return nil
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
