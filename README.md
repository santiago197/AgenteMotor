# Agentemotor — Gestión de Pólizas para Asesores

## 1. Cómo correrlo 
Requisitos previos: Node.js 18+

```bash
# 1. Instalar dependencias (backend y frontend)
cd backend && npm install && cd ../frontend && npm install

# 2. Inicializar y poblar la base de datos
cd ../backend && npm run reseed

# 3. Levantar backend y frontend
npm run dev # desde backend/ — en otra terminal: cd frontend && npm run dev
```
 
 # Desde la carpeta backend/
  npm run reseed

### Iniciar sesión
  |  Rol   │         Email          │ Contraseña │
  ├────────┼────────────────────────┼────────────┤
  │ Admin  │ admin@agentemotor.com  │ Admin123!  │
  ├────────┼────────────────────────┼────────────┤
  │ Asesor │ andrea@agentemotor.com │ Asesor123! 

> El frontend corre en http://localhost:5173 y el backend en http://localhost:3000


## 2. Decisiones de diseño

### Ventana de 30 días
El contexto regulatorio colombiano define que una póliza vencida puede renovarse 
por el mismo intermediario dentro de los primeros 30 días sin perder historial. 
Después de ese plazo, la renovación se trata como nueva contratación y el asesor 
pierde exclusividad. Esta distinción es el dato más crítico del negocio y está 
reflejada en tres estados diferenciados en el sistema:

- `active` — vigente
- `expired_renewable` — vencida hace 1-30 días (ventana de oportunidad)
- `expired_lost` — vencida hace más de 30 días (oportunidad perdida)

La clasificación se calcula dinámicamente en el backend con base en la fecha de 
expiración y la fecha actual en timezone Colombia (UTC-5), no como campo estático 
en base de datos, para evitar inconsistencias si un registro no se actualiza a tiempo.


### Importación masiva de clientes
María tiene 280 clientes en un Excel. Migrarlos manualmente uno por uno no es 
viable. Se implementó descarga de plantilla CSV + carga masiva de datos, de modo 
que la adopción del sistema no requiera reingreso manual de toda la cartera.

### Autenticación con bcrypt
Se implementó login con email y contraseña hasheada con bcrypt. Aunque la prueba 
admite omitir auth, consideré que incluirla era necesario dado que el sistema 
maneja datos sensibles de clientes (teléfonos, estados de pólizas, historial de 
contacto). Un sistema sin auth en producción expone esa información sin restricción.

### Principios de diseño aplicados
**Backend:** Separación por responsabilidad (SRP) en la estructura de carpetas: 
`routes/`, `services/`, `scripts/` y lógica de negocio aislada en services para 
que los controllers no contengan reglas de dominio.

**Frontend:** Componentes genéricos reutilizables para elementos de UI repetidos 
(badges de estado, filtros, tablas). Custom hooks por funcionalidad (gestión de 
pólizas, filtros, carga de archivos) para separar lógica de presentación. 
Páginas en `src/pages/`, componentes en `src/components/`.

### Base de datos preparada para multi-tenant
El modelo de datos incluye la entidad `advisor` asociable a una organización 
superior (aseguradora o constructora), anticipando el escenario B2B real donde 
múltiples asesores pertenecen a una misma agencia o intermediario.

### Dashboard con métricas por estado
Se priorizó que María vea de un vistazo cuántas pólizas están en cada estado, 
con filtros por criterios relevantes (estado, fecha, aseguradora). El objetivo 
es que la pantalla principal reemplace el "filtro del lunes" que hacía en Excel.


### 3. Qué dejé fuera y por qué

**Gestión multi-asesor desde rol admin (vista de aseguradora):** La prueba se 
enfoca en el problema de María como asesora individual. Construir la capa de 
administración para que una aseguradora vea todos sus asesores habría duplicado 
el alcance sin aportar al caso de uso central. El modelo de datos lo soporta; 
la UI no se implementó.

**Notificaciones automáticas (email):** El enunciado no las pedía. 
En producción serían el siguiente paso natural — una alerta automática cuando 
una póliza entra en ventana crítica eliminaría la dependencia del "filtro del 
lunes". Lo dejé fuera por tiempo y porque requeriría integraciones externas 

**Edición y eliminación de pólizas:** Se puede registrar gestión y cambiar 
estados, pero no editar campos de una póliza existente


## 4. Si esto fuera a producción mañana, qué le falta
- **Definir el modelo de negocio multi-tenant:** ¿El sistema lo administra una 
  aseguradora que onboardea a sus asesores, o es una plataforma independiente 
  donde cada asesor se registra por su cuenta? Esa decisión cambia el modelo de 
  datos, los permisos y la facturación.

- **Validación y sanitización de la importación CSV:** Actualmente confía en que 
  el archivo tiene el formato esperado. En producción necesita validar columnas, 
  tipos de dato, duplicados y dar feedback fila por fila.
  - **Rate limiting y hardening de la API:** Sin límites de peticiones, el endpoint 
  de login es vulnerable a fuerza bruta.
- **Variables de entorno para producción:** JWT secret, DB path y configuración 
  de CORS están en `.env.example` pero necesitan gestión segura (secrets manager).



## 5. Tiempo aproximado 
- Inicie con la definción del spec, me tomó aprox. 2 horas. 
- Desarrollo del back 1.5 horas 
- Desarrollo front aprox. 2 horas 
- Ajustes UI, bugs: 1 hora 

El tiempo superó la estimación de 4 horas principalmente en la capa de UI. 
La IA interpretó el diseño visual con criterios propios que no coincidían con 
lo que tenía en mente, lo que generó varias iteraciones de ajuste. 

## 6. Qué haría diferente en esta prueba

Antes de pedirle a la IA que implementara los componentes de frontend, habría 
dedicado 20-30 minutos a describir explícitamente el resultado visual esperado: 
qué información va en cada sección, cómo se ven los estados de las pólizas, qué 
jerarquía tiene el dashboard. En lugar de eso, delegué esa decisión a la IA y 
tuve que iterar varias veces para corregir el resultado.

La IA ejecuta bien cuando tiene una especificación visual 
precisa. Sin esa especificación, genera algo funcional pero genérico que no 
siempre refleja la intención.

## Video

https://youtu.be/a5s-DDhHrr8 

https://github.com/santiago197/AgenteMotor