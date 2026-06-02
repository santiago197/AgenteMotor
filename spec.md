# Setup y ejecucuión 

- El proyecto debe poder ejecutarse en una máquina Linux/macOS limpia (con tu stack ya
instalado) siguiendo máximo 3 comandos documentados en el README.
- Persistencia de datos. SQLite preferido por simplicidad.

# Problema 
- Un asesor comercial maneja diferentes ramas de polizas, auto, hogar, vida. Cada mes debe gestionar los clientes con polizas próximas a vencer.Las polizas de auto son las más criticas ya que si pasados 30 días desde el vencimiento el cliente pierde el historial y la asesguradora trata la operación como una nueva contratación y no como una renovación. 
# Visión del producto 
- Una herramienta para administrar carteras de clientes de polizas (Auto, hogar, vida, Otra),hace seguimiento a polizas proximas a vencer, sin necesidad de usar hojas de calculo. 


# Usuarios y casos de uso 
- Asesor comercial
- Aseguradora 
_"Por ahora se deja acceso unicamente all asesor por agilidad de desarrollo, el sistema debe contemplar los roles de Asesor, Aseguradora, Administrador"_

# Funcionalidades 
## Posibles estados de polizas 
- Nueva contratación 
- Renovación
- Vigentes (Vencen en más de 30 días)
- Proximas a vencer (Vigentes entre 1-30 días)
- Vencidas renovables (Entre 1 y 20 días vencidos)
- Vencidas criticas (Entre 20 y 30 días vencidos)
- Vencidas perdidas (Vencido hace más de 30 días)
## Dashboard de polizas criticas 
- Vigentes 
- Proximas a vencer 
- Vencidas renovables
- Vencidas criticas 
- Vencidas perdidas
- Clientes a contactar URGENTE
- Filtros por:
    - Estado, No. Póliza, Núm. Documento, Nombre CLiente, Tipo de Poliza
## Informe estado de polizas
- Informe de clientes con sus respectivos filtros por: Tipo poliza, Estado, Rango de fechas, Doc. Cliente, No. Poliza
- Informe en tabla con las siguientes columnas: 
    - Número de poliza
    - Fecha de expedición
    - Fecha inicio vigencia
    - Fecha fin vigencia
    - Aseguradora 
    - Poliza contratada (Si tiene más de 1 chips con nombre (Auto, Vida, Hogar))
    - Estado
    - Documento cliente 
    - Columna de acciones (Ver, Renovar, Contactar)


## Gestión 
- El usuario puede crear clientes, asignar polizas contratadas
- El usuario puede ver el historial de polizas contratadas 
- El usuario puede registrar el seguimiento al cliente (Se contacta vía telefonica el día XX)
- EL usuario puede asignar estados a los clientes (Cotización, Poliza Contratada, No Vigente, Sin contacto exitoso, Gestionado)
- El usuario puede agregar la fecha de renovación 
- Desde el informe de estado de polizas el asesor puede ingresar a gestionar o ver la información y detalles de la poliza del cliente desde la columna de acciones
- El asesor puede exportar el informe a excel con los filtros aplicados 


## Automatización y Validaciones 
- Las polizas se deben actualizar automaticamente su estado según la fecha de inicio de vigencia y Fecha fin de vigencia
- Al actualizar la fecha de renovación se agrega al historial de polizas 
- Si el asesor renueva una poliza pasados 30 días de vencimiento se crea como agrega al historial como "Nueva contratación"
- El el asesor renueva antes de 30 días del vencimiento de la poliza se trata como "Renovación"

# Modelo de datos
- Información de la poliza contratada por cliente 
## Aseguradora 
- id
- razonSocial 
- nit
- telefono
- email
### Asesor 
- id
- idAseguradora 
- codigo
- nombres
- apellidos
- email
- telefono
#### Clientes
- id 
- nombres
- apellidos
- tipoDoc (CC, NIT, CE)
- documento
- celular
- email
- telefono
- fechaNacimiento
- polizas (Auto, Hogar, Vida)
#### Polizas
- Id
- clienteId
- asesorId
- tipo
- idAseguradora
- fechaExpedicion
- fechaVigencia
- fechaVencimiento
- estado

### logs 
- id 
- idPoliza
- fecha
- accion
- notas



# Flujos de usuario
- El asesor inicia sesión con usuario y contraseña asignada por defecto 
- El asesor va a la opción clientes
- El asesor puede importar sus clientes desde el excel 
- El asesor puede descargar una plantilla de ejemplo con los encabezados del excel (nombres, apellidos, tipoDoc, docuemtno, cedular, email, telefono, fechaNacimiento, polizas)
- Al cargar el excel el sistema valida que se cumplan las validaciones (No datos nulos, polizas separadas por coma, correo valido)
- El asesor puede iniciar la migración de los clientes 
- El asesor puede crear nuevos clientes desde un formulario que ocupa toda la pantalla *NO MODAL*
- El asesor puede iniciar a realizar la gestión de los clientes

# Supuestos 
- No es claro si el sistema debe ser multi-tenant 
- No es claro si el asesor está vinculado a 1 0 más aseguradoras
- Timezone Colombia

# Arquitectura 
- FrontEnd: React, Typescript, MUI
- Backend Node.js/Express + API REST
- SQLite
- Tomar desiciones con claude en caso de ser necesario 

# Requisitos no funcionales 
- Escalabilidad hasta 1000 usuarios
- Contraseña cifrada de usuarios
- Autenticación API JWT
- Test de 2-3 casos criticos (Renovación y nueva contratación de poliza)
# Mock de datos 
- Mock de datos de clientes, polizas, asesor aseguradora


# Enpoints mínimos necesarios 
-  /api/policies/dashboard #Vista principal
- /api/policies/:id/log    # Registrar gestión
- /api/clients/:id         # Detalle de cliente
- /api/policies/:id/status # Cambiar estado
- api/clientes/upload      # Migrar clientes
- api/clientes/create      # Crear clientes
- api/policies/export      # Exportar informe a excel


