package controller

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_worker"
)

func RunUsageWorker(w http.ResponseWriter, r *http.Request) {
	if err := usage_worker.UsageWorker(r.Context()); err != nil {
		ctlutil.HandleError(r.Context(), w, fmt.Errorf("usage worker failed: %w", err))
		return
	}
	fmt.Fprintf(w, "Usage Worker Success")
}
