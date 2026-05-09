DO $$
DECLARE
  r RECORD;
  v_plate VARCHAR;
BEGIN
  FOR r IN
    SELECT a.id, cb.code AS bcode, a.asset_type_code
    FROM assets a
    JOIN catalog_buildings cb ON cb.id = a.building_id
    WHERE a.incorporation_year = 2026 AND a.plate IS NULL
    ORDER BY a.id
  LOOP
    SELECT generate_plate('1', r.bcode, r.asset_type_code) INTO v_plate;
    UPDATE assets
    SET plate = v_plate, plate_status = 'GENERADA', updated_at = NOW()
    WHERE id = r.id;
  END LOOP;
END;
$$;
