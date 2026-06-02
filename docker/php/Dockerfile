FROM php:8.2-fpm-alpine

# Installer les dépendances système
RUN apk add --no-cache \
    git \
    unzip \
    libzip-dev \
    $PHPIZE_DEPS

# Installer l'extension MongoDB
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Installer les autres extensions
RUN docker-php-ext-install \
    zip \
    opcache

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Créer le dossier si absent
RUN mkdir -p /var/www/backend

WORKDIR /var/www/backend

CMD ["php-fpm"]