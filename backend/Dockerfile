FROM gradle:8.13-jdk21 AS gradle-base

WORKDIR /home/gradle/project

COPY gradlew /home/gradle/project/gradlew
COPY gradle /home/gradle/project/gradle
COPY build.gradle settings.gradle /home/gradle/project/

RUN chmod +x gradlew && \
    ./gradlew --no-daemon build || return 0

FROM gradle-base AS build

COPY src /home/gradle/project/src

RUN ./gradlew --no-daemon clean bootJar -x test

FROM openjdk:21-jdk-slim

WORKDIR /app

COPY --from=build /home/gradle/project/build/libs/*.jar /app/app.jar
COPY --from=build /home/gradle/project/src/main/resources/db/changelog /app/db/changelog

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]