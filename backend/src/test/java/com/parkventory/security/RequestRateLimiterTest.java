package com.parkventory.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestRateLimiterTest {
    @Test
    void rejectsRequestsBeyondTheFixedWindowAndRecoversAfterIt() {
        AtomicLong now = new AtomicLong(1_000);
        RequestRateLimiter limiter = new RequestRateLimiter(now::get);

        assertTrue(limiter.acquire("login", "ip:a", 2, Duration.ofSeconds(10)).allowed());
        assertTrue(limiter.acquire("login", "ip:a", 2, Duration.ofSeconds(10)).allowed());
        RequestRateLimiter.Decision rejected =
                limiter.acquire("login", "ip:a", 2, Duration.ofSeconds(10));
        assertFalse(rejected.allowed());
        assertEquals(9, rejected.retryAfterSeconds());

        now.set(10_001);
        assertTrue(limiter.acquire("login", "ip:a", 2, Duration.ofSeconds(10)).allowed());
    }

    @Test
    void isolatesScopesAndSubjects() {
        RequestRateLimiter limiter = new RequestRateLimiter(() -> 1_000);

        assertTrue(limiter.acquire("mutation", "session:a", 1, Duration.ofMinutes(1)).allowed());
        assertFalse(limiter.acquire("mutation", "session:a", 1, Duration.ofMinutes(1)).allowed());
        assertTrue(limiter.acquire("mutation", "session:b", 1, Duration.ofMinutes(1)).allowed());
        assertTrue(limiter.acquire("invitation", "session:a", 1, Duration.ofMinutes(1)).allowed());
    }

    @Test
    void capacityPressureEvictsWithoutRejectingEveryNewSubject() {
        AtomicLong clock = new AtomicLong(0);
        RequestRateLimiter limiter = new RequestRateLimiter(clock::get, 2);

        assertTrue(limiter.acquire("mutation-ip", "ip:a", 10, Duration.ofMinutes(1)).allowed());
        clock.incrementAndGet();
        assertTrue(limiter.acquire("mutation-ip", "ip:b", 10, Duration.ofMinutes(1)).allowed());
        clock.incrementAndGet();
        assertTrue(limiter.acquire("mutation-ip", "ip:c", 10, Duration.ofMinutes(1)).allowed());
        assertEquals(2, limiter.bucketCount());
    }
}
