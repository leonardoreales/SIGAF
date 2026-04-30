import {
  pgTable, serial, varchar, text, char,
  integer, boolean, numeric, date, timestamp,
  uniqueIndex,
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
  maintenanceArea:   varchar('maintenance_area', { length: 20 }),
  criticality:       varchar('criticality', { length: 10 }).notNull().default('BAJO'),
  notes:             text('notes'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transfers = pgTable('transfers', {
  id:                serial('id').primaryKey(),
  transferNumber:    varchar('transfer_number', { length: 20 }).notNull(),

  // Activo
  assetId:           integer('asset_id').notNull(),

  // Origen (snapshot al momento de crear)
  originBuildingId:  integer('origin_building_id'),
  originAreaId:      integer('origin_area_id'),
  originResponsible: varchar('origin_responsible', { length: 300 }),
  originFloor:       varchar('origin_floor', { length: 50 }),
  originBlock:       varchar('origin_block', { length: 50 }),
  originLocation:    varchar('origin_location', { length: 200 }),

  // Destino
  destBuildingId:    integer('dest_building_id'),
  destAreaId:        integer('dest_area_id'),
  destPersonId:      integer('dest_person_id'),
  destResponsible:   varchar('dest_responsible', { length: 300 }),
  destFloor:         varchar('dest_floor', { length: 50 }),
  destBlock:         varchar('dest_block', { length: 50 }),
  destLocation:      varchar('dest_location', { length: 200 }),

  // Proceso
  status:            varchar('status', { length: 30 }).notNull().default('PENDIENTE'),
  reason:            varchar('reason', { length: 50 }),
  requestedBy:       varchar('requested_by', { length: 300 }),
  notes:             text('notes'),
  scheduledAt:       date('scheduled_at'),
  completedAt:       timestamp('completed_at', { withTimezone: true }),

  // n8n
  n8nNotified:       boolean('n8n_notified').notNull().default(false),
  n8nWebhookSentAt:  timestamp('n8n_webhook_sent_at', { withTimezone: true }),

  // Firma (futuro flujo automático)
  signatureOrigin:   text('signature_origin'),
  signatureDest:     text('signature_dest'),
  signedAt:          timestamp('signed_at', { withTimezone: true }),

  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  transferNumberIdx: uniqueIndex('transfers_number_idx').on(t.transferNumber),
}))
