-- Normalización nombres activos 2025 — 132 registros
-- Ejecutar con: psql ... -f normalize_2025.sql

BEGIN;

-- AIO (ThinkCentre + HP ProOne)
UPDATE assets SET name = 'Computador all in one' WHERE id IN (9478, 9479, 9480, 9503, 9504, 9505, 9506);

-- Audífonos inalámbricos (Xiaomi Buds)
UPDATE assets SET name = 'Audífonos inalámbricos' WHERE id IN (9481, 9482, 9483);

-- Cámara IP
UPDATE assets SET name = 'Cámara IP tipo bala' WHERE id IN (9484, 9485, 9486);

-- Celulares
UPDATE assets SET name = 'Celular' WHERE id IN (9487, 9488, 9489, 9490, 9491, 9492);

-- Diademas Logitech H390
UPDATE assets SET name = 'Diadema' WHERE id IN (9493, 9494, 9495, 9496, 9497, 9498);

-- Grabador DVR
UPDATE assets SET name = 'Grabador DVR' WHERE id = 9499;

-- UPS
UPDATE assets SET name = 'UPS' WHERE id = 9500;

-- Computadores portátiles (HP ProBook, Asus, Dell)
UPDATE assets SET name = 'Computador portátil' WHERE id IN (9501, 9502, 9512, 9527, 9528, 9529);

-- Monitores
UPDATE assets SET name = 'Monitor' WHERE id IN (9507, 9508, 9509, 9510, 9511);

-- Relojes inteligentes
UPDATE assets SET name = 'Reloj inteligente' WHERE id IN (9513, 9514);

-- Switch
UPDATE assets SET name = 'Switch' WHERE id = 9515;

-- Tabletas
UPDATE assets SET name = 'Tableta electrónica' WHERE id IN (9516, 9517, 9518);

-- Diademas VTX200 PRO UNC DUO (headset call center)
UPDATE assets SET name = 'Diadema' WHERE id IN (9519, 9520, 9521, 9522, 9523, 9524, 9525, 9526);

-- Impresora multifuncional
UPDATE assets SET name = 'Impresora multifuncional' WHERE id = 9633;

-- Desfibrilador
UPDATE assets SET name = 'Desfibrilador externo automático (DEA)' WHERE id = 9694;

-- Banco de pesas
UPDATE assets SET name = 'Banco de pesas' WHERE id = 9725;

-- Condensadora 18.000 BTU (unidad exterior aire acondicionado)
UPDATE assets SET name = 'Condensadora 18.000 BTU' WHERE id = 9793;

-- Bomba de agua
UPDATE assets SET name = 'Bomba de agua residencial' WHERE id = 9794;

-- Brazos robóticos educativos (Dobot Magician)
UPDATE assets SET name = 'Brazo robótico educativo' WHERE id IN (9795, 9796);

-- CARITA = Aire acondicionado
UPDATE assets SET name = 'Aire acondicionado' WHERE id = 9797;

-- Vehículo robótico programable
UPDATE assets SET name = 'Vehículo robótico programable' WHERE id = 9798;

-- Disfraz de mascota
UPDATE assets SET name = 'Disfraz de mascota (peluche)' WHERE id = 9799;

-- EILIK = Robot interactivo
UPDATE assets SET name = 'Robot interactivo de escritorio' WHERE id = 9800;

-- Hornos microondas
UPDATE assets SET name = 'Horno microondas' WHERE id IN (9801, 9802);

-- Kit Arduino
UPDATE assets SET name = 'Kit educativo de Arduino' WHERE id = 9803;

-- Kit sensores brazo robótico
UPDATE assets SET name = 'Kit de sensores para brazo robótico' WHERE id = 9804;

-- Parlantes Xiaomi outdoor
UPDATE assets SET name = 'Parlante portátil externo' WHERE id IN (9805, 9806);

-- Luces PAR LED
UPDATE assets SET name = 'Luz PAR LED' WHERE id IN (9807, 9808, 9809, 9810, 9811, 9812);

-- Robot cuadrúpedo (Go2 Dog)
UPDATE assets SET name = 'Robot cuadrúpedo' WHERE id = 9813;

-- Cables de audio
UPDATE assets SET name = 'Cable de audio' WHERE id IN (9816, 9817, 9818);

-- Afinador
UPDATE assets SET name = 'Afinador de instrumentos' WHERE id = 9819;

-- Porta baquetas
UPDATE assets SET name = 'Porta baquetas' WHERE id = 9820;

-- Congas
UPDATE assets SET name = 'Conga 11 3/4' WHERE id = 9821;
UPDATE assets SET name = 'Conga 12 1/2' WHERE id = 9822;

-- Cuerdas guitarra
UPDATE assets SET name = 'Cuerdas para guitarra eléctrica' WHERE id = 9823;

-- Bloque de percusión
UPDATE assets SET name = 'Bloque de percusión (jam block)' WHERE id = 9824;

-- Micrófonos vocales alámbricos (Shure PGA48)
UPDATE assets SET name = 'Micrófono vocal alámbrico' WHERE id IN (9825, 9826, 9827, 9828, 9829, 9830, 9831, 9832);

-- Consola de mezclas (Behringer XR18)
UPDATE assets SET name = 'Consola de mezclas digital' WHERE id = 9833;

-- Patas de tarima
UPDATE assets SET name = 'Patas de tarima entamboradas' WHERE id IN (9837, 9838);

-- Gabinete almacenamiento
UPDATE assets SET name = 'Gabinete de almacenamiento con alarma' WHERE id = 9839;

-- Pedestal para TV
UPDATE assets SET name = 'Pedestal móvil para TV' WHERE id IN (9840, 9841);

-- Sillas ergonómicas (Onix)
UPDATE assets SET name = 'Silla ergonómica con brazos' WHERE id IN (9842, 9843, 9844, 9845, 9846, 9847, 9848, 9849, 9850);

-- Escritorio en L con archivador
UPDATE assets SET name = 'Escritorio en L con archivador' WHERE id = 9851;

-- Tablero pizarrón
UPDATE assets SET name = 'Tablero pizarrón' WHERE id IN (9852, 9853, 9854);

-- Butacas de auditorio
UPDATE assets SET name = 'Butaca de auditorio' WHERE id IN (10540, 10541);

COMMIT;
