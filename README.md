# 🗂️ Sistema de Gestión de Cartera Fiscal de Clientes
**Proyecto Integrador DevOps · Tecmilenio**  
Alumna: Lucero Sarahí Jaime Barbosa · Matrícula: 3069230

---

## Funcionalidades implementadas Fase 1 y 2

- **CRUD completo de Clientes** con validación RFC, CP, campos requeridos
- **CRUD completo de Obligaciones** con tipos ISR, IVA, Declaración Anual, etc.
- **Cálculo automático** de `dias_restantes` y `estatus_visual` en el servidor
- **Alertas de vencimiento** visibles en el header y dashboard
- **Filtros** por estado visual y cumplimiento
- **Búsqueda** en tiempo real por nombre y RFC
- **3 tablas SQL** relacionadas con PK y FK en Supabase
- **API REST** con manejo de errores y códigos HTTP correctos


## Funcionalidades implementadas Fase 3

- **Docker:** Imagen multi-stage con Node.js 18 Alpine para producción
- **Docker Compose:** Levanta la app localmente con un solo comando
- **GitHub Actions (CI/CD):** Pipeline automático que compila y publica la imagen en Docker Hub en cada push a `main`
- **Kubernetes:** Manifiestos de Deployment, Service y Secret para despliegue en Minikube
- **Helm:** Chart parametrizado para gestionar el despliegue en Kubernetes
- **Trello:** Tablero con 10 tareas organizadas para gestionar el flujo de trabajo DevOps
