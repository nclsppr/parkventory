package com.parkventory.notifications;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;

import static io.quarkus.scheduler.Scheduled.ConcurrentExecution.SKIP;

@ApplicationScoped
public class OutboxJob {
    private final OutboxDeliveryService delivery;

    public OutboxJob(OutboxDeliveryService delivery) {
        this.delivery = delivery;
    }

    @Scheduled(every = "${parkventory.outbox.poll-interval}", concurrentExecution = SKIP)
    void deliverPendingEmails() {
        for (int delivered = 0; delivered < 10 && delivery.deliverNext(); delivered += 1) {
            // Drain a small bounded batch on each tick.
        }
    }
}
