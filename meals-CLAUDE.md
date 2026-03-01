# MEALS — Contexto del proyecto

## Descripción
App de planificación semanal de comidas (almuerzo). Sugiere automáticamente qué categoría de comida toca cada día, respetando frecuencias mínimas/máximas semanales, restricciones de fin de semana y espaciado entre semanas. El usuario puede validar o cambiar la sugerencia de cada día.

## Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Estilos:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL)
- **Despliegue:** Vercel (auto-deploy desde GitHub en rama master)

## Diseño visual
- Tema claro (opuesto a gym-log):
  - Fondo principal: #ffffff
  - Superficie/tarjetas: #f5f5f5
  - Borde: #e0e0e0
  - Texto principal: #1a1a1a
  - Texto secundario/muted: #888888
  - Fuentes: Bebas Neue (títulos) + DM Sans (cuerpo)
  - Color accent: #2d7a2d (verde oscuro, legible sobre blanco)
- Categoría validada → texto en verde accent (#2d7a2d), negrita
- Categoría propuesta no validada → texto en gris (#888888)

---

## Base de datos (Supabase)

### Tabla `categorias` — configuración fija
```sql
create table categorias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  solo_fin_semana boolean default false,
  frec_sem_min integer not null,
  frec_sem_max integer not null,
  cada_x_sem integer default 1  -- cada cuántas semanas puede aparecer esta categoría
);
```

### Datos iniciales de categorias
```sql
insert into categorias (nombre, solo_fin_semana, frec_sem_min, frec_sem_max, cada_x_sem) values
('Legumbres', false, 2, 3, 1),
('Verduras',  false, 1, 1, 1),
('Carne',     false, 1, 1, 1),
('Pescado',   true,  1, 1, 1),
('Arroz',     true,  1, 1, 2),
('Pasta',     true,  1, 1, 2),
('Huevos',    false, 1, 1, 2);
```

### Tabla `semana_dias` — una fila por día de cada semana
```sql
create table semana_dias (
  id uuid default gen_random_uuid() primary key,
  semana_inicio date not null,  -- siempre lunes (ej: 2026-03-02)
  dia_fecha date not null,       -- fecha exacta del día
  dia_semana integer not null,   -- 1=lunes ... 7=domingo
  categoria_id uuid references categorias(id),
  validado boolean default false,
  created_at timestamp default now()
);
```

---

## Lógica de negocio

### Semana
- Siempre de lunes a domingo
- Al abrir la app, se detecta la semana actual automáticamente
- Si no existe la semana en BD, se genera automáticamente con sugerencias
- Se puede navegar a semanas anteriores (solo consulta, no editable) y semanas futuras

### Algoritmo de sugerencia semanal
Dado el historial de semanas anteriores y los días ya validados en la semana actual, asignar una categoría a cada día respetando:

1. **`solo_fin_semana = true`** → solo puede asignarse a sábado (día 6) o domingo (día 7)
2. **`frec_sem_min` y `frec_sem_max`** → la categoría debe aparecer entre min y max veces en la semana
3. **`cada_x_sem`** → si una categoría tiene cada_x_sem=2, debe haber al menos 1 semana completa entre la semana en que apareció y la siguiente en que puede aparecer. Ejemplo: aparece semana 1 → no puede aparecer semana 2 → puede aparecer semana 3.
4. Los días de **lunes a viernes** solo pueden tener categorías con `solo_fin_semana = false`
5. Los días de **sábado y domingo** pueden tener cualquier categoría

### Recálculo al cambiar combo
Cuando el usuario cambia manualmente la categoría de un día:
- Se marca ese día como validado automáticamente
- Se recalculan las sugerencias de los días futuros de esa misma semana que aún no estén validados
- El recálculo respeta las categorías ya validadas en la semana (no las toca)
- Ejemplo: si el usuario asigna Pescado a un día entre semana (aunque solo_fin_semana=true, el usuario puede forzarlo), entonces Pescado no debe volver a aparecer esa semana (frec_sem_max=1)

### Tres estados por día
1. **Validado** (check marcado) → categoría aceptada, se muestra en verde
2. **Propuesto no validado** → categoría sugerida, se muestra en gris
3. **Sin asignar** → no debería ocurrir si el algoritmo funciona

### Comportamiento del check
- Check desmarcado por defecto
- Marcar check → valida la categoría del combo tal cual está
- Cambiar combo → marca el check automáticamente y recalcula días futuros no validados

---

## Pantalla principal

### Cabecera
- Título "MEALS" en Bebas Neue grande
- Navegación de semana: `< Semana 02 Mar – 08 Mar >` con flechas para ir a semana anterior/siguiente
- La semana actual se resalta

### Lista de días (7 filas)
Cada fila contiene:
- **Día** en Bebas Neue (LUNES, MARTES... DOMINGO) con la fecha corta (02 Mar)
- **Combo** (select) con todas las categorías disponibles, valor preseleccionado = sugerencia
- **Check** de validación (checkbox estilizado)

### Colores
- Día pasado validado → categoría en verde (#2d7a2d), negrita
- Día pasado no validado → categoría en gris (#888888)
- Día futuro validado → categoría en verde (#2d7a2d), negrita
- Día futuro no validado → categoría en gris (#888888)
- Día actual → destacado con borde izquierdo verde o fondo #f0f7f0

---

## Flujo de desarrollo
1. Desarrollar en local con `npm run dev`
2. Variables de entorno en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `git push` despliega automáticamente en Vercel

## Notas de implementación
- El formulario es interactivo → usar `"use client"`
- Supabase client en `lib/supabase.ts`
- Lógica del algoritmo de sugerencia en `lib/suggest.ts` (separada y testeable)
- Al cargar la semana: primero buscar en BD si ya existe, si no → generar y guardar
- Guardar sugerencias en BD al generarlas (no solo en memoria) para persistir entre sesiones
