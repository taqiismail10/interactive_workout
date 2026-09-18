package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	api "interactiveworkout/api/internal"
	"interactiveworkout/api/internal/store"
)

func main() {
	api.LoadEnv()
	defaultOrigin := os.Getenv("ORIGIN")
	if defaultOrigin == "" {
		defaultOrigin = "http://localhost:3000"
	}
	origin := flag.String("origin", defaultOrigin, "Allowed browser origin for CORS")
	addr := flag.String("addr", ":8080", "HTTP listen address")
	database := flag.String("database", os.Getenv("DATABASE_URL"), "PostgreSQL connection string")
	flag.Parse()
	if *database == "" {
		fail("DATABASE_URL is required")
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	pool, err := store.NewPool(ctx, *database)
	if err != nil {
		fail("connect: %v", err)
	}
	defer pool.Close()
	server := &http.Server{
		Addr: *addr, Handler: api.New(store.New(pool), *origin),
		ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 30 * time.Second,
		WriteTimeout: 30 * time.Second, IdleTimeout: 120 * time.Second,
	}
	errorChannel := make(chan error, 1)
	go func() { errorChannel <- server.ListenAndServe() }()
	fmt.Printf("listening on %s\n", *addr)
	select {
	case err := <-errorChannel:
		fail("server: %v", err)
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdown); err != nil {
		fmt.Fprintln(os.Stderr, "shutdown:", err)
	}
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
