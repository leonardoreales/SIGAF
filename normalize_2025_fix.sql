-- Corrección nombres largos 2025 — 34 registros adicionales
-- Estos estaban en el grupo "ya normalizados" pero su name sigue siendo descripción técnica
BEGIN;

-- Robots programables (kits de construcción)
UPDATE assets SET name = 'ROBOT PROGRAMABLE' WHERE id IN (9762,9763,9764,9765,9766);

-- Deshumidificadores
UPDATE assets SET name = 'DESHUMIDIFICADOR' WHERE id IN (10663,10664);

-- Kits robóticos de expansión (brazo)
UPDATE assets SET name = 'KIT DE EXPANSIÓN ROBÓTICA (BRAZO)' WHERE id IN (9726,9727,9728,9729,9730);

-- Kits robóticos de expansión (cámara)
UPDATE assets SET name = 'KIT DE EXPANSIÓN ROBÓTICA (CÁMARA)' WHERE id IN (9731,9732,9733,9734,9735);

-- Vehículos robóticos inteligentes
UPDATE assets SET name = 'VEHÍCULO ROBÓTICO INTELIGENTE' WHERE id IN (9736,9737,9738,9739,9740);

-- Kit de enseñanza de IA
UPDATE assets SET name = 'KIT DE ENSEÑANZA DE IA' WHERE id = 9741;

-- Kits robóticos de expansión (lanzador de agua)
UPDATE assets SET name = 'KIT DE EXPANSIÓN ROBÓTICA (LANZADOR)' WHERE id IN (9742,9743,9744,9745,9746);

-- Kits robóticos de expansión (tanque)
UPDATE assets SET name = 'KIT DE EXPANSIÓN ROBÓTICA (TANQUE)' WHERE id IN (9752,9753,9754,9755,9756);

-- Mueble auxiliar
UPDATE assets SET name = 'MUEBLE AUXILIAR CON GAVETAS' WHERE id = 9836;

COMMIT;
