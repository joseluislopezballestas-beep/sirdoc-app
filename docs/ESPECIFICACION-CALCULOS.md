# Especificación de cálculos — SirDoc (algoritmo v1.1.2)

Documento técnico. Describe **cómo** calcula la app; no afirma que las reglas clínicas estén validadas.
Estado clínico de cada regla: ver `MATRIZ-CIENTIFICA.md`.

## 1. Datos de entrada (`js/validate.js`)
| Campo | Unidad | Obligatorio | Rango admitido (bloquea) | Confirmación requerida (no bloquea) |
|---|---|---|---|---|
| Edad | años | sí | 18–120 (< 18: no se calcula) | > 100 |
| Peso | kg | sí | 30–300 | IMC < 16 o > 50 |
| Talla | cm | sí | 120–230 | (IMC) |
| PAS | mmHg | sí | 30–300 | < 70 o > 230 |
| PAD | mmHg | sí | 10–200; PAD < PAS | > 130; PAS − PAD < 15 |
| FC | lpm | no | 20–250 | < 40 o > 160 |
| SpO₂ | % | no | 40–100 | < 80 |

- Formato (`parseNum`): solo dígitos con un separador decimal (coma o punto). Se rechazan signos, letras, notación científica.
- Los rangos son de **plausibilidad de datos**, no recomendaciones clínicas.
- La confirmación de valores extremos queda ligada a la firma exacta de los datos; cualquier cambio exige confirmar de nuevo.
- Cualquier cambio en Paciente invalida los resultados mostrados (`invalidate()`): no se muestran dosis de datos anteriores.

## 2. Variables derivadas (`derive`)
- IMC = peso / (talla/100)²
- Peso ideal (Devine): H 50 + 0,9055 × (talla − 152,4); M 45,5 + 0,9055 × (talla − 152,4); **mínimo 35 kg** (ver hallazgo H-17).
- Peso magro (Janmahasatian): H 9270·peso / (6680 + 216·IMC); M 9270·peso / (8780 + 244·IMC).
- Peso ajustado = ideal + 0,4 × (real − ideal).
- Obesidad (cambio de peso de dosificación) si IMC ≥ 30.
- PAM = (PAS + 2·PAD) / 3. Índice de shock = FC / PAS (solo si hay FC).
- Estado: *shock* si PAS < 90, PAM < 65 o IS ≥ 1; *riesgo* si PAS < 100 o IS ≥ 0,8; si no, *estable*.
  Estado de dosificación: *riesgo* también si escenario falla cardiaca, sangrado o edad ≥ 75.

## 3. Bolos (`bcalc`, `bprep`)
1. dosis = k (mg/kg o mcg/kg) × peso de dosificación (según fármaco y obesidad); tope si existe (succinilcolina 200 mg).
2. **Redondeo** (`roundDose`): < 20 → 0,1; ≥ 20 → entero.
3. volumen (mL) = dosis redondeada / concentración final (mg/mL o mcg/mL).
4. Si dosis, peso, concentración o volumen no son finitos y > 0 → **no se muestra dosis** (tarjeta "No calculado").

Concentraciones finales: etomidato 2 mg/mL; ketamina diluida a 10 mg/mL (múltiplos de 50 mg); propofol 10 mg/mL;
fentanilo 50 mcg/mL; rocuronio 10 mg/mL; succinilcolina diluida a 10 mg/mL; vecuronio reconstituido 1 mg/mL; sugammadex 100 mg/mL.

## 4. Infusiones (`infPrep`)
- dosis/h (en unidad de la presentación) = k × peso × (60 si es "/min") × factor de unidades (mcg↔mg: ×1/1000 o ×1000).
- Cantidad a preparar = dosis/h de inicio × horas elegidas (6, 8, 10, 12), redondeada **hacia arriba** a ampollas completas
  (ketamina: pasos de 50 mg).
- Volumen final: propofol puro; dexmedetomidina a 4 mcg/mL (8 si > 250 mL); el resto, el menor de {puro, 50, 100, 250, 500 mL}
  que dé ≥ 2 mL/h al inicio (norepinefrina ≥ 5 mL/h).
- concentración = cantidad / volumen final; mL/h = dosis/h / concentración.
- Invariantes probados (`tests/engine.test.js`): mL/h × concentración = dosis/h; duración a la dosis de inicio ≥ horas elegidas;
  valores finitos y > 0 para pesos 30–300 kg y 6–12 h; rango mL/h monótono.

## 5. Redondeo de presentación (`r`)
Dosis < 20 → 1 decimal, ≥ 20 → entero; mL < 1 → 2 decimales, resto 1 decimal; horas 1 decimal (≥ 24 → "> 24").
Las velocidades se muestran con 1 decimal (precisión habitual de bombas); el cálculo interno no se redondea.
