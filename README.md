# Backoffice Viajes Altairis

MVP de backoffice operativo para la gestion hotelera de Viajes Altairis.

## Tecnologias

- **Backend:** Java 17, Spring Boot 3.2, Hibernate, PostgreSQL
- **Frontend:** Next.js 15, React 18, TypeScript, Recharts
- **Infraestructura:** Docker, Docker Compose

## Ejecucion con Docker

```bash
docker-compose up --build
```

La aplicacion estara disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api

## Estructura del proyecto

```
├── backend/                # API REST Spring Boot
│   ├── src/main/java/      # Codigo fuente Java
│   ├── Dockerfile
│   └── pom.xml
├── frontend/               # Aplicacion Next.js
│   ├── src/app/            # Rutas App Router
│   ├── src/modules/        # Modulos de pantalla reutilizables
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml      # Orquestacion de servicios
```

## Funcionalidades

1. **Dashboard:** Vista general con metricas operativas y graficos de estado de reservas
2. **Hoteles:** CRUD completo con busqueda paginada y filtros
3. **Tipos de habitacion:** Gestion de tipos asociados a cada hotel
4. **Disponibilidad:** Registro masivo de disponibilidad con vista grafica de inventario
5. **Reservas:** Gestion de reservas con cambio de estado, busqueda y paginacion
6. **Reglas operativas:** Validacion de capacidad por tipo de habitacion y control de overbooking

## Desarrollo local

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Dataset masivo para demo de volumen

Puedes arrancar con una carga grande de datos para demostrar paginacion/busqueda a escala:

```bash
APP_SEED_MODE=large APP_SEED_LARGE_HOTELS=5000 docker-compose up --build
```

- `APP_SEED_MODE=demo` (por defecto): dataset base navegable.
- `APP_SEED_MODE=large`: genera hoteles adicionales con inventario y reservas.
