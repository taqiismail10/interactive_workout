package main

import (
	"context"
	"encoding/csv"
	"flag"
	"fmt"
	"os"
	"time"

	api "interactiveworkout/api/internal"
	"interactiveworkout/api/internal/store"
)

func main() {
	api.LoadEnv()
	database := flag.String("database", os.Getenv("DATABASE_URL"), "PostgreSQL connection string")
	output := flag.String("out", "waitlist.csv", "Output CSV file")
	timeout := flag.Duration("timeout", 30*time.Second, "Query timeout")
	flag.Parse()
	if *database == "" {
		fail("DATABASE_URL is required")
	}
	pool, err := store.NewPool(context.Background(), *database)
	if err != nil {
		fail("connect: %v", err)
	}
	defer pool.Close()
	ctx, cancel := context.WithTimeout(context.Background(), *timeout)
	defer cancel()
	signups, err := store.ListAll(ctx, pool)
	if err != nil {
		fail("query: %v", err)
	}
	if len(signups) == 0 {
		fmt.Printf("exported 0 signups to %s (empty list)\n", *output)
		return
	}
	file, err := os.Create(*output)
	if err != nil {
		fail("create %s: %v", *output, err)
	}
	writer := csv.NewWriter(file)
	if err := writer.Write([]string{"email", "interest", "referralCode", "referredBy", "referralCount", "position", "createdAt"}); err != nil {
		fail("write header: %v", err)
	}
	for _, signup := range signups {
		interest := ""
		if signup.Interest != nil {
			interest = *signup.Interest
		}
		if err := writer.Write([]string{signup.Email, interest, signup.ReferralCode, valueOrEmpty(signup.ReferredBy), fmt.Sprintf("%d", signup.ReferralCount), fmt.Sprintf("%d", signup.Position), signup.CreatedAt.UTC().Format(time.RFC3339)}); err != nil {
			fail("write row: %v", err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		fail("write: %v", err)
	}
	if err := file.Close(); err != nil {
		fail("close: %v", err)
	}
	fmt.Printf("exported %d signups to %s\n", len(signups), *output)
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
