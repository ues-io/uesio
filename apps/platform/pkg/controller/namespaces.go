package controller

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/file"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getNamespaces(metadataType string, session *sess.Session) ([]string, error) {

	if metadataType == "" {
		return session.GetContextNamespaces(), nil
	}

	filteredNamespaces := []string{}
	// If a type was specified, filter out namespaces that have no items from that type.
	for _, namespace := range session.GetContextNamespaces() {

		collection, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		hasSome, err := bundle.HasAny(collection, namespace, nil, session, nil)
		if err != nil {
			return nil, err
		}
		if hasSome {
			filteredNamespaces = append(filteredNamespaces, namespace)
		}
	}

	return filteredNamespaces, nil
}

func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]

	namespaces, err := getNamespaces(metadatatype, session)
	if err != nil {
		HandleError(w, err)
		return
	}

	file.RespondJSON(w, r, &namespaces)
}
