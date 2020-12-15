package controllers

import (
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
)

// MetadataList is good
func MetadataList(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	conditions := reqs.BundleConditions{}

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["uesio.collection"] = grouping
	}

	collection, err := metadata.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = bundles.LoadAll(collection, namespace, conditions, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collectionKeyMap := map[string]bool{}

	collection.Loop(func(item metadata.CollectionableItem) error {
		var key string
		// Special handling for fields for now
		if metadatatype == "fields" {
			field := item.(*metadata.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != grouping {
				return nil
			}
		} else {
			key = item.GetKey()
		}
		collectionKeyMap[key] = true
		return nil
	})

	respondJSON(w, r, &collectionKeyMap)

}

// NamespaceList is good
func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middlewares.GetSession(r)
	namespaces := session.GetContextNamespaces()
	respondJSON(w, r, &namespaces)
}
