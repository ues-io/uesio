package file

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"time"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"gopkg.in/yaml.v3"
)

const CACHE_FOR_1_YEAR = "private, no-transform, max-age=31536000, s-maxage=31536000"

func RespondJSON(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/json")

	err := json.NewEncoder(w).Encode(v)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// TODO: UNUSED
func respondYAML(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/yaml")

	err := yaml.NewEncoder(w).Encode(v)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func respondFile(w http.ResponseWriter, r *http.Request, fileRequest *FileRequest, stream io.ReadCloser) {
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
		if fileRequest.TreatAsImmutable() {
			w.Header().Set("Cache-Control", CACHE_FOR_1_YEAR)
		}
		http.ServeContent(w, r, fileRequest.Path, fileRequest.LastModified, seeker)

		return
	}

	mimeType := mime.TypeByExtension(filepath.Ext(fileRequest.Path))

	w.Header().Set("content-type", mimeType)

	_, err := io.Copy(w, stream)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, "Failed to Transfer", http.StatusInternalServerError)
		return
	}

}

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	resourceVersion := vars["version"]

	session := middleware.GetSession(r)

	file := meta.NewBaseFile(namespace, name)

	err := bundle.Load(file, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	_, stream, err := bundle.GetItemAttachment(file, file.Path, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	respondFile(w, r, &FileRequest{
		Path:         file.Path,
		LastModified: time.Unix(file.UpdatedAt, 0),
		Namespace:    namespace,
		Version:      resourceVersion,
	}, stream)

}
