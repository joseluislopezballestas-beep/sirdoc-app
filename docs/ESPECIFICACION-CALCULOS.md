# Especificación de cálculos — SirDoc (algoritmo v1.7.0)

Documento técnico. Describe **cómo** calcula la app; no afirma que las reglas clínicas estén validadas.
Estado clínico de cada regla: ver `MATRIZ-CIENTIFICA.md`. Una prueba (`tests/v16.test.js`) comprueba que la versión
de este documento coincide con `ALG.version`.

## 1. Datos de entrada (`js/validate.js`)
| Campo | Unidad | Obligatorio | Rango admitido (bloquea) | Confirmación requerida (no bloquea) |
|---|---|---|---|---|
| Edad | años | sí | 18–120 (< 18: no se calcula) | > 100 |
| Peso | kg | sí | 30–300 | IMC < 16 o > 50 |
| Talla | cm | sí | 120–230 | (IMC) |
| PAS | mmHg | sí | 30–300 | < 70 o > 230 |
| PAD | mmHg | sí | 10–200; PAD < PAS | > 130; PAS − PAD < 15 |
| FC | lpm | **sí** | 20–250 | < 40 o > 160 |
| SpO₂ | % | **sí** | 40–100 | < 80 |

- Formato (`parseNum`): solo dígitos con un separador decimal (coma o punto). Se rechazan signos, letras, notación científica.
- Los rangos son de **plausibilidad de datos**, no recomendaciones clínicas.
- La confirmación de valores extremos queda ligada a la firma exacta de los datos; cualquier cambio exige confirmar de nuevo.
- Cualquier cambio en Paciente invalida los resultados mostrados (`invalidate()`): no se muestran dosis de datos anteriores.
- Al abrir o recargar la app, los campos y casillas del paciente se vacían (`clearPatient`), también si el navegador restaura la página.
- El escenario se elige en Plan SIR; sin escenario no se calcula. «Otro / general» usa la lógica por defecto y muestra un aviso de fuera de ámbito.

## 2. Variables derivadas (`derive`)
- IMC = peso / (talla/100)²
- Peso ideal (Devine): H 50 + 0,9055 × (talla − 152,4); M 45,5 + 0,9055 × (talla − 152,4); **mínimo 35 kg** (ver hallazgo H-17).
- Peso magro (Janmahasatian): H 9270·peso / (6680 + 216·IMC); M 9270·peso / (8780 + 244·IMC).
- Peso ajustado = ideal + 0,4 × (real − ideal).
- Obesidad (cambio de peso de dosificación) si IMC ≥ 30. La base de cada fármaco está en **una sola tabla** (`BASIS`, regla R-21);
  el cálculo y el texto del aviso de obesidad la leen de ahí. Rocuronio usa **peso ajustado en bolo y en infusión** (unificado en v1.6.1).
- PAM = (PAS + 2·PAD) / 3. Índice de shock = FC / PAS.
- Estado: *shock* si PAS < 90, PAM < 65 o IS ≥ 1 (en sepsis, también con vasopresor en curso); *riesgo* si PAS < 100 o IS ≥ 0,8; si no, *estable*.
- Estado de dosificación: *riesgo* también con PA normal si el escenario es falla cardiaca, sangrado, politrauma con hemorragia activa,
  sepsis o IAM, o si la edad es ≥ 75 años.

## 3. Bolos (`bcalc`, `bprep`)
1. dosis = k (mg/kg o mcg/kg) × peso de dosificación (`BASIS.bolus`); tope si existe (succinilcolina 200 mg).
2. **Redondeo** (`roundDose`): < 20 → 0,1; ≥ 20 → entero.
3. volumen (mL) = dosis redondeada / concentración final (mg/mL o mcg/mL).
4. Si dosis, peso, concentración o volumen no son finitos y > 0 → **no se muestra dosis** (tarjeta "No calculado").
5. **Techos blandos** (`CEIL`, R-20, aprobados por el autor 2026-11-17): etomidato > 40 mg, rocuronio > 200 mg, sugammadex > 2.000 mg.
   La dosis se muestra con aviso y no se puede seleccionar ni pasa al resumen hasta confirmar peso y dosis.

Ampollas: se cuentan con `ceil(dosis / contenido)`. Ketamina y succinilcolina más concentradas que 10 mg/mL se diluyen en jeringa:
se cargan mL enteros de la presentación y se completa con SSN hasta 10 mg/mL.

## 4. Selección (fuente única `M`)
- El plan (Seleccionar), el registro «Administrado» de Infusiones y el resumen leen y escriben la misma selección.
- La selección se **revalida** con los datos actuales: si el fármaco pasa a Evitar, No disponible o Contraindicado, la fila superior
  y el resumen muestran el aviso sin dosis y piden reconfirmar.
- Si cambia el escenario o el estado hemodinámico, la selección se borra y se avisa.

## 5. Infusiones (`infPrep`)
- dosis/h (en unidad de la presentación) = k × peso (`BASIS.inf`) × (60 si es "/min") × factor de unidades (mcg↔mg).
- Cantidad a preparar = dosis/h de inicio × horas elegidas (6, 8, 10, 12), redondeada **hacia arriba** al paso de la presentación:
  ketamina 50 mg (1 mL) y norepinefrina 1 mg (1 mL), que se toman como **fracción de ampolla**; el resto, ampollas completas.
- Volumen final: propofol puro; dexmedetomidina a 4 mcg/mL (8 si > 250 mL); el resto, el menor de {puro, 50, 100, 250, 500 mL}
  que dé ≥ 2 mL/h al inicio (norepinefrina ≥ 5 mL/h). «Puro» solo si cabe en una jeringa de 50 mL.
- concentración = cantidad / volumen final; mL/h = dosis/h / concentración.
- Recipiente siempre indicado: jeringa de 50 mL, bolsa (volumen final), varias jeringas de 50 mL o, en propofol, frasco con equipo ventilado.
- Estabilidad: tope de 24 h (propofol 12 h). Si a la dosis de inicio la mezcla durara más, se avisa con la hora de desecho.
- Concentración mostrada con 3 cifras significativas (`rc`) y como cantidad/volumen.
- Rangos rotulados fuera de ficha: dexmedetomidina > 0,7 mcg/kg/h (máximo 1,4); vecuronio > 1,2 mcg/kg/min; inicio de rocuronio 8 mcg/kg/min.
- Bloqueo neuromuscular continuo bloqueado (sin velocidad) si la sedación es dexmedetomidina o ninguna.

## 5b. Reglas transversales (v1.6.2)
- Meta de PA con TCE (`tceTarget`, BTF 4.ª ed.): PAS ≥ 100 entre 50 y 69 años, ≥ 110 fuera de ese rango; misma regla en politrauma,
  raquimedular y sangrado de origen traumático (`hasTce`). Con TCE no se aplica hipotensión permisiva.
- Sepsis: norepinefrina con shock, vasopresor o riesgo de hipotensión; corticoides solo con shock o vasopresor en curso.
- Ictus isquémico en shock: primero corregir la hipotensión; las metas de reducción no se muestran.
- «Dosis para» (`doseWhy(p, id)`) lista cada condición que cambió la dosis: estado, escenario, edad ≥ 75 y, en propofol, edad ≥ 65.
- Fila superior del plan: sin selección muestra la dosis sugerida y «Usar»; una sugerencia no pasa al resumen hasta seleccionarla.

## 6. Redondeo de presentación (`r`, `rc`)
Lo que se muestra (plan, infusiones, resumen, avisos) usa **coma decimal** (`decComma`); el punto queda solo en versiones y miles (2.000).
Dosis < 20 → 1 decimal, ≥ 20 → entero; mL < 1 → 2 decimales, resto 1 decimal; horas 1 decimal (≥ 24 → "> 24");
concentración de mezclas, 3 cifras significativas (error ≤ 0,5 %).
Las velocidades se muestran con 1 decimal (precisión habitual de bombas); el cálculo interno no se redondea.

## 7. Pruebas
- `tests/engine.test.js`: invariantes (mL/h × concentración = dosis/h; duración ≥ horas elegidas; valores finitos y > 0).
- `tests/verify.test.js`: recálculo independiente de lo que muestra la interfaz.
- `tests/sweep.test.js`: barrido de pacientes × fármacos × presentaciones × horas (estabilidad, recipiente, rotulado de concentración).
- `tests/v16.test.js`: criterios de aceptación de la matriz de medidas M01–M26.
