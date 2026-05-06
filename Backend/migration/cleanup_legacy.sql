-- Cleanup: elimina tablas legacy/obsoletas que no pertenecen al schema actual
-- Ejecutar ANTES de add_transfers.sql + add_transfer_requests.sql

DROP TABLE IF EXISTS acta_assets          CASCADE;
DROP TABLE IF EXISTS actas                CASCADE;
DROP TABLE IF EXISTS physical_inventory_items CASCADE;
DROP TABLE IF EXISTS physical_inventories CASCADE;
DROP TABLE IF EXISTS transfers            CASCADE;
