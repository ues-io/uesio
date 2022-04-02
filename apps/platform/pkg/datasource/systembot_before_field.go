package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func runFieldBeforeSaveBot(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return fieldCheck(request, connection, session)
}

func GetWorkspaceID(change adapt.ChangeItem) (string, error) {
	ws, err := change.GetField("uesio/studio.workspace->uesio/core.id")
	if err != nil {
		return "", err
	}
	wsStr, ok := ws.(string)
	if !ok {
		return "", errors.New("could not get workspace id")
	}
	return wsStr, nil
}

func fieldCheck(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	collectionKeys := map[string]bool{}
	var workspaceID string

	for i := range *request.Inserts {
		change := (*request.Inserts)[i]

		currentWorkspaceID, err := GetWorkspaceID(change)
		if err != nil {
			return err
		}

		if i != 0 && currentWorkspaceID != workspaceID {
			return errors.New("Can't change different WS or APPS")
		}
		if i == 0 {
			workspaceID = currentWorkspaceID
		}

		ftype, err := change.GetField("uesio/studio.type")
		if err != nil {
			return errors.New("Field: Type is required")
		}
		if ftype == "REFERENCE" {
			referencedCollection, _ := change.GetField("uesio/studio.reference->uesio/studio.collection")
			if referencedCollection == nil {
				return errors.New("Field: Referenced Collection is required")
			}
			referencedCollectionValue := referencedCollection.(string)
			if referencedCollectionValue == "" {
				return errors.New("Field: Referenced Collection is required")
			}
			collectionKeys[referencedCollectionValue] = true
		}
	}

	for i := range *request.Updates {
		change := (*request.Updates)[i]
		currentWorkspaceID, err := GetWorkspaceID(change)
		if err != nil {
			return err
		}

		if i != 0 && currentWorkspaceID != workspaceID {
			return errors.New("Can't change different WS or APPS")
		}
		if i == 0 {
			workspaceID = currentWorkspaceID
		}

		ftype, err := change.GetField("uesio/studio.type")
		if err != nil {
			return errors.New("Field: Type is required")
		}
		if ftype == "REFERENCE" {
			referencedCollection, _ := change.GetField("uesio/studio.reference->studio.collection")
			if referencedCollection == nil {
				return errors.New("Field: Referenced Collection is required")
			}
			referencedCollectionValue := referencedCollection.(string)
			if referencedCollectionValue == "" {
				return errors.New("Field: Referenced Collection is required")
			}
			collectionKeys[referencedCollectionValue] = true
		}

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
