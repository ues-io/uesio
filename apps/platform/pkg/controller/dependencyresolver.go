package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func MetadataList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	conditions := meta.BundleConditions{}
	collectionKeyMap := map[string]bool{}

	if namespace == "uesio/core" && metadatatype == "fields" {
		for _, field := range datasource.BUILTIN_FIELDS {
			collectionKeyMap[field.GetFullName()] = true
		}
		respondJSON(w, r, &collectionKeyMap)
		return
	}

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["uesio/studio.collection"] = grouping
	} else if metadatatype == "bots" {
		conditions["uesio/studio.type"] = grouping
	} else if metadatatype == "componentvariants" {
		conditions["uesio/studio.component"] = grouping
	}

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = bundle.LoadAll(collection, namespace, conditions, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = collection.Loop(func(item loadable.Item, _ string) error {
		var key string
		// Special handling for fields for now
		if metadatatype == "fields" {
			field := item.(*meta.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != grouping {
				return nil
			}
		} else {
			key = item.(meta.BundleableItem).GetKey()
		}
		collectionKeyMap[key] = true
		return nil
	})
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &collectionKeyMap)

}

func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	namespaces := session.GetContextNamespaces()

	// If a type was specified, filter out namespaces that have no items from that type.
	vars := mux.Vars(r)
	metadatatype := vars["type"]
	if metadatatype != "" {
		for namespace := range namespaces {
			collection, err := meta.GetBundleableGroupFromType(metadatatype)
			if err != nil {
				logger.LogErrorWithTrace(r, err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			hasSome, err := bundle.HasAny(collection, namespace, nil, session)
			if err != nil {
				logger.LogErrorWithTrace(r, err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if !hasSome {
				delete(namespaces, namespace)
			}
		}

	}
	respondJSON(w, r, &namespaces)
}
