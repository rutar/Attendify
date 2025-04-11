FROM openjdk:23-jdk-slim AS build
WORKDIR /app
COPY . .
RUN ./gradlew build --no-daemon

FROM openjdk:23-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]