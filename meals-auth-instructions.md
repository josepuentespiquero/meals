# Instrucciones: Añadir autenticación a Meals

## Contexto
La app `gym-log` ya tiene autenticación completa implementada con Supabase Auth.
El objetivo es replicar **exactamente** esa misma implementación en `meals`.

## Referencia
El código fuente de gym-log está en `E:\proyectos\gym-log`.
Antes de escribir cualquier código, lee los siguientes archivos de gym-log y entiende cómo están implementados:

- `middleware.ts` — protección de rutas
- `lib/supabase.ts` — cliente de Supabase (browser y server)
- `app/login/page.tsx` — página de login
- `app/register/page.tsx` — página de registro con aceptación legal
- `app/auth/callback/route.ts` — callback de verificación de email
- `app/privacidad/page.tsx` — política de privacidad
- `app/terminos/page.tsx` — términos de uso
- Cualquier componente de auth que exista en `components/`

## Lo que hay que hacer en meals

### 1. Instalar dependencias
```bash
npm install @supabase/ssr
```

### 2. Replicar la estructura de archivos
Copia la estructura de auth de gym-log a meals, adaptando:
- **Estilos**: meals usa tema claro (fondo blanco #ffffff, texto #1a1a1a, accent verde oscuro #2d7a2d) — lo opuesto al tema oscuro de gym-log
- **Nombre de app**: "MEALS" en lugar de "GYM LOG"
- **Rutas protegidas**: la ruta principal `/` de meals requiere autenticación

### 3. Middleware
Replicar el middleware de gym-log para proteger todas las rutas excepto:
- `/login`
- `/register`
- `/auth/callback`
- `/privacidad`
- `/terminos`

### 4. Cliente Supabase
Replicar `lib/supabase.ts` de gym-log con:
- `createBrowserClient` para componentes cliente
- `createServerClient` para server components y middleware

### 5. Páginas de auth

#### /login
- Mismo flujo que gym-log
- Formulario: email + contraseña
- Link a `/register`
- Estilo tema claro

#### /register
- Mismo flujo que gym-log
- Formulario: email + contraseña + confirmación de contraseña
- Checkbox obligatorio: "He leído y acepto la política de privacidad y los términos de uso" con links a `/privacidad` y `/terminos`
- No se puede enviar el formulario sin marcar el checkbox
- Tras registro exitoso: mostrar mensaje "Revisa tu email para verificar tu cuenta"
- Estilo tema claro

#### /auth/callback
- Replicar exactamente de gym-log
- Redirige a `/` tras verificación exitosa

### 6. Páginas legales
Replicar estructura de gym-log adaptando el contenido a meals:

#### /privacidad
- Datos recogidos: email y planificaciones semanales de comidas (almuerzo)
- Finalidad: funcionamiento de la app de planificación personal
- No se comparten datos con terceros
- El usuario puede solicitar borrado de cuenta y datos escribiendo a appgymlog@gmail.com
- Proveedor de infraestructura: Supabase (base de datos), Vercel (hosting)

#### /terminos
- App de uso personal para planificación de comidas
- El usuario es responsable de los datos que introduce
- Sin garantía de disponibilidad continua
- Anthropic/Supabase/Vercel como proveedores de infraestructura

### 7. Proteger la página principal
En `app/page.tsx`, asegurarse de que el usuario esté autenticado antes de renderizar.
Si no está autenticado, redirigir a `/login`.
El `user_id` del usuario autenticado debe pasarse a todos los hooks y funciones que lean/escriban en Supabase.

### 8. Variables de entorno
Verificar que `.env.local` tenga:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Resultado esperado
- Usuario no autenticado → redirige a `/login`
- Login correcto → redirige a `/`
- Registro → email de verificación → callback → redirige a `/`
- Todas las consultas a Supabase filtradas por `user_id` del usuario autenticado
