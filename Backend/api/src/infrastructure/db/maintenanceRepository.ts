import { eq, desc, count } from 'drizzle-orm';
import { db } from './client';
import { maintenanceSchedules, maintenanceExecutions, maintenanceSupports, assets } from './schema';
import { NotFoundError } from '../../shared/errors';

export async function findManySchedules() {
  return db
    .select({
      id: maintenanceSchedules.id,
      activityName: maintenanceSchedules.activityName,
      maintenanceType: maintenanceSchedules.maintenanceType,
      frequency: maintenanceSchedules.frequency,
      scheduledDate: maintenanceSchedules.scheduledDate,
      responsibleArea: maintenanceSchedules.responsibleArea,
      status: maintenanceSchedules.status,
      assetName: assets.name,
      assetPlate: assets.plate,
      criticality: assets.criticality,
    })
    .from(maintenanceSchedules)
    .leftJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
    .orderBy(desc(maintenanceSchedules.scheduledDate));
}

export async function getStats() {
  const [totalCount] = await db.select({ value: count() }).from(maintenanceSchedules);
  const [executedCount] = await db
    .select({ value: count() })
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.status, 'EJECUTADO'));
  
  const [vencidoCount] = await db
    .select({ value: count() })
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.status, 'VENCIDO'));

  const compliance = totalCount.value > 0 
    ? Math.round((Number(executedCount.value) / Number(totalCount.value)) * 100) 
    : 0;

  return {
    total: Number(totalCount.value),
    executed: Number(executedCount.value),
    vencidos: Number(vencidoCount.value),
    compliance: `${compliance}%`,
  };
}

export async function createSchedule(data: any) {
  const [inserted] = await db
    .insert(maintenanceSchedules)
    .values(data)
    .returning();
  return inserted;
}

export async function executeMaintenance(scheduleId: number, executionData: any) {
  const schedule = await db
    .select()
    .from(maintenanceSchedules)
    .where(eq(maintenanceSchedules.id, scheduleId))
    .limit(1);

  if (schedule.length === 0) throw new NotFoundError('Programación de Mantenimiento', scheduleId);

  return await db.transaction(async (tx) => {
    const [execution] = await tx
      .insert(maintenanceExecutions)
      .values({ ...executionData, scheduleId })
      .returning();

    await tx
      .update(maintenanceSchedules)
      .set({ status: 'EJECUTADO', updatedAt: new Date() })
      .where(eq(maintenanceSchedules.id, scheduleId));

    return execution;
  });
}

export async function batchCreateSchedules(schedules: any[]) {
  if (schedules.length === 0) return [];
  return await db
    .insert(maintenanceSchedules)
    .values(schedules)
    .returning();
}
