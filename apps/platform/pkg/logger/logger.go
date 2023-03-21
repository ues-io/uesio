package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

// Entry defines a log entry.
type Entry struct {
	Message  string `json:"message"`
	Severity string `json:"severity,omitempty"`
	Trace    string `json:"logging.googleapis.com/trace,omitempty"`

	// Stackdriver Log Viewer allows filtering and display of this as `jsonPayload.component`.
	Component string `json:"component,omitempty"`
}

const (
	// INFO severity
	INFO = "INFO"
	// ERROR severity
	ERROR = "ERROR"
)

// String renders an entry structure to the JSON format expected by Stackdriver.
func (e Entry) String() string {
	if e.Severity == "" {
		e.Severity = INFO
	}
	out, err := json.Marshal(e)
	if err != nil {
		log.Printf("json.Marshal: %v", err)
	}
	return string(out)
}

func init() {
	// Disable log prefixes such as the default timestamp.
	// Prefix text prevents the message from being parsed as JSON.
	// A timestamp is added when shipping logs to Stackdriver.
	log.SetFlags(0)
}

func Info(message string) {
	Log(message, INFO)
}

// LogWithTrace function
func LogWithTrace(r *http.Request, message, severity string) {

	projectID := os.Getenv("GOOGLE_CLOUD_PROJECT")

	// Derive the traceID associated with the current request.
	var trace string
	if projectID != "" {
		traceHeader := r.Header.Get("X-Cloud-Trace-Context")
		traceParts := strings.Split(traceHeader, "/")
		if len(traceParts) > 0 && len(traceParts[0]) > 0 {
			trace = fmt.Sprintf("projects/%s/traces/%s", projectID, traceParts[0])
		}
	}

	log.Println(Entry{
		Trace:    trace,
		Message:  message,
		Severity: severity,
	})
}

func Log(message, severity string) {
	log.Println(Entry{
		Message:  message,
		Severity: severity,
	})
}

func LogError(err error) {
	Log(err.Error(), ERROR)
}

func LogErrorWithTrace(r *http.Request, err error) {
	LogWithTrace(r, err.Error(), ERROR)
}
