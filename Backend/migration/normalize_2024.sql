-- Normalización nombres activos 2024 — 77 registros
-- Ejecutar con: psql ... -f normalize_2024.sql

BEGIN;

-- 1. AIO: nombre incluía "TECLADO MOUSE" → quitar especificaciones periféricas
UPDATE assets SET name = 'COMPUTADOR ALL IN ONE'
WHERE id IN (8654,8913,8914,8915,8916,8917,8918,8919,8920,8921,8922,8923,8924);

-- 2. Plural → singular
UPDATE assets SET name = 'DIADEMA'
WHERE id IN (8307,8308,8309);

-- 3. Typo DESFRIBILADOR → DESFIBRILADOR
UPDATE assets SET name = 'DESFIBRILADOR'
WHERE id IN (8253,8254,8255);

-- 4. BAMBU es marca de impresoras 3D (Bambu Lab)
UPDATE assets SET name = 'IMPRESORA 3D'
WHERE id IN (8498,8499);

-- 5. RUIJIE es marca de networking → producto: punto de acceso inalámbrico
UPDATE assets SET name = 'PUNTO DE ACCESO INALÁMBRICO'
WHERE id IN (8528,8529,8530,8531,8532,8533,8534,8535,8536,8537,
             8538,8539,8540,8541,8542,8543,8544,8545,8546,8547,
             8548,8883,8884,8885,8886,8887,8888);

-- 6. POLY es marca → producto: sistema de videoconferencia (Poly Studio USB)
UPDATE assets SET name = 'SISTEMA DE VIDEOCONFERENCIA'
WHERE id = 8524;

-- 7. UMA VERTICAL es término técnico → nombre institucional
UPDATE assets SET name = 'AIRE ACONDICIONADO'
WHERE id = 8961;

-- 8. TERMINALES → Terminal de calificación (botoneras)
UPDATE assets SET name = 'TERMINAL DE CALIFICACIÓN'
WHERE id IN (8630,8631,8632,8633,8634,8635,8636,8637,8638,8639,8640,8641,8642);

-- 9. STICK DE ELECTRIFICACIÓN (iluminación escénica)
UPDATE assets SET name = 'STICK DE ELECTRIFICACIÓN'
WHERE id IN (8555,8556,8557,8558);

-- 10. KIT médico: tensiómetro + fonendoscopio
UPDATE assets SET name = 'KIT DE TENSIÓMETRO'
WHERE id IN (8239,8240);

-- 11. KIT médico: glucómetro
UPDATE assets SET name = 'KIT DE GLUCÓMETRO'
WHERE id IN (8241,8242);

-- 12. KIT fotográfico: Godox 900W
UPDATE assets SET name = 'KIT DE ILUMINACIÓN FOTOGRÁFICA'
WHERE id = 8879;

-- 13. COMODA sin tilde → CÓMODA
UPDATE assets SET name = 'CÓMODA'
WHERE id IN (8685,8686);

-- 14. IPAD es marca → nombre institucional (igual que tabletas 2025)
UPDATE assets SET name = 'TABLETA ELECTRÓNICA'
WHERE id = 8400;

-- 15. DIGITURNO es marca → producto: kiosco de atención con lector de cédula
UPDATE assets SET name = 'KIOSCO DE ATENCIÓN'
WHERE id = 8401;

-- 16. MOBILIARIO demasiado genérico → descripción dice "para televisor"
UPDATE assets SET name = 'MUEBLE PARA TELEVISOR'
WHERE id = 9123;

-- Paso final: UPPER() global para garantizar mayúsculas absolutas en 2024
UPDATE assets SET name = UPPER(name)
WHERE incorporation_year = 2024 AND name != UPPER(name);

COMMIT;
