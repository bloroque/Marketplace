FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    git curl unzip bash \
    postgresql-dev icu-dev oniguruma-dev libzip-dev

RUN docker-php-ext-install \
    pdo pdo_pgsql intl mbstring zip opcache

RUN pecl install redis && docker-php-ext-enable redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

RUN adduser -D -u 1000 symfony && chown -R symfony:symfony /var/www
USER symfony