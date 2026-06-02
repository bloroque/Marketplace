# Documentation du projet Marketplace

## 1. Objectif de cette documentation

Cette documentation rassemble les éléments du projet Marketplace visibles dans le dépôt actuel : architecture, stack technique, configuration Docker, bundles Symfony, commandes d'installation, URLs de consultation et points de vigilance.

Elle sert de guide de démarrage pour comprendre ce qui est déjà configuré et ce qu'il faut surveiller pour que l'environnement fonctionne correctement.

## 2. Vue d'ensemble du projet

Le projet est structuré autour d'une architecture conteneurisée avec un frontend Vue, un backend Symfony/API Platform, et une couche de services techniques autour de MongoDB.

### Arborescence utile

- [`frontend/`](../frontend) : application Vue 3 + TypeScript + Vite
- [`backend/`](../backend) : application Symfony 7.4 avec API Platform et MongoDB ODM
- [`docker/`](../docker) : images et configuration des conteneurs
- [`doc/`](.) : documentation projet

### Flux général

1. Le navigateur accède à `http://localhost`
2. Nginx reçoit la requête et joue le rôle de reverse proxy unique
3. Les routes du frontend sont envoyées vers le conteneur Node/Vite
4. Les routes API sous `/api` sont envoyées vers le backend Symfony via PHP-FPM
5. Le backend lit et écrit dans MongoDB via Doctrine MongoDB ODM
6. Redis, Mailpit et mongo-express complètent l'environnement de développement

## 3. Stack technique complète

### Frontend

- Vue 3
- TypeScript
- Vite
- `vue-tsc` pour la vérification TypeScript des composants Vue

Fichiers principaux :

- [`frontend/package.json`](../frontend/package.json)
- [`frontend/vite.config.ts`](../frontend/vite.config.ts)
- [`frontend/src/main.ts`](../frontend/src/main.ts)
- [`frontend/src/App.vue`](../frontend/src/App.vue)
- [`frontend/src/components/HelloWorld.vue`](../frontend/src/components/HelloWorld.vue)
- [`frontend/src/style.css`](../frontend/src/style.css)

### Backend

- PHP 8.2 FPM
- Symfony 7.4
- API Platform 4.3
- Doctrine MongoDB ODM 5.6
- LexikJWTAuthenticationBundle pour les JWT
- NelmioCorsBundle pour les accès cross-origin
- Symfony Mailer
- Symfony Validator
- Symfony Security
- Symfony Cache et Routing

Fichiers de référence :

- [`backend/composer.json`](../backend/composer.json)
- [`backend/public/index.php`](../backend/public/index.php)
- [`backend/src/Kernel.php`](../backend/src/Kernel.php)
- [`backend/config/bundles.php`](../backend/config/bundles.php)

### Services de données et d'appui

- MongoDB 7 pour les données applicatives
- Redis 7 pour le cache ou les traitements techniques
- Mailpit pour consulter les e-mails envoyés en développement
- mongo-express pour inspecter MongoDB depuis le navigateur

## 4. Bundles Symfony installés

Le backend déclare explicitement les bundles suivants dans [`backend/config/bundles.php`](../backend/config/bundles.php) :

- `FrameworkBundle` : noyau Symfony
- `MakerBundle` : génération de code en développement
- `DoctrineMongoDBBundle` : connexion et mapping MongoDB ODM
- `ApiPlatformBundle` : exposition automatique d'API REST/JSON-LD
- `SecurityBundle` : gestion de la sécurité et des accès
- `LexikJWTAuthenticationBundle` : authentification JWT
- `NelmioCorsBundle` : politique CORS

Ces bundles expliquent la plupart des variables d'environnement et des fichiers de configuration présents dans `backend/config/`.

## 5. Configuration détaillée

### 5.1 Docker Compose racine

Le fichier [`docker-compose.yml`](../docker-compose.yml) est l'entrée principale de l'environnement local.

#### Services déclarés

- `nginx` : point d'entrée HTTP exposé sur `80`
- `php` : exécution du backend Symfony via PHP-FPM
- `node` : serveur Vite pour le frontend
- `mongodb` : base MongoDB principale
- `mongo-express` : interface web de consultation MongoDB
- `redis` : service technique de cache/queue
- `mailpit` : serveur de test SMTP et interface web

#### Variables du service `php`

- `MONGODB_URL=mongodb://mongodb:27017`
- `MONGODB_DB=marketplace`
- `REDIS_URL=redis://redis:6379`
- `MAILER_DSN=smtp://mailpit:1025`
- `APP_ENV=dev`
- `APP_SECRET=change_me_in_production`
- `JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem`
- `JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem`
- `JWT_PASSPHRASE=marketplace_dev`

Ce bloc fait fonctionner le backend avec les bons services Docker et prépare l'authentification JWT.

#### Variables du service `node`

- `VITE_API_URL=http://localhost/api`

Cette URL doit être utilisée par le frontend pour parler au backend local via le proxy Nginx.

#### Ports exposés

- `nginx` : `80:80`
- `node` : `5173:5173`
- `mongodb` : `27017:27017`
- `mongo-express` : `8081:8081`
- `redis` : `6379:6379`
- `mailpit` : `8025:8025` et `1025:1025`

### 5.2 Proxy Nginx

Le fichier [`docker/nginx/default.conf`](../docker/nginx/default.conf) configure deux chemins principaux :

- `/` vers `http://node:5173`
- `/api` vers le front controller PHP du backend

Le backend doit donc exposer son point d'entrée HTTP dans [`backend/public/index.php`](../backend/public/index.php).

Points techniques importants :

- le proxy gère les websockets nécessaires au HMR Vite
- les requêtes PHP sont transmises à `php:9000`
- l'URL API reste sous la même origine que le frontend

### 5.3 Image PHP

Le fichier [`docker/php/Dockerfile`](../docker/php/Dockerfile) construit l'image backend.

Ce qui est installé :

- PHP 8.2 FPM Alpine
- `git`
- `unzip`
- `libzip-dev`
- les dépendances de compilation PHP
- l'extension MongoDB via PECL
- `zip`
- `opcache`
- Composer

Le `WORKDIR` est `/var/www/backend`.

### 5.4 Image Node

Le fichier [`docker/node/Dockerfile`](../docker/node/Dockerfile) lance Vite dans le conteneur frontend.

Configuration principale :

- base `node:18-alpine`
- installation des dépendances depuis `frontend/package.json`
- exposition du port `5173`
- démarrage de Vite avec `--host 0.0.0.0`

### 5.5 Initialisation MongoDB

Le script [`docker/mongo/init.js`](../docker/mongo/init.js) prépare la base à la première création du volume.

Ce qu'il fait :

- crée le compte applicatif `app_user`
- cible la base `marketplace`
- crée la collection `users`
- applique un schéma JSON sur les documents utilisateurs
- crée un index unique sur `email`
- crée un index sur `createdAt`

### 5.6 Fichiers de configuration Symfony

#### Environnement

Le backend utilise [`backend/.env`](../backend/.env) et [`backend/.env.dev`](../backend/.env.dev).

Variables importantes :

- `APP_ENV=dev`
- `APP_SECRET`
- `DEFAULT_URI=http://localhost`
- `MONGODB_URI=mongodb://localhost:27017`
- `MONGODB_DB=symfony`
- `JWT_SECRET_KEY`
- `JWT_PUBLIC_KEY`
- `JWT_PASSPHRASE`
- `CORS_ALLOW_ORIGIN`
- `MAILER_DSN`

Remarque importante : les valeurs du `.env` Symfony et celles du `docker-compose.yml` ne portent pas toujours le même nom de base de données. Il faut garder la cohérence entre l'environnement Docker et l'environnement Symfony utilisé réellement.

#### Bundles et packages

Les packages Symfony présents dans [`backend/config/packages/`](../backend/config/packages) sont :

- [`framework.yaml`](../backend/config/packages/framework.yaml) : secret de l'application, sessions, router
- [`api_platform.yaml`](../backend/config/packages/api_platform.yaml) : titre API et comportement stateless
- [`doctrine_mongodb.yaml`](../backend/config/packages/doctrine_mongodb.yaml) : connexion et mappings MongoDB ODM
- [`security.yaml`](../backend/config/packages/security.yaml) : hashers, providers et firewalls
- [`lexik_jwt_authentication.yaml`](../backend/config/packages/lexik_jwt_authentication.yaml) : clés JWT
- [`nelmio_cors.yaml`](../backend/config/packages/nelmio_cors.yaml) : règles CORS
- [`mailer.yaml`](../backend/config/packages/mailer.yaml) : DSN mailer
- [`routing.yaml`](../backend/config/packages/routing.yaml) : URI de génération par défaut
- [`property_info.yaml`](../backend/config/packages/property_info.yaml) : extraction des métadonnées de propriétés
- [`validator.yaml`](../backend/config/packages/validator.yaml) : validation des données
- [`cache.yaml`](../backend/config/packages/cache.yaml) : cache Symfony

#### Routage

- [`backend/config/routes.yaml`](../backend/config/routes.yaml) importe les contrôleurs
- [`backend/config/routes/api_platform.yaml`](../backend/config/routes/api_platform.yaml) expose les ressources API sous `/api`
- [`backend/config/routes/security.yaml`](../backend/config/routes/security.yaml) charge la route de logout
- [`backend/config/routes/framework.yaml`](../backend/config/routes/framework.yaml) configure le framework de base

#### Services

[`backend/config/services.yaml`](../backend/config/services.yaml) active :

- l'autowiring
- l'autoconfiguration
- l'enregistrement automatique des classes `App\` comme services

#### Kernel et point d'entrée

- [`backend/public/index.php`](../backend/public/index.php) charge l'application
- [`backend/src/Kernel.php`](../backend/src/Kernel.php) utilise `MicroKernelTrait`

## 6. Structure du frontend

### Éléments visibles

- [`frontend/src/main.ts`](../frontend/src/main.ts) crée et monte l'application Vue
- [`frontend/src/App.vue`](../frontend/src/App.vue) affiche le composant de démonstration
- [`frontend/src/components/HelloWorld.vue`](../frontend/src/components/HelloWorld.vue) contient la page d'exemple Vite/Vue
- [`frontend/src/style.css`](../frontend/src/style.css) définit le style global
- [`frontend/vite.config.ts`](../frontend/vite.config.ts) fixe l'hôte et le port du serveur Vite

### Ce qui est important à surveiller côté frontend

- l'URL API doit pointer vers `/api`
- le serveur Vite doit rester accessible sur `0.0.0.0:5173` pour fonctionner dans Docker
- le build TypeScript doit rester valide avec `vue-tsc`
- les assets SVG et image utilisés par `HelloWorld.vue` doivent rester disponibles dans `frontend/src/assets/`

## 7. Commandes d'installation et de démarrage

### Installation complète via Docker

Construire et démarrer tout l'environnement :

```bash
docker compose up -d --build
```

Arrêter l'environnement :

```bash
docker compose down
```

Arrêter et supprimer les volumes de données :

```bash
docker compose down -v
```

Voir les logs de tous les services :

```bash
docker compose logs -f
```

Voir les logs d'un service précis :

```bash
docker compose logs -f php
```

### Installation du frontend

```bash
cd frontend
npm install
```

Commandes utiles :

```bash
npm run dev
npm run build
npm run preview
```

### Installation du backend Symfony

```bash
cd backend
composer install
```

Commandes utiles Symfony :

```bash
php bin/console about
php bin/console debug:router
php bin/console debug:container
php bin/console cache:clear
php bin/console doctrine:mapping:info
```

Si le projet reçoit de nouvelles ressources API, il faudra aussi utiliser les commandes de génération correspondantes du bundle ou de Symfony Maker.

### Commandes très utiles au quotidien

#### Depuis la machine hôte

Quand Docker est déjà lancé, les commandes les plus pratiques sont :

```bash
docker compose ps
docker compose logs -f
docker compose logs -f php
docker compose logs -f node
docker compose logs -f mongodb
docker compose exec php sh
docker compose exec node sh
docker compose exec mongodb mongosh
```

#### Quand on travaille dans `var/www/backend`

Le conteneur PHP utilise `var/www/backend` comme répertoire de travail. Une fois dans ce dossier, les commandes Symfony deviennent plus directes :

```bash
php bin/console about
php bin/console debug:router
php bin/console debug:container
php bin/console debug:config framework
php bin/console cache:clear
php bin/console cache:warmup
php bin/console doctrine:mapping:info
php bin/console doctrine:schema:validate
php bin/console debug:autowiring
```

Commandes Composer souvent utilisées :

```bash
composer install
composer update
composer dump-autoload
```

#### Quand on travaille sur le frontend

Dans `frontend/`, les commandes les plus fréquentes sont :

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vérifications utiles pour Vue et TypeScript :

```bash
npx vue-tsc -b
npx vite --host 0.0.0.0 --port 5173
```

#### Commandes de contrôle rapide des services

```bash
docker compose exec php php -v
docker compose exec php composer --version
docker compose exec php sh
docker compose exec node node -v
docker compose exec node npm -v
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

#### Ajouter un bundle Symfony au backend

Quand on ajoute une dépendance backend, la commande standard est :

```bash
composer require vendor/package
```

Exemples fréquents dans ce projet :

```bash
composer require api-platform/core
composer require doctrine/mongodb-odm-bundle
composer require lexik/jwt-authentication-bundle
composer require nelmio/cors-bundle
composer require symfony/mailer
composer require symfony/validator
```

Avec Symfony Flex, le bundle est généralement activé automatiquement dans `config/bundles.php` si la recette le prévoit. Après installation, les vérifications habituelles sont :

```bash
php bin/console debug:config framework
php bin/console debug:config api_platform
php bin/console debug:config doctrine_mongodb
php bin/console cache:clear
```

Si le bundle apporte des fichiers de configuration, ils se retrouvent généralement dans `config/packages/` ou `config/routes/`.

#### Interagir avec le backend au quotidien

Les commandes les plus utiles pour travailler sur le backend Symfony sont :

```bash
php bin/console about
php bin/console debug:router
php bin/console debug:container
php bin/console debug:autowiring
php bin/console debug:event-dispatcher
php bin/console debug:api-resource
php bin/console cache:clear
php bin/console cache:warmup
php bin/console doctrine:mapping:info
php bin/console doctrine:schema:validate
php bin/console server:dump
```

Pour le travail sur les entités/documents ou les ressources API, on utilise aussi souvent :

```bash
php bin/console make:controller
php bin/console make:entity
php bin/console make:command
php bin/console make:subscriber
php bin/console make:filter
php bin/console make:state-provider
php bin/console make:state-processor
```

#### Commandes API Platform

Les commandes API Platform les plus utiles dans ce projet sont :

```bash
php bin/console api:openapi:export
php bin/console api:json-schema:generate
php bin/console debug:api-resource
```

Usages fréquents :

```bash
php bin/console api:openapi:export > openapi.json
php bin/console api:json-schema:generate App\\Document\\User
```

Ces commandes servent à vérifier la documentation OpenAPI et les schémas des ressources exposées.

Dans ce projet, le backend échange principalement avec MongoDB, donc les commandes de lecture et de contrôle de la base sont également utiles :

```bash
docker compose exec mongodb mongosh
docker compose exec mongodb mongosh --eval "show dbs"
docker compose exec mongodb mongosh --eval "use marketplace; show collections"
```

#### Vérifier que l'API répond

Pour tester rapidement le backend local, on peut utiliser :

```bash
curl http://localhost/api
curl http://localhost/api/docs
```

Selon les ressources exposées, l'URL peut renvoyer une page de documentation ou une réponse JSON/API Platform.

## 8. Commandes utiles par service

### MongoDB

Entrer dans le shell Mongo :

```bash
docker compose exec mongodb mongosh
```

Exemples de consultation :

```js
show dbs
use marketplace
show collections
db.users.find().limit(10)
db.users.find({ email: /@/ })
db.users.countDocuments()
```

### Redis

```bash
docker compose exec redis redis-cli
```

### Mailpit

Accès web :

```text
http://localhost:8025
```

### mongo-express

Accès web :

```text
http://localhost:8081
```

Authentification basique :

- utilisateur `admin`
- mot de passe `admin123`

### Frontend Vite direct

Accès web :

```text
http://localhost:5173
```

### Application complète

Accès principal :

```text
http://localhost
```

API :

```text
http://localhost/api
```

## 9. URLs de consultation et de données

### URLs principales

- Frontend : `http://localhost`
- API : `http://localhost/api`
- mongo-express : `http://localhost:8081`
- Mailpit : `http://localhost:8025`
- Vite : `http://localhost:5173`

### Connexions techniques

- MongoDB local : `mongodb://localhost:27017`
- MongoDB Docker inter-services : `mongodb://mongodb:27017`
- Redis Docker inter-services : `redis://redis:6379`
- Mailpit SMTP : `smtp://mailpit:1025`

### Accès de base MongoDB

- utilisateur racine : `root`
- mot de passe racine : `secret`

## 10. Éléments à surveiller pour que tout marche

### Cohérence des variables d'environnement

Il faut surveiller en priorité :

- `MONGODB_URL` dans Docker
- `MONGODB_URI` dans Symfony
- `MONGODB_DB` dans Docker et Symfony
- `MAILER_DSN`
- `JWT_SECRET_KEY`, `JWT_PUBLIC_KEY` et `JWT_PASSPHRASE`
- `CORS_ALLOW_ORIGIN`
- `DEFAULT_URI`

### Proxy Nginx

Le projet dépend de la règle suivante :

- tout ce qui est frontend reste sous `/`
- toute l'API doit rester sous `/api`

Si le proxy change, le frontend et l'API doivent être adaptés ensemble.

### MongoDB

Le script d'initialisation crée les index et la validation de `users`. Il faut surveiller :

- le volume MongoDB, car l'init script ne s'exécute qu'au premier démarrage du volume
- la cohérence du schéma avec les futurs documents applicatifs
- l'unicité de `email`

### JWT

L'authentification JWT dépend de clés valides dans `backend/config/jwt/`. Si ces fichiers sont absents, l'authentification ne pourra pas démarrer correctement.

### CORS

La politique CORS est limitée aux origines locales. Il faut l'ajuster si le frontend est servi depuis une autre origine.

### Mailpit

Mailpit sert uniquement à valider l'envoi d'e-mails en local. Il ne remplace pas une messagerie de production.

## 11. Consultation des données

### MongoDB via shell

Cas d'usage fréquents :

```js
use marketplace
db.users.find().sort({ createdAt: -1 })
db.users.findOne({ email: "test@example.com" })
db.users.aggregate([{ $match: {} }, { $limit: 5 }])
```

### MongoDB via mongo-express

Utiliser mongo-express pour :

- visualiser les collections
- vérifier les documents stockés
- inspecter les index
- comprendre rapidement l'état de la base pendant le développement

### Mailpit pour les e-mails

Utiliser l'interface Mailpit pour :

- consulter les e-mails envoyés par le backend
- vérifier les templates ou le contenu brut des messages
- valider l'intégration du mailer sans SMTP externe

## 12. Résumé des points importants

- Le backend est maintenant bien défini comme un projet Symfony/API Platform avec MongoDB ODM.
- Nginx est le point d'entrée unique pour le frontend et l'API.
- MongoDB est préconfiguré avec un schéma de base pour `users`.
- Les bundles Symfony installés expliquent toute la logique de sécurité, JWT, CORS, mail et API.
- Les commandes de démarrage les plus importantes sont `docker compose up -d --build`, `npm install` dans `frontend/` et `composer install` dans `backend/`.
- Les URLs les plus utilisées sont `http://localhost`, `http://localhost/api`, `http://localhost:8081` et `http://localhost:8025`.

## 13. Prochaines améliorations utiles

- documenter les endpoints API réels dès qu'ils seront créés
- ajouter un `.env.example` complet pour le backend et le frontend
- ajouter un schéma de données métier détaillé pour MongoDB
- documenter les commandes de génération Symfony Maker utilisées dans le projet
- ajouter une section déploiement si une cible de production est définie
