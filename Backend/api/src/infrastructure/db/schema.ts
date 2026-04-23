import {
  pgTable, serial, varchar, text, char,
  integer, boolean, numeric, date, timestamp,
} from 'drizzle-orm/pg-core'

export const catalogCities = pgTable('catalog_cities', {
  code: char('code', { length: 1 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
})

export const catalogBuildings = pgTable('catalog_buildings', {
  id:       serial('id').primaryKey(),
  cityCode: char('city_code', { length: 1 }).notNull(),
  code:     char('code', { length: 2 }).notNull(),
  name:     varchar('name', { length: 100 }).notNull(),
  active:   boolean('active').notNull().default(true),
})

export const catalogAssetTypes = pgTable('catalog_asset_types', {
  code:   char('code', { length: 2 }).primaryKey(),
  name:   varchar('name', { length: 120 }).notNull(),
  active: boolean('active').notNull().default(true),
})

export const catalogAreas = pgTable('catalog_areas', {
  id:     serial('id').primaryKey(),
  name:   varchar('name', { length: 200 }).notNull(),
  active: boolean('active').notNull().default(true),
})

export const catalogPeople = pgTable('catalog_people', {
  id:        serial('id').primaryKey(),
  fullName:  varchar('full_name', { length: 200 }).notNull(),
  email:     varchar('email', { length: 200 }),
  areaId:    integer('area_id'),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const assets = pgTable('assets', {
  id:                serial('id').primaryKey(),
  plate:             varchar('plate', { length: 12 }),
  plateStatus:       varchar('plate_status', { length: 30 }).notNull().default('OK'),
  plateOriginal:     varchar('plate_original', { length: 20 }),
  name:              varchar('name', { length: 300 }).notNull(),
  description:       text('description'),
  assetTypeCode:     char('asset_type_code', { length: 2 }),
  pucAccount:        varchar('puc_account', { length: 20 }),
  brand:             varchar('brand', { length: 100 }),
  model:             varchar('model', { length: 100 }),
  serial:            varchar('serial', { length: 200 }),
  quantity:          integer('quantity').notNull().default(1),
  referenceValue:    numeric('reference_value', { precision: 15, scale: 2 }),
  cityCode:          char('city_code', { length: 1 }),
  buildingId:        integer('building_id'),
  floor:             varchar('floor', { length: 50 }),
  block:             varchar('block', { length: 50 }),
  location:          varchar('location', { length: 200 }),
  areaId:            integer('area_id'),
  personId:          integer('person_id'),
  responsableRaw:    varchar('responsable_raw', { length: 300 }),
  status:            varchar('status', { length: 30 }).notNull().default('ACTIVO'),
  incorporationYear: integer('incorporation_year'),
  acquisitionDate:   date('acquisition_date'),
  sourceSheet:       varchar('source_sheet', { length: 60 }),
  contentHash:       varchar('content_hash', { length: 64 }),
  notes:             text('notes'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
