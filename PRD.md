# Ground · PRD v2.0

Especificación del MVP para la hackathon · 12 de septiembre de 2026

**Una nota de voz desde la obra pone a trabajar a toda la oficina.**

Ground convierte conversaciones de Telegram en avance, inventario, incidencias y acciones de abastecimiento. El trabajador reporta como siempre. El supervisor recibe las decisiones que necesitan su intervención. Ground mantiene el registro de obra y el workspace de Ambiguous actualizado.

Esta versión sustituye el PRD v1.0. Conserva sus 24 requisitos funcionales, incorpora Exa, CopilotKit y Ambiguous al alcance obligatorio y concentra el video en una sola historia. Las facturas, correcciones y recuperación siguen siendo parte del MVP, aunque se prueban fuera de los dos minutos.

## 1. Qué debe quedar terminado

El MVP está completo cuando Luis envía un audio y una foto desde un grupo real; Ground actualiza la obra, crea una tarea con evidencia en Ambiguous, investiga proveedores con Exa y presenta una solicitud mediante CopilotKit. Ana la revisa, la aprueba y un destinatario de prueba recibe el mensaje. El reporte de Ambiguous recoge el resultado.

| Capa | Resultado que debe poder abrirse y comprobarse |
| --- | --- |
| Telegram | Audio y foto de Luis, respuesta del bot y solicitud recibida en otra conversación autorizada. |
| OpenAI | Transcripción y extracción estructurada vinculadas al reporte original. |
| Ground | Avance del baño 2 de 62% a 81%, porcelanato de 8 a 0 cajas, incidencia, tarea y necesidad de reposición. |
| CopilotKit + AG-UI | X-Ray actualizado, comparación de proveedores y aprobación que reanuda la operación. |
| Exa | Búsqueda ejecutada, páginas consultadas y candidatos con referencias verificables. |
| Ambiguous | Foto en Drive, tarea asignada y documento de obra actualizado con enlaces a las evidencias. |
| Operación | Datos persistidos, reintentos controlados, correcciones, seguimiento y restauración del escenario. |

Los cuatro proveedores son P0 para la demostración completa. La prioridad de construcción es OpenAI y CopilotKit, después Exa y Ambiguous. El acceso a todos se comprueba al inicio.

## 2. El video de 120 segundos

### La historia

El baño 2 avanza, se agota el material del siguiente frente y aparece una fuga que necesita revisión. Ground convierte ese reporte en trabajo asignado y una reposición lista para gestionar. El momento central es ver cómo el mensaje del trabajador cambia la obra y los sistemas de oficina, seguido de una decisión que produce un resultado externo.

El video usa interfaz y narración en inglés, con la nota de voz en español y subtítulos en inglés. Así se demuestra el uso local y se facilita la evaluación internacional. El resto del PRD está en español para el equipo.

### Preparación de la toma

- Proyecto `La Arboleda`, zona horaria `America/Bogota`, moneda COP y fecha del escenario fijada en el manifiesto. Si se graba el 12 de septiembre, “mañana” se muestra como `13 Sep 2026`.
- Luis entra como trabajador; Ana como supervisora; Juan como responsable de revisión. Las identidades de Ground y Ambiguous están vinculadas.
- Dos ventanas preparadas: Telegram y Ground. Ambiguous queda abierto en otra pestaña, dentro del workspace de demostración.
- Audio de entre 12 y 15 segundos y fotografía preparada. La foto se envía como respuesta al audio para vincularlos.
- El catálogo tiene una referencia comercial real validada durante la preparación, con cobertura de 1,26 m² por caja. `POR-GRIS-60` es el identificador interno. El manifiesto guarda marca, referencia comercial, acabado y URL de referencia.
- El destinatario de prueba tiene una conversación iniciada y autorizada. La tarjeta indica `Demo recipient`; las páginas encontradas por Exa conservan el nombre del comercio real.
- Las credenciales y lecturas básicas de las cuatro integraciones funcionan. La toma empieza con el escenario restaurado y sin efectos de ejecuciones anteriores pendientes.

### Guion exacto

| Tiempo | Acción y encuadre | Voz o audio | Resultado visible |
| --- | --- | --- | --- |
| 00:00 a 00:08 | Telegram a la izquierda; Ground a la derecha. El proyecto muestra baño 2 al 62% y 8 cajas. | “On a jobsite, the update arrives in a voice note. Ground turns it into work the whole team can act on.” | Nombre del proyecto, autor y estado inicial legibles. |
| 00:08 a 00:23 | Luis envía el audio. Se reproduce una vez; adjunta la foto respondiendo al mensaje. | **Luis:** “Terminamos el enchape del baño dos y usamos las últimas ocho cajas de porcelanato gris. Hay una fuga en la pared norte. Juan debe revisarla mañana a las nueve.” | Audio, foto y acuse del bot. Subtítulos traducen el mensaje. |
| 00:23 a 00:38 | Ground ocupa la pantalla. X-Ray muestra las tarjetas a medida que llegan sus resultados. | “Ground links the voice note and photo to Bathroom 2. Progress updates, stock reaches zero, and Juan gets the inspection.” | `Bathroom 2 · 62% → 81%`, `Gray tile · 8 → 0 boxes`, `Leak review · Juan · 13 Sep, 09:00`. |
| 00:38 a 00:53 | Abrir `View task` en Ambiguous. Mostrar la tarea y abrir la foto desde su enlace. Volver a Ground. | “The task and photo are already in Ambiguous, and the site report updates automatically. Luis only used Telegram.” | Tarea real, responsable, vencimiento y archivo de Drive. El enlace al reporte queda visible. |
| 00:53 a 01:08 | Ground enfoca `Tomorrow's hallway needs 20 boxes`. Expandir cálculo y luego comparación de Exa. | “Tomorrow's hallway needs twenty boxes. Ground searches supplier pages with Exa and compares the material, coverage and published price.” | `22.5 m² + 10% allowance → 20 boxes`. Hasta tres candidatos, con dominio y hora de consulta. |
| 01:08 a 01:24 | Ana abre la mejor opción disponible y su fuente. Vuelve a la tarjeta de solicitud. | “Here is the product page behind this option. Ground has prepared a request to confirm availability, delivery and the final quote.” | Referencia, cajas, subtotal publicado cuando exista, campos pendientes y fecha solicitada. |
| 01:24 a 01:40 | CopilotKit muestra el formulario de decisión. Ana pulsa `Approve & send request`. | “I review the material, quantity and recipient, then approve the request.” | Estado `Awaiting approval → Sending → Sent`; una sola solicitud y enlace a su registro. |
| 01:40 a 01:53 | Mostrar el mensaje recibido en la conversación de prueba. Abrir el reporte de Ambiguous ya actualizado. | “The request arrives, the follow-up is scheduled, and the report records what happened.” | Mensaje recibido; seguimiento con fecha; reporte con avance, incidencia y solicitud enviada. |
| 01:53 a 02:00 | Volver a Ground. Vista final con avance, tarea y solicitud. Cierre sobre la misma pantalla. | “One voice note. The site is updated, the work is assigned, and the next decision is ready. That's Ground.” | `81% reported`, `Juan · review scheduled`, `20 boxes · request sent`. |

El tiempo de cada fila es presupuesto de edición. La grabación debe proceder de una ejecución completa; si se recortan esperas, usar `Processing time shortened`. El clip conserva el orden causal y la grabación completa queda disponible para evaluación.

### Dirección visual

Grabar a 1920 × 1080. Usar texto de al menos 24 px en la captura final, acercamientos a una tarjeta por vez y cursor visible al aprobar. Mantener la comparación en tres filas como máximo. Las transiciones siguen una secuencia estable: mensaje, cambios, tarea, material, aprobación y resultado.

Los nombres de los patrocinadores aparecen junto a su resultado: OpenAI en la extracción, Exa en la búsqueda, Ambiguous en la tarea y el reporte, CopilotKit en la decisión. Reservar la mayor parte del encuadre para el producto. X-Ray muestra actividades y cambios verificables, con detalles técnicos expandibles.

El guion no fija un proveedor ganador ni un precio de internet. Antes de grabar se revisan las fuentes y se ensaya con los resultados de esa sesión. Si no hay precio por caja, la tarjeta muestra `Price to confirm`; si no existe una referencia compatible, la acción es una solicitud de cotización de la especificación requerida. Ambos casos deben tener una presentación terminada.

### Qué queda fuera del video principal

Factura y recepción de cemento, corrección de consumo, reintentos, restauración, segundo navegador y prueba del recordatorio. Se mantienen en la suite y en una grabación técnica complementaria. El video principal dispone así de tiempo para enseñar Ambiguous y la fuente de Exa con claridad.

## 3. Producto y usuarios

| Usuario | Trabajo que resuelve Ground | Interfaz principal |
| --- | --- | --- |
| Trabajador o maestro | Reportar avance, consumo e incidencias; adjuntar evidencia; responder una aclaración. | Telegram. |
| Supervisor | Revisar cambios, resolver pendientes, corregir registros y aprobar solicitudes. | Telegram y Ground. |
| Compras | Revisar cantidades, fuentes, solicitudes y respuestas del proveedor. | Ground y reporte de Ambiguous. |
| Responsable de tarea | Consultar qué debe revisar, dónde y para cuándo, con la evidencia adjunta. | Ambiguous. |

La tesis del producto es reducir la transcripción entre conversación y registros de oficina. Después de la hackathon se medirá con usuarios el tiempo de registro, las correcciones necesarias y las tareas que llegan a completarse.

## 4. Alcance del MVP

| Área | P0, obligatorio | Después del MVP |
| --- | --- | --- |
| Canal | Un grupo real de Telegram, dos usuarios y un destinatario de prueba. | WhatsApp con acceso validado; varios canales. |
| Proyecto | Una obra, ubicaciones, roles, catálogo y plan base. | Varias obras y organizaciones. |
| Entradas | Texto, audio hasta 60 s, fotografía y PDF legible hasta 5 páginas; límite interno de 10 MB por archivo. | Videos y documentos largos. |
| Estado | Hitos, movimientos, compras, recepciones, incidencias, tareas, candidatos, solicitudes y seguimientos. | Nómina, contabilidad y presupuesto completo. |
| OpenAI | Transcripción, interpretación visual y propuestas estructuradas. | Optimización de modelos según uso real. |
| CopilotKit | Estado compartido, renderizado de herramientas y aprobación con reanudación. | Consultas más amplias y otras tarjetas. |
| Exa | Buscar y recuperar páginas para una necesidad concreta de material. | Monitoreo de precios, investigación profunda y más categorías. |
| Ambiguous | Tasks, Drive y Docs con sincronización desde Ground. | Sheets para compras, CRM de proveedores, Calendar y sincronización bidireccional. |
| Compras | Comparar, preparar, aprobar y enviar solicitud de cotización a un destinatario autorizado. | Pedido comercial con condiciones confirmadas y nuevas autorizaciones. |
| Reportes | Reporte consultable, PDF y documento de Ambiguous actualizado. | Plantillas y envío diario programado. |
| Operación | Autenticación, persistencia, auditoría, correcciones, reintentos y restauración de demo. | Operación comercial y mayor escala. |

Fuera de alcance: pagos, certificación técnica, mediciones de obra a partir de fotografías, BIM, aplicaciones nativas y planificación completa de una obra.

## 5. Cómo se usan los patrocinadores

### OpenAI: interpretar el reporte y proponer operaciones

Usar transcripción de archivos para la nota de voz, entrada de imagen para la fotografía y salida estructurada para los comandos. Estas capacidades están documentadas por OpenAI en [transcripción](https://developers.openai.com/api/docs/guides/speech-to-text), [visión](https://developers.openai.com/api/docs/guides/images-vision) y [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

Decisión de Ground: un servicio de transcripción entrega texto al orquestador; el orquestador combina ese texto, la imagen y el contexto del proyecto. Devuelve referencias resueltas, operaciones propuestas y campos pendientes. Las sumas, conversiones, permisos y transacciones se ejecutan en código.

El modelo de transcripción y el modelo de interpretación se configuran por separado. Antes de fijarlos se ejecuta el mismo conjunto de audios, imágenes y facturas, registrando precisión, latencia y coste. El README recoge los identificadores usados en la entrega.

### CopilotKit + AG-UI: X-Ray y decisiones

AG-UI conecta el backend agéntico con el frontend mediante eventos. CopilotKit ofrece acceso reactivo al agente y renderizado de interacción humana. La documentación actual expone `useAgent` y `useHumanInTheLoop`; este último entrega un callback para responder desde la interfaz y continuar. [AG-UI](https://docs.copilotkit.ai/ag-ui/introduction), [useAgent](https://docs.copilotkit.ai/reference/hooks/useAgent), [useHumanInTheLoop](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop).

Decisiones de Ground:

- Construir la web con React y TypeScript, usando una versión fijada de CopilotKit y su API correspondiente.
- Traducir eventos persistidos a AG-UI. La vista muestra estado del proyecto, herramientas en ejecución, resultados y decisiones pendientes.
- Registrar componentes propios para `StateChangeCard`, `IssueCard`, `SupplierComparisonCard` y `ProcurementApprovalCard`.
- La aprobación queda persistida en el backend antes de continuar con el envío. El callback del frontend transmite la decisión; el servidor verifica identidad, rol y versión.
- Al recargar, recuperar snapshot y aprobación pendiente. El backend conserva la operación aunque se cierre el navegador.

La integración se acepta cuando una decisión tomada en la tarjeta reanuda el flujo real, actualiza ambas vistas y produce un resultado externo. Fijar pronto el adaptador AG-UI del backend; su compatibilidad con el SDK elegido se prueba en el primer bloque.

### Exa: abastecimiento basado en páginas públicas

Exa permite buscar páginas y recuperar contenido; Ground usará Search con contenido relevante y Contents cuando necesite ampliar una página. [Search](https://exa.ai/docs/reference/search), [documentación de Exa](https://exa.ai/docs).

Diseño propuesto para Ground:

1. El faltante genera una consulta con marca o referencia comercial, formato, acabado y ciudad. La consulta contiene datos del material, no datos privados de la obra.
2. Recuperar hasta cinco páginas por búsqueda y presentar hasta tres candidatos. Realizar como máximo dos consultas por necesidad antes de devolver resultados o una solicitud pendiente de datos.
3. Extraer comercio, producto, referencia, unidad de venta, cobertura por caja, precio publicado, moneda y condiciones publicadas. Conservar URL, fecha de recuperación y fragmento que sustenta cada campo.
4. Clasificar cada candidato como `Exact match`, `Needs review` o `Incompatible`. Comparar primero referencia y especificación; después cobertura, precio y condiciones.
5. Calcular cajas y subtotales por candidato. Un precio por m² se convierte a precio por caja solo con cobertura explícita. Mostrar transporte e impuestos por separado cuando la fuente los detalle.
6. Generar una solicitud de cotización con la cantidad, la referencia, la fecha deseada y las preguntas pendientes sobre disponibilidad, lote, transporte y total.

La prioridad es el mismo producto. Un acabado alternativo requiere revisión del supervisor. La cantidad de 20 cajas corresponde a 1,26 m² por caja; cambiar la cobertura recalcula la cantidad antes de aprobar.

La consulta comienza automáticamente después de confirmar el consumo y detectar la necesidad. Mientras Exa trabaja, se sincronizan los objetos de Ambiguous. Así la comparación puede estar preparada cuando Ana llegue a ella.

La caché conserva consulta, resultado y hora. Su uso aparece como `Retrieved at …`. Las pruebas deterministas usan fixtures separados; la aceptación de Exa exige una consulta real y una fuente abierta durante el ensayo.

### Ambiguous: la oficina que Ground mantiene

Ambiguous publica endpoints de documentos, tareas y carga de archivos bajo su API, con autenticación Bearer. El adaptador usará los esquemas vigentes de la cuenta para verificar los cuerpos de petición. [API de Ambiguous](https://www.ambiguous.ai/agents/api).

Diseño propuesto para Ground:

| Aplicación | Escritura obligatoria | Contenido |
| --- | --- | --- |
| Drive | Subir la fotografía una vez. | Archivo original y referencia local al mensaje, incidencia y hash. |
| Tasks | Crear la tarea de revisión. | `Revisar fuga · Baño 2 · pared norte`, Juan, fecha resuelta, descripción y enlace a la evidencia. |
| Docs | Crear o actualizar un documento por obra y fecha. | Avance, consumo, incidencia, responsable, reposición, solicitud y enlaces a sus fuentes. |

Ground conserva el estado operacional principal. Ambiguous recibe una proyección mediante trabajos persistidos. Cada objeto mantiene `local_id`, `remote_id`, `remote_url`, `synced_version`, `sync_status` y `last_error` en Ground.

La vinculación de Juan se valida al configurar la obra. Si falta el usuario remoto o un campo de asignación no está disponible, la integración queda pendiente de configuración con Ana como responsable local de resolverla. El ensayo completo requiere que responsable y vencimiento se vean en la tarea remota.

El documento usa una plantilla propia de Ground. Al terminar la solicitud se actualiza el mismo documento. La cola agrupa cambios pendientes y sincroniza la versión más reciente. Cada éxito se verifica leyendo el recurso remoto; una respuesta incierta activa reconciliación antes de volver a crear.

P0 es sincronización unidireccional. Los cambios humanos en Ambiguous se mantienen fuera de la sección gestionada por Ground. Sheets, CRM, Calendar y Mail se añaden después de que este recorrido funcione; Tasks, Drive y Docs ya cubren una responsabilidad operacional completa.

### Evidencia para la candidatura

| Candidatura objetivo | Aporte que se puede evaluar | Evidencia de entrega |
| --- | --- | --- |
| Premio general y uso de OpenAI | Un reporte multimodal desencadena un recorrido completo con estado y acción. | Video, entradas, operaciones extraídas y pruebas del dominio. |
| Uso de CopilotKit | El supervisor inspecciona el trabajo del agente y decide desde componentes conectados al flujo. | Código de componentes, eventos AG-UI y aprobación con reanudación. |
| Uso de Exa | Una necesidad calculada produce investigación de material y una comparación con fuentes. | Consulta, URLs, campos extraídos y su uso en la solicitud. |
| Best Use of Ambiguous AI | El agente mantiene tarea, evidencia y reporte de una obra en el workspace. | Enlaces a recursos creados, actualizaciones y registros de sincronización. |

Estas son las candidaturas objetivo a partir de la información aportada por el equipo. El responsable de entrega debe confirmar categorías, elegibilidad, criterios y formato en el portal del evento. La tabla define la evidencia de producto; no presupone una rúbrica oficial. Los créditos y el merchandising no forman parte del diseño funcional.

## 6. Escenario y resultados exactos

### Estado inicial

| Elemento | Valor |
| --- | --- |
| Obra | La Arboleda; baño 2 y pasillo. |
| Personas | Luis reporta; Ana aprueba; Juan revisa la fuga; proveedor de prueba recibe solicitudes. |
| Plan del baño 2 | Hitos completados con peso 62; enchape en curso con peso 19; terminaciones e inspección pendientes con peso total 19. Suma 100. |
| Porcelanato | `POR-GRIS-60`, referencia comercial vinculada, 8 cajas, 1,26 m²/caja, ninguna entrada comprometida. |
| Pasillo | 22,5 m²; reserva de desperdicio acordada del 10%; inicio previsto para el día siguiente. |
| Dependencia del baño | Revisar la fuga antes del cierre de la pared norte. La tarea de cierre queda esperando revisión. |
| Cemento | `CEM-50`, 4 sacos. Factura `F-DEMO-001` pendiente de registrar. |
| Plano de prueba | P-03, revisión 3, pared norte W2; usado como referencia de ubicación. |
| Ambiguous | Workspace y miembros vinculados; sin objetos de esta ejecución. |

### Cálculos del dominio

```text
Avance reportado del baño 2 = (62 + 19) / 100 × 100 = 81%
Porcelanato después del reporte = 8 - 8 = 0 cajas
Área de compra del pasillo = 22,5 × 1,10 = 24,75 m²
Cajas requeridas = ceil(24,75 / 1,26) = 20
Necesidad neta = max(0, 20 - 0 - 0) = 20 cajas
Factura de cemento = 6 × 38.000 = 228.000 COP
Cemento después de confirmar recepción = 4 + 6 = 10 sacos
```

El hito completado es el enchape. Terminaciones e inspección conservan su estado. El audio registra una fuga reportada y encarga su revisión; la foto queda como evidencia de la ubicación y condición observada.

### Resultado del recorrido principal

Una ejecución deja un hito actualizado, un movimiento de consumo, una incidencia con foto, una tarea para Juan y una necesidad de reposición de 20 cajas. La investigación añade candidatos y fuentes. Ana aprueba una solicitud; el envío añade su identificador y un seguimiento. Ambiguous contiene un archivo, una tarea y el documento actualizado.

Porcelanato permanece en cero hasta registrar una recepción. La solicitud enviada incluye:

```text
Solicitud de cotización · La Arboleda · DEMO
Material: {marca y referencia comercial seleccionada}
Cantidad: {cajas calculadas para esa referencia}
Destino: {dirección de prueba autorizada}
Fecha solicitada: {fecha absoluta del escenario}
Referencia pública: {URL}
Precio publicado: {valor y unidad, si están disponibles}
Confirmar disponibilidad, lote/tono, transporte, total y fecha de entrega.
Solicitud: {request_id}
```

El botón es `Approve & send request`. Autoriza ese texto, destinatario y versión. En P0, el contacto externo es una solicitud de cotización; el presupuesto final se obtiene como respuesta del proveedor.

### Fixtures de precios para pruebas

| Oferta sintética | Condiciones | Total de 20 cajas | Resultado esperado |
| --- | --- | --- | --- |
| A | Misma referencia; 55.000 COP/caja; transporte 30.000; entrega declarada para la fecha requerida. | 1.130.000 COP | Primera opción entre los fixtures. |
| B | Misma referencia; 53.000 COP/caja; transporte 20.000; entrega en tres días. | 1.080.000 COP | Mostrar conflicto con fecha requerida. |
| C | Otro tono; 52.000 COP/caja; transporte 25.000; entrega para la fecha requerida. | 1.065.000 COP | Requiere revisión de compatibilidad. |

Estos valores comprueban comparación y aritmética. El video usa los resultados de Exa de su sesión. Obra, plano, factura y destinatario de prueba se identifican como datos de demostración.

## 7. Requisitos funcionales

Los identificadores RF01 a RF24 se conservan para mantener trazabilidad con la versión anterior. RF25 a RF28 hacen explícitas las nuevas integraciones.

| ID | Comportamiento obligatorio | Criterio de aceptación |
| --- | --- | --- |
| RF01 | Configurar obra, grupo, ubicaciones, roles, catálogo, plan y vínculos de Ambiguous. | Un administrador restaura el escenario y valida a Luis, Ana y Juan. |
| RF02 | Recibir mensajes reales con identidad y deduplicación. | Dos miembros interactúan; repetir un webhook produce una sola entrada lógica. |
| RF03 | Procesar audio, fotos y PDFs. | Extraer los campos del audio y factura de prueba; conservar originales y errores de lectura. |
| RF04 | Relacionar adjuntos y respuestas. | Foto en respuesta al audio se vincula al mismo reporte; envíos simultáneos conservan sus autores. |
| RF05 | Resolver referencias y contexto. | “Baño dos” y el alias del material resuelven entidades; texto irrelevante no genera operaciones. |
| RF06 | Pedir aclaraciones y continuar. | Una selección o hasta dos preguntas resuelven la ambigüedad; el callback repetido no duplica efectos. |
| RF07 | Actualizar hitos y avance. | Completar enchape produce 81% reportado y conserva las actividades pendientes. |
| RF08 | Mantener evidencia consultable. | Cada cambio permite abrir autor, mensaje, adjunto y operación. |
| RF09 | Registrar inventario mediante movimientos. | Consumo de 8 deja cero; consumir 9 con saldo 8 queda pendiente de resolver. |
| RF10 | Registrar compras desde factura. | Extraer 6 × 38.000 = 228.000 COP y detectar duplicados. |
| RF11 | Distinguir compra y recepción. | Factura deja cemento en 4; confirmar recepción lo lleva a 10 una vez. |
| RF12 | Gestionar incidencias. | Crear revisión de fuga en pared norte, con evidencia, estado y responsable. |
| RF13 | Mantener tareas y dependencias. | Juan tiene revisión a las 09:00; cierre de pared espera su resolución. |
| RF14 | Detectar necesidades y pendientes. | El consumo dispara necesidad del pasillo y búsqueda; riesgo enlaza la dependencia relevante. |
| RF15 | Responder consultas desde datos. | “¿Qué falta para mañana?” devuelve 20 cajas y revisión de Juan con fuentes. |
| RF16 | Generar reporte. | HTML, PDF y Docs reflejan la misma versión del proyecto, con avance, materiales, incidencias y solicitudes. |
| RF17 | Comparar abastecimiento. | Cálculo por cobertura, compatibilidad, subtotales y condiciones; fixtures A/B/C producen el resultado esperado. |
| RF18 | Aprobar una acción exacta. | Ana aprueba una versión con destinatario y contenido; cambio relevante invalida esa aprobación. |
| RF19 | Enviar y conciliar solicitudes. | Conversación de prueba recibe una solicitud; Ground conserva ID, estado y respuesta humana si llega. |
| RF20 | Programar seguimiento. | Job persistido con vencimiento, condición y destinatario; se cancela si deja de ser necesario. |
| RF21 | Mostrar el proyecto en vivo. | Dos navegadores ven los mismos valores y se recuperan al reconectar. |
| RF22 | Mostrar X-Ray. | Cada tarjeta relaciona entrada, operación, resultado y efecto remoto; estado aplicado aparece después del commit. |
| RF23 | Corregir sin borrar historial. | “Fueron siete” añade compensación de una caja y recalcula necesidad a 19. |
| RF24 | Operar y restaurar demo. | Salud, pendientes, exportación, reintentos y reset autorizado por ejecución. |
| RF25 | Integrar CopilotKit + AG-UI. | Herramientas y estado usan el SDK; aprobar reanuda el flujo; recargar conserva la decisión pendiente. |
| RF26 | Investigar con Exa. | Consulta real, fuente recuperada, campos atribuibles y resultado incorporado a RF17. |
| RF27 | Sincronizar Ambiguous. | Drive, Tasks y Docs contienen recursos legibles con IDs guardados; reintentar conserva un recurso lógico. |
| RF28 | Preparar evidencia de integraciones. | Exportación por `run_id` relaciona llamadas, versiones, fuentes y resultados visibles de los cuatro proveedores. |

## 8. Experiencia y estados

El trabajador recibe una respuesta compacta después del reporte:

> Baño 2: enchape registrado, avance 81%. Porcelanato: 0 cajas. Juan tiene la revisión de la fuga mañana a las 09:00. Estoy buscando las 20 cajas que necesita el pasillo.

Costes, direcciones y aprobación se muestran solo a los roles autorizados. El enlace de Telegram abre una sesión autenticada de Ground. Poseer el enlace no sustituye la identidad del supervisor.

X-Ray presenta una lista de actividades. Cada elemento puede estar `processing`, `applied`, `needs_input`, `sync_pending`, `synced` o `failed`. La incidencia, la solicitud y el stock tienen sus propios estados del dominio. Una tarea creada localmente puede mostrar `sync_pending` mientras Ambiguous responde.

La tarjeta de abastecimiento contiene material, cobertura, cantidad, fuente, precio publicado, subtotal calculado, condiciones pendientes, destino y fecha solicitada. Ana puede `Approve & send request`, `Change` o `Reject`. Cambiar cantidad o candidato recalcula y crea una nueva versión. Rechazar cierra esa propuesta y conserva su investigación.

## 9. Arquitectura y contratos

Implementación de referencia: React + TypeScript + CopilotKit; servicio modular TypeScript; PostgreSQL; almacenamiento privado de archivos; worker con inbox, outbox y jobs persistidos. Usar infraestructura que el equipo pueda desplegar y observar desde el comienzo.

```text
Telegram
   ↓
Webhook autenticado → inbox persistida → archivos
   ↓
OpenAI → operaciones propuestas → validación de dominio
   ↓
Transacción: estado + eventos + outbox
   ├─→ Adaptador AG-UI → CopilotKit / X-Ray
   ├─→ Necesidad de material → Exa → candidatos → propuesta
   └─→ Sincronización → Ambiguous Drive / Tasks / Docs

Ana → tarjeta CopilotKit → aprobación persistida
   ↓
Outbox → Telegram del destinatario → ID de envío
   └─→ seguimiento + actualización de Docs
```

La política configurada de la obra autoriza registrar reportes de sus miembros, investigar materiales y mantener el workspace interno. El envío de la solicitud necesita la decisión de Ana.

### Entidades mínimas

| Grupo | Entidades |
| --- | --- |
| Contexto | Workspace, Project, ChannelBinding, MemberRole, Location, RemoteUserMapping. |
| Entradas | InboundMessage, Attachment, EvidenceRef, AgentRun. |
| Obra | WorkItem, Dependency, Issue, Assignment. |
| Materiales | Material, UnitConversion, InventoryMovement, Purchase, Receipt. |
| Abastecimiento | ProcurementNeed, SupplierCandidate, SourceSnapshot, Quote, RequestProposal, Approval, OutboundRequest. |
| Operación | DomainEvent, InboxEntry, OutboxEntry, ScheduledJob, ExternalObjectLink. |

Todos los registros operacionales tienen `project_id`. Cada ejecución lleva `run_id` y versión del escenario. Cada operación devuelve `operation_id`, `status`, `event_ids`, `state_diff` y `pending_actions`.

### Herramientas del agente

- Lectura: `get_project_context`, `get_inventory`, `get_work_plan`, `list_open_issues`, `get_evidence`.
- Propuestas: `propose_operation`, `request_clarification`, `prepare_procurement_request`.
- Dominio: `apply_validated_operation`, `correct_operation`, `generate_site_report`.
- Investigación: `search_supplier_pages`, `extract_supplier_candidate` mediante Exa.
- Efectos: `enqueue_workspace_sync`, `request_approval`, `dispatch_approved_request`, `schedule_followup`.

El servidor añade identidad y proyecto. Los adaptadores reciben únicamente los campos de su operación. Los objetos externos nunca se crean directamente desde texto libre del modelo.

### Contratos compartidos

```text
OperationProposal
  type, entity_ids, fields, evidence_ids, expected_version

SupplierCandidate
  id, query_id, source_url, fetched_at, product_reference,
  compatibility_status, unit, coverage_m2_per_box,
  published_price_cop, delivery_statement, evidence_by_field

ApprovalDecision
  proposal_id, proposal_version, decision, actor_id, decided_at

ExternalObjectLink
  provider, local_id, remote_id, remote_url,
  synced_version, sync_status, last_error
```

Campos desconocidos del candidato son nulos y se presentan como pendientes. `actor_id` de aprobación procede de la sesión autenticada. La aprobación se vincula al hash del contenido y destinatario que ejecutará el worker.

## 10. Reglas y recuperación

Saldo = inicial + recepciones + devoluciones + ajustes − consumos. Importes en pesos COP enteros o decimales exactos. Fechas persistidas en UTC y presentadas en la zona de la obra. Necesidad neta descuenta solo stock utilizable y entradas comprometidas para la fecha requerida.

Cada entrada tiene clave única del canal. Estado y outbox se confirman en la misma transacción. Los conflictos de versión obligan a reevaluar el comando. Una operación indivisible se aplica completa; las operaciones independientes conservan estados separados.

| Situación | Comportamiento |
| --- | --- |
| Repetición de webhook o aprobación | Devolver el resultado existente. |
| Respuesta de envío perdida | Marcar `send_uncertain`; conciliar antes de cualquier nuevo envío. |
| Ambiguous no responde | Conservar estado local y `sync_pending`; reintentar con espera creciente. |
| Creación remota incierta | Buscar el recurso por correspondencia o marcador de operación; si no puede conciliarse, revisión manual. |
| Exa devuelve pocos resultados | Presentar lo recuperado y preparar solicitud con campos pendientes. |
| Exa falla | Conservar necesidad; mostrar error y permitir reintento. Datos de caché llevan su fecha y procedencia. |
| Modelo falla | Conservar entrada pendiente y habilitar reintento. |
| Navegador se cierra | Recuperar snapshot, eventos y decisiones desde persistencia. |
| “Fueron siete, no ocho” | Añadir +1 caja, recalcular a 19 e invalidar propuesta pendiente. Si ya se envió, preparar una modificación para aprobar. |
| Tarea cerrada antes del seguimiento | Cancelar el job por condición al ejecutarlo. |

El reset crea una nueva ejecución, invalida aprobaciones y cancela jobs anteriores. Los recursos de Ambiguous de ensayos previos se identifican por ejecución y se archivan o separan mediante el procedimiento de limpieza del entorno de demo.

Autenticación por rol en backend, archivos privados, secretos exclusivamente del servidor y logs redactados. Los contenidos de mensajes, PDFs y páginas web son datos de entrada; las herramientas operan con permisos definidos por el servidor. X-Ray muestra operaciones y resultados, no razonamiento interno del modelo.

## 11. Pruebas y definición de terminado

### Matriz de aceptación

| Prueba | RF | Resultado requerido |
| --- | --- | --- |
| T01 · Identidad | 01, 02 | Grupo y usuario autorizados acceden a su obra; otro usuario queda rechazado. |
| T02 · Audio y foto | 03, 04, 07, 08 | 81%, cero cajas, incidencia vinculada y tarea para Juan. |
| T03 · Alias ambiguo | 05, 06 | Selección de material antes de aplicar consumo. |
| T04 · Hito repetido | 07 | El avance permanece en 81%. |
| T05 · Stock insuficiente | 09 | Consumo de 9 con saldo 8 queda pendiente. |
| T06 · Factura | 10, 11 | Compra 228.000 COP; cemento permanece en 4. |
| T07 · Recepción repetida | 06, 11 | Cemento termina en 10; una recepción. |
| T08 · Incidencia y tarea | 12, 13 | Evidencia, responsable y dependencia; cambio de fecha actualiza la tarea local. |
| T09 · Consulta | 14, 15 | Faltante de 20 cajas y revisión pendiente con fuentes. |
| T10 · Comparación | 17 | A/B/C producen cantidades, totales y clasificación del escenario. |
| T11 · Autorización | 18, 19 | Trabajador rechazado; Ana envía una solicitud al destinatario aprobado. |
| T12 · Reporte y X-Ray | 16, 21, 22 | Mismos datos y versión, evidencia navegable y PDF consistente. |
| T13 · Webhook repetido | 02, 09 | Tres repeticiones generan un consumo. |
| T14 · Adjuntos simultáneos | 04, 08 | Autores correctos; foto tardía añade evidencia sin duplicar operación. |
| T15 · Consumos concurrentes | 09, 23 | Conflicto de versión resuelto con saldo válido. |
| T16 · Aprobación antigua | 18 | Cambiar precio, cantidad o destinatario impide usar la versión anterior. |
| T17 · Envío incierto | 19 | Estado conciliable, sin reenvío automático duplicado. |
| T18 · Reinicio y seguimiento | 20 | Job de dos minutos sobrevive; uno cancelado no se envía. |
| T19 · Corrección | 23 | Una caja disponible; necesidad 19; propuesta pendiente invalidada. |
| T20 · Factura ilegible | 03, 10 | Solicitud de datos concretos y documento original conservado. |
| T21 · Instrucciones en fuentes | 05, 26 | PDF o página no altera permisos ni destino de herramientas. |
| T22 · Enlace y token | 06, 18 | Sesión incorrecta o token vencido no aprueba. |
| T23 · Fallo y reconexión | 15, 21 | Entrada recuperable, snapshot consistente y estado de error. |
| T24 · Restauración | 24 | Tres recorridos seguidos desde seed, sin cambios manuales de base de datos. |
| T25 · CopilotKit | 25 | Herramientas visibles, estado reactivo, edición y aprobación real; recarga durante la espera. |
| T26 · Exa real | 26 | Consulta real, página abierta y campos rastreables; sin dependencia de un precio fijo. |
| T27 · Unidades de Exa | 17, 26 | Precio por m², cobertura diferente y transporte desconocido se presentan correctamente. |
| T28 · Ambiguous real | 27 | Archivo, tarea asignada y documento creados; lectura remota confirma el resultado. |
| T29 · Reintentos remotos | 27 | Timeout y reintento no duplican recursos; reconciliación o pendiente explícito. |
| T30 · Cierre compartido | 16, 19, 27, 28 | Solicitud enviada aparece en Ground, destinatario y mismo documento de Ambiguous. |

Todas pasan para declarar el MVP completo. T26 y T28 requieren servicios reales; sus pruebas con fixtures ayudan a desarrollar, pero no sustituyen esa aceptación.

### Objetivos medibles

| Medida | Objetivo propuesto |
| --- | --- |
| Exactitud del escenario | 100% de saldos, cantidades, importes y avance coinciden con el cálculo del dominio. |
| Entradas adicionales | 20 entradas; al menos 95% de campos críticos correctos o derivados a aclaración. Informar también tasa de aclaración. |
| Acuse persistido | p95 ≤ 2 s desde recepción. |
| Operación local | Texto p95 ≤ 8 s; audio o factura p95 ≤ 15 s desde archivo disponible. |
| Actualización de interfaz | p95 ≤ 1 s desde commit. |
| Búsqueda Exa | Objetivo de ensayo ≤ 15 s; timeout de 20 s con estado recuperable. |
| Ambiguous | Objetivo de ensayo ≤ 15 s por recurso; presupuesto independiente del commit local. |
| Carga | 5 usuarios, 20 entradas en un minuto y ráfaga de 5 simultáneas. |
| Ensayo | Tres recorridos completos consecutivos con las cuatro integraciones. |
| Video | Máximo 120 s, texto legible y las fuentes visibles. |

Guardar tiempos por etapa y tamaño de muestra. Usar al menos 20 ejecuciones por clase para reportar p95; los objetivos de Exa y Ambiguous son presupuestos de ensayo del producto. Registrar coste por proveedor cuando esté disponible, con presupuesto inicial de ensayos de US$25 y alerta al 80%.

## 12. Plan de construcción y responsables

### Equipo

| Responsable | Entrega |
| --- | --- |
| Juan Camilo · producto, agente y dominio | Contratos, OpenAI, reglas, escenarios y decisión de alcance. |
| Integraciones y despliegue | Telegram, Exa, Ambiguous, persistencia, worker y operación desplegada. |
| Experiencia y demo | CopilotKit, X-Ray, tarjetas, grabación y legibilidad. |
| Dominio y QA | Catálogo, fuentes, usuarios remotos, datos de prueba, aceptación y paquete de entrega. |

Con tres personas, Juan Camilo asume dominio; integraciones mantiene las pruebas de recuperación; experiencia coordina la grabación y el paquete de entrega. Cada módulo se integra contra los mismos contratos y escenario.

### Bloques de trabajo

| Bloque | Entrega | Criterio de salida |
| --- | --- | --- |
| A · Accesos y contratos | Probar Telegram y OpenAI; evento y decisión mínima en CopilotKit; consulta Exa; crear y leer recursos de prueba en Ambiguous. | Credenciales, permisos, asignación y adaptadores validados. |
| B · Reporte de obra | Audio y foto → operaciones → transacción → X-Ray. | 81%, cero cajas e incidencia con tarea. |
| C · Oficina y abastecimiento | Sincronizar Drive/Tasks/Docs; detectar faltante y buscar con Exa. | Tarea remota visible y candidatos con fuentes. |
| D · Decisión y cierre | Tarjeta editable, aprobación, envío, seguimiento y actualización de Docs. | Destinatario recibe solicitud; reporte refleja envío. |
| E · MVP restante y calidad | Factura, recepción, corrección, PDF, fallos y reset. | T01 a T30 pasan. |
| F · Entrega | Medición, tres ensayos, grabación y revisión. | Video de 120 s y repositorio reproducible. |

Distribución inicial de esfuerzo: A 15%, B 20%, C 20%, D 15%, E 15%, F 15%. Ajustar a las horas efectivas y congelar funcionalidades al empezar F.

Recortar primero WhatsApp, Sheets, CRM, Calendar, monitoreo de Exa, onboarding avanzado y animaciones. Las cuatro integraciones del recorrido permanecen en P0. Si una dependencia sigue bloqueada, registrar qué aceptación falta y resolverla con el proveedor; una demostración parcial se identifica como tal.

## 13. Entrega y siguientes pasos

El repositorio debe incluir README de instalación, arquitectura, contratos, migraciones, seed, manifiesto de medios, `.env.example`, instrucciones de reset y resultados de pruebas. Documentar versiones de SDK, modelos y commit de la grabación.

El paquete de candidatura incluye video de hasta 120 segundos, grabación completa de respaldo, descripción breve del producto y evidencia de cada patrocinador. Los enlaces externos de demostración deben abrirse con los permisos preparados para los evaluadores. La exportación por ejecución contiene identificadores, estados y fuentes; excluye credenciales y datos personales ajenos al escenario.

Descripción propuesta para la entrega:

> Ground turns jobsite voice notes and photos into operational updates. OpenAI interprets the report, Exa researches materials, and Ambiguous keeps the task, evidence and site report together. Supervisors use CopilotKit to inspect the changes and approve the next action. Workers stay in Telegram.

Antes de enviar, confirmar en el portal las categorías de premios, reglas sobre código previo, licencias, duración y campos requeridos. Conservar junto al paquete la fuente de esas condiciones.

Después de la hackathon, observar a maestros y supervisores usando Ground en reportes reales. Medir tiempo añadido por reporte, correcciones, aclaraciones y pendientes resueltos. Priorizar el siguiente desarrollo según dónde el equipo de obra siga transcribiendo información manualmente.
