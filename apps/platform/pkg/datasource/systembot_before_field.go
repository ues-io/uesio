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
	return fieldCheck(request, connection, session)
}

func GetWorkspaceName(change adapt.ChangeItem) string {
	ws, _ := change.GetField("uesio/studio.workspace->uesio/core.id")
	wsStr := ws.(string)
	underscorePos := strings.Index(wsStr, "_") + 1
	return wsStr[underscorePos:]
}

func GetAppName(change adapt.ChangeItem) string {
	ws, _ := change.GetField("uesio/studio.collection")
	wsStr := ws.(string)
	dotPos := strings.Index(wsStr, ".")
	return wsStr[0:dotPos]
}

func fieldCheck(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	items := []meta.BundleableItem{}
	appName := ""
	wsName := ""

	for i := range *request.Inserts {
		change := (*request.Inserts)[i]

		if i != 0 {
			if GetAppName(change) != appName || GetWorkspaceName(change) != wsName {
				return errors.New("Can't change different WS or APPS")
			}
		} else {
			appName = GetAppName(change)
			wsName = GetWorkspaceName(change)
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
			newCollection, _ := meta.NewCollection(referencedCollectionValue)
			items = append(items, newCollection)
		}
	}

	for i := range *request.Updates {
		change := (*request.Updates)[i]
		appName = GetAppName(change)
		wsName = GetWorkspaceName(change)

		if i != 0 {
			if GetAppName(change) != appName || GetWorkspaceName(change) != wsName {
				return errors.New("Can't change different WS or APPS")
			}
		} else {
			appName = GetAppName(change)
			wsName = GetWorkspaceName(change)
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
			newCollection, _ := meta.NewCollection(referencedCollectionValue)
			items = append(items, newCollection)
		}

	}

	if items != nil {
		//This creates a copy of the session
		wsSession := session.RemoveWorkspaceContext()

		err := AddWorkspaceContext(appName, wsName, wsSession)
		if err != nil {
			println(err.Error())
		}

		err = bundle.IsValid(items, wsSession)
		if err != nil {
			return err
		}
	}
	return nil
}
