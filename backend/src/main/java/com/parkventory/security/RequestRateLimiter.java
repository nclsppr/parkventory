package com.parkventory.security;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

@ApplicationScoped
public class RequestRateLimiter {
    private static final int MAX_BUCKETS = 50_000;

    private final ConcurrentHashMap<BucketKey, Bucket> buckets = new ConcurrentHashMap<>();
    private final LongSupplier nowMillis;

    public RequestRateLimiter() {
        this(System::currentTimeMillis);
    }

    RequestRateLimiter(LongSupplier nowMillis) {
        this.nowMillis = Objects.requireNonNull(nowMillis);
    }

    public Decision acquire(String scope, String subject, int limit, Duration window) {
        if (limit < 1 || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("La limite et sa fenêtre doivent être positives.");
        }
        long windowMillis = window.toMillis();
        if (windowMillis < 1) {
            throw new IllegalArgumentException("La fenêtre doit durer au moins une milliseconde.");
        }

        long now = nowMillis.getAsLong();
        long windowStart = Math.floorDiv(now, windowMillis) * windowMillis;
        BucketKey key = new BucketKey(scope, subject);
        if (buckets.size() >= MAX_BUCKETS && !buckets.containsKey(key)) {
            buckets.entrySet().removeIf(entry -> entry.getValue().expiresAtMillis() <= now);
            if (buckets.size() >= MAX_BUCKETS) {
                return Decision.rejected(retryAfterSeconds(now, windowStart + windowMillis));
            }
        }

        Decision[] decision = new Decision[1];
        buckets.compute(key, (ignored, current) -> {
            int count = current == null || current.windowStartMillis() != windowStart
                    ? 1
                    : current.count() + 1;
            long expiresAt = windowStart + windowMillis;
            decision[0] = count <= limit
                    ? Decision.allowed(limit - count)
                    : Decision.rejected(retryAfterSeconds(now, expiresAt));
            return new Bucket(windowStart, expiresAt, count);
        });
        return decision[0];
    }

    private static long retryAfterSeconds(long now, long expiresAt) {
        return Math.max(1, Math.ceilDiv(Math.max(1, expiresAt - now), 1_000));
    }

    private record BucketKey(String scope, String subject) {
        private BucketKey {
            Objects.requireNonNull(scope);
            Objects.requireNonNull(subject);
        }
    }

    private record Bucket(long windowStartMillis, long expiresAtMillis, int count) {
    }

    public record Decision(boolean allowed, int remaining, long retryAfterSeconds) {
        private static Decision allowed(int remaining) {
            return new Decision(true, remaining, 0);
        }

        private static Decision rejected(long retryAfterSeconds) {
            return new Decision(false, 0, retryAfterSeconds);
        }
    }
}
