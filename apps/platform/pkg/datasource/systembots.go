package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getIDsFromUpdatesAndDeletes(request *adapt.SaveOp) []string {
	keys := []string{}
	for i := range request.Updates {
		keys = append(keys, request.Updates[i].IDValue)
	}
	for i := range request.Deletes {
		keys = append(keys, request.Deletes[i].IDValue)
	}
	return keys
}

func clearHostForDomains(ids []string) error {
	keys := []string{}
	for _, id := range ids {
		key, err := getHostKeyFromDomainId(id)
		if err != nil {
			return err
		}
		keys = append(keys, key)
	}

	return cache.DeleteKeys(keys)
}

func getHostKeyFromDomainId(id string) (string, error) {
	idParts := strings.Split(id, "_")
	if len(idParts) != 2 {
		return "", errors.New("Bad Domain ID")
	}
	return cache.GetHostKey(idParts[1], idParts[0]), nil
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
	return bundle.IsValid(items, wsSession, connection)

}

func checkWorkspaceID(currentWorkspace *string, change *adapt.ChangeItem) error {

	workspaceID, err := change.GetFieldAsString("uesio/studio.workspace->uesio/core.id")
	if err != nil {
		return err //if error workspaceID, err := change.GetFieldAsString("uesio/studio.workspace")
	}

	if *currentWorkspace == "" {
		*currentWorkspace = workspaceID
	}

	if *currentWorkspace != workspaceID {
		return errors.New("Can't change different WS or APPS")
	}

	return nil
}

func getAllItems(allKeys map[string]map[string]bool) ([]meta.BundleableItem, error) {

	var all []meta.BundleableItem

	collectionItems, err := meta.NewCollections(allKeys["collection"])
	if err != nil {
		return nil, err
	}

	viewItems, err := meta.NewViews(allKeys["view"])
	if err != nil {
		return nil, err
	}

	themeItems, err := meta.NewThemes(allKeys["theme"])
	if err != nil {
		return nil, err
	}

	if collectionItems != nil {
		all = append(all, collectionItems...)
	}
	if viewItems != nil {
		all = append(all, viewItems...)
	}
	if themeItems != nil {
		all = append(all, themeItems...)
	}
	return all, nil
}

func isRequired(value, metadataType, field string) error {

	if value == "" {
		return errors.New(metadataType + ": " + field + " is required")
	}

	return nil

}
