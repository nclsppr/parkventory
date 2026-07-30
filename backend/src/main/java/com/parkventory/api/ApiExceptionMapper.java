package com.parkventory.api;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<Exception> {
    private static final Logger LOG = Logger.getLogger(ApiExceptionMapper.class);

    @Override
    public Response toResponse(Exception exception) {
        int status = 500;
        String detail = "Une erreur interne empêche de terminer la requête.";

        if (exception instanceof ConstraintViolationException) {
            status = 400;
            detail = "Certains champs sont absents ou invalides.";
        } else if (exception instanceof WebApplicationException webException) {
            status = webException.getResponse().getStatus();
            if (webException.getMessage() != null && !webException.getMessage().isBlank()) {
                detail = webException.getMessage();
            }
        }

        if (status >= 500) {
            LOG.error("Erreur API non gérée.", exception);
        }

        return Response.status(status)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(new ApiProblem(status, detail))
                .build();
    }

    public record ApiProblem(int status, String detail) {
    }
}
