package com.parkventory.dashboard;

import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
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
@Tag(name = "Parkventory demo")
public class DashboardResource {
    private final DashboardService service;

    public DashboardResource(DashboardService service) {
        this.service = service;
    }

    @GET
    @Path("/dashboard")
    public Dashboard dashboard() {
        return service.dashboard();
    }

    @POST
    @Path("/shares")
    public ActionResponse share(@Valid ShareRequest request) {
        return service.share(request);
    }

    @POST
    @Path("/availability/{availabilityId}/reservations")
    public ActionResponse reserve(@PathParam("availabilityId") String availabilityId) {
        return service.reserve(availabilityId);
    }

    @POST
    @Path("/invitations")
    public ActionResponse invite(@Valid InvitationRequest request) {
        return service.invite(request);
    }
}
