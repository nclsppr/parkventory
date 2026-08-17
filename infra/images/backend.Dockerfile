# syntax=docker/dockerfile:1.24.0@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89
# check=error=true

ARG MAVEN_IMAGE=scratch
ARG TEMURIN_RUNTIME_IMAGE=scratch

FROM ${MAVEN_IMAGE} AS build
WORKDIR /workspace/backend

COPY backend/pom.xml ./
COPY backend/src src

RUN --mount=type=cache,id=parkventory-maven,target=/root/.m2,sharing=locked \
    mvn --version | grep -F "Apache Maven 3.9.16" \
    && mvn --batch-mode --no-transfer-progress \
      -DskipTests \
      -Dquarkus.analytics.disabled=true \
      package

FROM ${TEMURIN_RUNTIME_IMAGE} AS runtime

RUN groupadd --gid 10001 parkventory \
    && useradd \
      --no-log-init \
      --uid 10001 \
      --gid parkventory \
      --home-dir /opt/parkventory \
      --shell /usr/sbin/nologin \
      parkventory

WORKDIR /opt/parkventory
COPY --from=build --chown=parkventory:parkventory \
  /workspace/backend/target/quarkus-app/ ./quarkus-app/
COPY --chmod=0555 --chown=parkventory:parkventory \
  infra/images/backend-entrypoint.sh ./bin/backend-entrypoint
COPY --chmod=0555 --chown=parkventory:parkventory \
  infra/images/backend-migrate.sh ./bin/backend-migrate
COPY --chmod=0555 --chown=parkventory:parkventory \
  infra/images/backend-healthcheck.sh ./bin/backend-healthcheck

USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["/opt/parkventory/bin/backend-entrypoint"]
