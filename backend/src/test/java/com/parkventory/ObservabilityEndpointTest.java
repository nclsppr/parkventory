package com.parkventory;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;

@QuarkusTest
class ObservabilityEndpointTest {
    @Test
    void exposesPrometheusMetricsAtThePackagedScrapePath() {
        given()
                .header("Accept", "text/plain")
                .when().get("/q/metrics")
                .then()
                .statusCode(200)
                .header("Content-Type", containsString("text/plain"))
                .body(containsString("# HELP"));
    }
}
