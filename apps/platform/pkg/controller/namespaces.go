package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getNamespaces(metadataType string, session *sess.Session) (map[string]bool, error) {

	namespaces := session.GetContextNamespaces()
	if metadataType == "" {
		return namespaces, nil
	}

	// If a type was specified, filter out namespaces that have no items from that type.
	for namespace := range namespaces {
		collection, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		hasSome, err := bundle.HasAny(collection, namespace, nil, session)
		if err != nil {
			return nil, err
		}
		if !hasSome {
			delete(namespaces, namespace)
		}
	}

	return namespaces, nil
}

func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]

	namespaces, err := getNamespaces(metadatatype, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &namespaces)
}
