package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/felixge/httpsnoop"

	"github.com/thecloudmasters/uesio/pkg/env"
)

// By default, we only output logs at INFO level or higher.
// To minimize noise from per-request logs, we treat all 2xx/3xx
// request logs as DEBUG, so they will not be recorded.
// Only 4xx/5xx requests will be logged.
// Set LOG_LEVEL=-4 to log literally EVERYTHING.
var minLogLevel slog.Level

func init() {
	if val, isSet := os.LookupEnv("LOG_LEVEL"); isSet {
		if levelVar, err := strconv.Atoi(val); err == nil {
			minLogLevel = (slog.Level)(levelVar)
		}
	}
	handlerOptions := &slog.HandlerOptions{
		AddSource:   false,
		ReplaceAttr: nil,
		// 0 (INFO) is the default so a zero value is safe
		Level: minLogLevel,
	}
	var handler slog.Handler
	// In Dev mode, use our pretty dev logger
	if env.InDevMode() {
		handler = NewDevLogHandler(os.Stdout, handlerOptions)
	} else {
		// In prod, use a structured JSON handler
		handler = slog.NewJSONHandler(os.Stdout, handlerOptions)
	}

	slog.SetDefault(slog.New(NewRequestContextInjector(handler)))
}

func LogRequestHandler(h http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {

		method := r.Method
		uri := r.URL.String()

		// this runs handler h and captures information about the HTTP request
		m := httpsnoop.CaptureMetrics(h, w, r)

		// TODO: send metrics to StatsD for every request regardless of code,
		// so that we get visibility into app/user/URI specific request/response metrics

		// Don't bother to do this per-request logging if the response code is below the minimum
		requestLogLevel := getRequestLogLevel(m.Code)
		if requestLogLevel < minLogLevel {
			return
		}

		slog.LogAttrs(r.Context(), requestLogLevel, fmt.Sprintf("%s %s", method, uri),
			slog.Group(
				"stats",
				slog.Int("code", m.Code),
				slog.Duration("duration", m.Duration.Round(time.Millisecond)),
				slog.Int64("size", m.Written),
			))
	}

	return http.HandlerFunc(fn)
}

func getRequestLogLevel(responseCode int) slog.Level {
	if responseCode >= 500 {
		return slog.LevelError
	}
	if responseCode >= 400 {
		return slog.LevelWarn
	}
	return slog.LevelDebug
}
