package com.parkventory.security;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Objects;
import java.util.function.LongSupplier;

@ApplicationScoped
public class RequestRateLimiter {
    private static final int DEFAULT_MAX_BUCKETS = 50_000;

    private final HashMap<BucketKey, Bucket> buckets = new HashMap<>();
    private final ArrayDeque<BucketKey> admissionOrder = new ArrayDeque<>();
    private final LongSupplier nowMillis;
    private final int maxBuckets;

    public RequestRateLimiter() {
        this(System::currentTimeMillis, DEFAULT_MAX_BUCKETS);
    }

    RequestRateLimiter(LongSupplier nowMillis) {
        this(nowMillis, DEFAULT_MAX_BUCKETS);
    }

    RequestRateLimiter(LongSupplier nowMillis, int maxBuckets) {
        this.nowMillis = Objects.requireNonNull(nowMillis);
        if (maxBuckets < 1) {
            throw new IllegalArgumentException("Le nombre de compartiments doit être positif.");
        }
        this.maxBuckets = maxBuckets;
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

        synchronized (buckets) {
            Bucket current = buckets.get(key);
            if (current == null) {
                evictForAdmission();
                admissionOrder.addLast(key);
            }
            int count = current == null || current.windowStartMillis() != windowStart
                    ? 1
                    : current.count() + 1;
            long expiresAt = windowStart + windowMillis;
            buckets.put(key, new Bucket(windowStart, expiresAt, count));
            return count <= limit
                    ? Decision.allowed(limit - count)
                    : Decision.rejected(retryAfterSeconds(now, expiresAt));
        }
    }

    private void evictForAdmission() {
        while (buckets.size() >= maxBuckets) {
            BucketKey oldest = admissionOrder.pollFirst();
            if (oldest == null) {
                return;
            }
            buckets.remove(oldest);
        }
    }

    int bucketCount() {
        synchronized (buckets) {
            return buckets.size();
        }
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
