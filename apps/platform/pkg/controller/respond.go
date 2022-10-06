package controller

import (
	"encoding/json"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"time"

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

func respondFile(w http.ResponseWriter, r *http.Request, fileName string, modTime time.Time, stream io.ReadCloser) {
	if stream == nil {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "application/json")
		resp := make(map[string]string)
		resp["message"] = "Resource Not Found"
		jsonResp, err := json.Marshal(resp)
		if err != nil {
			logger.LogErrorWithTrace(r, err)
		}
		w.Write(jsonResp)
		return
	}

	defer stream.Close()

	seeker, ok := stream.(io.ReadSeekCloser)
	if ok {
		http.ServeContent(w, r, fileName, modTime, seeker)
		return
	}

	mimeType := mime.TypeByExtension(filepath.Ext(fileName))

	w.Header().Set("content-type", mimeType)

	_, err := io.Copy(w, stream)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, "Failed to Transfer", http.StatusInternalServerError)
		return
	}

}
