package controller

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"gopkg.in/yaml.v3"
)

func respondJSON(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/json")

	err := json.NewEncoder(w).Encode(v)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func respondYAML(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/yaml")

	err := yaml.NewEncoder(w).Encode(v)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func respondFile(w http.ResponseWriter, r *http.Request, mimeType string, stream io.ReadCloser) {
	defer stream.Close()

	w.Header().Set("content-type", mimeType)

	_, err := io.Copy(w, stream)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, "Failed to Transfer", http.StatusInternalServerError)
		return
	}
}
