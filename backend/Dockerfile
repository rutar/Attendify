# Этап 1: Базовый образ с Gradle
FROM gradle:8.13-jdk21 AS gradle-base

WORKDIR /home/gradle/project

# Копируем Gradle файлы
COPY gradlew /home/gradle/project/gradlew
COPY gradle /home/gradle/project/gradle
COPY build.gradle settings.gradle /home/gradle/project/

# Загружаем зависимости (кэшируется)
RUN chmod +x gradlew && \
    ./gradlew --no-daemon build || return 0

# Этап 2: Сборка приложения
FROM gradle-base AS build

# Копируем код
COPY src /home/gradle/project/src

# Собираем JAR
RUN ./gradlew --no-daemon clean bootJar -x test

# Этап 3: Финальный образ
FROM openjdk:21-jdk-slim

WORKDIR /app

# Копируем JAR и Liquibase
COPY --from=build /home/gradle/project/build/libs/*.jar /app/app.jar
COPY --from=build /home/gradle/project/src/main/resources/db/changelog /app/db/changelog

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]