package jsdialect

import (
	"context"
	"fmt"
	"log/slog"
	"sync/atomic"
	"time"

	"github.com/thecloudmasters/uesio/pkg/meta"
)

type BotLogAPI struct {
	bot     *meta.Bot
	counter uint64
	start   time.Time
	ctx     context.Context
}

func NewBotLogAPI(ctx context.Context, bot *meta.Bot) *BotLogAPI {
	return &BotLogAPI{
		bot:     bot,
		counter: 0,
		start:   time.Now(),
		// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
		// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
		ctx: ctx,
	}
}

// BotLogEntry defines a bot logging entry
type BotLogEntry struct {
	Sequence     uint64 `json:"sequence"`
	BotName      string `json:"name"`
	BotNamespace string `json:"namespace"`
	Elapsed      string `json:"elapsed"`
	Data         any    `json:"data,omitempty"`
}

// LogValue implements the LogValuer interface to define how this struct
// should be serialized by structured loggers
func (e *BotLogEntry) LogValue() slog.Value {
	var attrs []slog.Attr
	if e.Sequence != 0 {
		attrs = append(attrs, slog.Uint64("sequence", e.Sequence))
	}
	if e.Elapsed != "" {
		attrs = append(attrs, slog.String("elapsed", e.Elapsed))
	}
	if e.BotName != "" {
		attrs = append(attrs, slog.String("name", e.BotName))
	}
	if e.BotNamespace != "" {
		attrs = append(attrs, slog.String("namespace", e.BotNamespace))
	}
	// TODO: Obscure any data in here unless we are in local development, to prevent exposure of PII, etc.
	if e.Data != nil {
		attrs = append(attrs, slog.Any("data", e.Data))
	}
	return slog.GroupValue(attrs...)
}

func (logapi *BotLogAPI) log(level slog.Level, message string, data any) {
	elapsed := time.Since(logapi.start)
	logEntry := BotLogEntry{
		Elapsed:      fmt.Sprintf("%ds%dms", int64(elapsed.Seconds()), elapsed.Milliseconds()),
		BotName:      logapi.bot.Name,
		BotNamespace: logapi.bot.Namespace,
		Data:         data,
		Sequence:     atomic.AddUint64(&logapi.counter, 1),
	}
	slog.Log(logapi.ctx, level, message, "bot", &logEntry)
}

func (logapi *BotLogAPI) Info(message string, data any) {
	logapi.log(slog.LevelInfo, message, data)
}
func (logapi *BotLogAPI) Warn(message string, data any) {
	logapi.log(slog.LevelWarn, message, data)
}
func (logapi *BotLogAPI) Error(message string, data any) {
	logapi.log(slog.LevelError, message, data)
}
