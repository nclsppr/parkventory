package com.parkventory.dashboard;

import com.parkventory.auth.SessionContext;
import com.parkventory.auth.SessionService;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import static com.parkventory.dashboard.ApiModels.*;

@Path("/api/v1")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Parking partagé")
public class DashboardResource {
    private final DashboardService service;
    private final SessionService sessions;

    public DashboardResource(DashboardService service, SessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GET
    @Path("/dashboard")
    public Dashboard dashboard(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken) {
        return service.dashboard(sessions.require(rawSessionToken));
    }

    @POST
    @Path("/spots")
    public ActionResponse declareSpot(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken,
            @Valid SpotRequest request) {
        return service.declareSpot(sessions.require(rawSessionToken), request);
    }

    @POST
    @Path("/shares")
    public ActionResponse share(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken,
            @Valid ShareRequest request) {
        return service.share(sessions.require(rawSessionToken), request);
    }

    @POST
    @Path("/availability/{availabilityId}/reservations")
    @Consumes(MediaType.WILDCARD)
    public ActionResponse reserve(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken,
            @PathParam("availabilityId") String availabilityId,
            @HeaderParam("Idempotency-Key") String idempotencyKey) {
        return service.reserve(
                sessions.require(rawSessionToken),
                availabilityId,
                idempotencyKey);
    }

    @POST
    @Path("/invitations")
    public ActionResponse invite(
            @CookieParam(SessionService.COOKIE_NAME) String rawSessionToken,
            @Valid InvitationRequest request) {
        return service.invite(sessions.require(rawSessionToken), request);
    }
}
