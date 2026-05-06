import {
  pgTable, serial, varchar, text, char,
  integer, boolean, numeric, date, timestamp,
  uniqueIndex, jsonb,
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

  // Firma
  signatureOrigin:   text('signature_origin'),
  signatureDest:     text('signature_dest'),
  signedAt:          timestamp('signed_at', { withTimezone: true }),

  // Origen de la solicitud
  source:            varchar('source', { length: 20 }).notNull().default('MANUAL'),
  requestId:         integer('request_id'),

  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  transferNumberIdx: uniqueIndex('transfers_number_idx').on(t.transferNumber),
}))

export const transferRequests = pgTable('transfer_requests', {
  id:                 serial('id').primaryKey(),
  requestNumber:      varchar('request_number', { length: 20 }).notNull(),

  // Datos del correo
  subject:            text('subject'),
  senderEmail:        varchar('sender_email', { length: 200 }),
  receivedAt:         timestamp('received_at', { withTimezone: true }),

  // Contenido extraído
  rawText:            text('raw_text'),
  docxDriveUrl:       text('docx_drive_url'),
  formData:           jsonb('form_data').$type<Record<string, unknown>>(),

  // Estado
  status:             varchar('status', { length: 20 }).notNull().default('RECIBIDA'),

  // Firma
  autoSigned:         boolean('auto_signed').notNull().default(false),
  signatureEntrega:   text('signature_entrega'),
  signatureRecibe:    text('signature_recibe'),
  signatureAutoriza:  text('signature_autoriza'),
  signedAt:           timestamp('signed_at', { withTimezone: true }),
  signedBy:           varchar('signed_by', { length: 200 }),

  notes:              text('notes'),
  n8nWebhookSentAt:   timestamp('n8n_webhook_sent_at', { withTimezone: true }),

  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transferRequestItems = pgTable('transfer_request_items', {
  id:         serial('id').primaryKey(),
  requestId:  integer('request_id').notNull(),
  assetId:    integer('asset_id'),

  // Datos crudos del DOCX
  plateRaw:   varchar('plate_raw', { length: 30 }),
  nameRaw:    varchar('name_raw', { length: 300 }),
  serialRaw:  varchar('serial_raw', { length: 200 }),
  quantity:   integer('quantity').notNull().default(1),

  // Matching
  matched:    boolean('matched').notNull().default(false),

  // Traslado generado
  transferId: integer('transfer_id'),

  status:     varchar('status', { length: 20 }).notNull().default('PENDIENTE'),
  notes:      text('notes'),

  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const systemUsers = pgTable('system_users', {
  id:          serial('id').primaryKey(),
  email:       varchar('email', { length: 200 }).notNull().unique(),
  role:        varchar('role', { length: 30 }).notNull().default('VIEWER'),
  cargo:       varchar('cargo', { length: 200 }).notNull().default('Usuario General'),
  dependencia: varchar('dependencia', { length: 200 }).notNull().default('General'),
  name:        varchar('name', { length: 200 }),
  isActive:    boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceSchedules = pgTable('maintenance_schedules', {
  id:              serial('id').primaryKey(),
  assetId:         integer('asset_id').references(() => assets.id),
  activityName:    varchar('activity_name', { length: 300 }).notNull(),
  maintenanceType: varchar('maintenance_type', { length: 50 }).notNull(),
  frequency:       varchar('frequency', { length: 100 }),
  scheduledDate:   date('scheduled_date').notNull(),
  responsibleArea: varchar('responsible_area', { length: 100 }).notNull(),
  status:          varchar('status', { length: 30 }).notNull().default('PROGRAMADO'),
  notes:           text('notes'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceExecutions = pgTable('maintenance_executions', {
  id:              serial('id').primaryKey(),
  scheduleId:      integer('schedule_id').references(() => maintenanceSchedules.id),
  executionDate:   date('execution_date').notNull(),
  performedBy:     varchar('performed_by', { length: 200 }),
  observations:    text('observations'),
  supportStatus:   varchar('support_status', { length: 30 }).notNull().default('PENDIENTE'),
  validatedBy:     integer('validated_by').references(() => systemUsers.id),
  validatedAt:     timestamp('validated_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceSupports = pgTable('maintenance_supports', {
  id:              serial('id').primaryKey(),
  executionId:     integer('execution_id').references(() => maintenanceExecutions.id),
  fileUrl:         text('file_url').notNull(),
  fileType:        varchar('file_type', { length: 100 }), // Acta, Informe, Foto
  uploadedAt:      timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── BAJAS DE ACTIVOS ──────────────────────────────────────────────────────────

export const writeoffActs = pgTable('writeoff_acts', {
  id:               serial('id').primaryKey(),
  actaNumber:       varchar('acta_number', { length: 20 }).notNull().unique(),
  date:             date('date'),
  building:         varchar('building', { length: 100 }),
  reason:           varchar('reason', { length: 60 }).notNull(),
  status:           varchar('status', { length: 30 }).notNull().default('COMPLETADA'),
  // Datos administrativos: almacenados pero no protagonistas en la UI
  authorizedBy:     varchar('authorized_by', { length: 300 }),
  authorizedByRole: varchar('authorized_by_role', { length: 200 }),
  responsible:      varchar('responsible', { length: 300 }),
  responsibleRole:  varchar('responsible_role', { length: 200 }),
  totalItems:       integer('total_items').notNull().default(0),
  notes:            text('notes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const writeoffItems = pgTable('writeoff_items', {
  id:               serial('id').primaryKey(),
  writeoffActId:    integer('writeoff_act_id').notNull().references(() => writeoffActs.id, { onDelete: 'cascade' }),
  itemNumber:       integer('item_number').notNull(),
  plateSerial:      varchar('plate_serial', { length: 100 }),
  noRegistra:       boolean('no_registra').notNull().default(false),
  assetId:          integer('asset_id').references(() => assets.id),
  description:      varchar('description', { length: 300 }),
  assetType:        varchar('asset_type', { length: 100 }),
  brandModel:       varchar('brand_model', { length: 200 }),
  // MATCHED | NOT_FOUND | NO_REGISTRA | EMPTY
  reconciledStatus: varchar('reconciled_status', { length: 30 }).notNull().default('PENDING'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
