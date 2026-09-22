# GRC — Front-end

Front-end del MVP **GRC · Gestión de Reparación de Colisión** (taller Servimacromotor), construido con
Create React App a partir del diseño `Servimacromotor GRC (standalone).html` y de los documentos
`Analisis_Requisitos_Completo.pdf` y `Product_Backlog_GRC.pdf` (carpeta `Documents\Integrador`).

## Ejecutar

```bash
npm install
npm start
```

Abre http://localhost:3000. Usuarios de demostración (API simulada):

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | avillalba@servimacromotor.co | admin123 |
| ASESOR | lbeltran@servimacromotor.co | asesor123 |
| GERENTE | rpena@servimacromotor.co | gerente123 |
| ASESOR (inactivo) | jlara@servimacromotor.co | asesor123 |

Los datos simulados se guardan en `localStorage` (`grc_mock_db_v1`); bórralo para restaurar los datos iniciales.

## Backend

Por defecto la app usa una API simulada en el navegador (`src/services/mock`). Para conectar el backend,
copia `.env.example` a `.env` y define `REACT_APP_USE_MOCK=false` y `REACT_APP_API_URL`.
Los endpoints REST esperados están en cada `src/services/*Service.js`.

## Estructura

```
src/
  components/   Componentes reutilizables (ui, layout, modal de etapa, valoración, pestañas de la ficha)
  pages/        Una página por ruta (Login, Alertas, Avisos, Backlog, Ficha, Nueva orden, Valoración, Técnicos, Usuarios)
  styles/       CSS global (tokens del diseño) y un CSS por página/componente
  services/     Comunicación con la API (axios) + API simulada
  context/      AuthContext (sesión y rol)
  utils/        Constantes de negocio, permisos por rol y formato
diseno-referencia/  Template extraído del diseño de Claude Design (solo referencia)
```

## Módulos y acceso por rol

| Módulo | ADMIN | GERENTE | ASESOR |
|---|---|---|---|
| Alertas, Backlog, Ficha, Nueva orden, Valoración | Sí | Sí | Sí |
| Técnicos | CRUD | CRUD | Solo lectura |
| Usuarios | CRUD | CRUD | No |

El rol TECNICO no tiene acceso web en el MVP. El módulo Clientes queda fuera de alcance (marcado "PRÓXIMO").
