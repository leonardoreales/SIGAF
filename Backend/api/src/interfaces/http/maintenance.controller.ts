import { Request, Response } from 'express';
import * as maintenanceRepo from '../../infrastructure/db/maintenanceRepository';
import * as XLSX from 'xlsx';

export async function getSchedules(req: Request, res: Response) {
  try {
    const schedules = await maintenanceRepo.findManySchedules();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener programaciones de mantenimiento' });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await maintenanceRepo.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas de mantenimiento' });
  }
}

export async function createSchedule(req: Request, res: Response) {
  try {
    const schedule = await maintenanceRepo.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear programación de mantenimiento' });
  }
}

export async function executeMaintenance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const execution = await maintenanceRepo.executeMaintenance(Number(id), req.body);
    res.json(execution);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar ejecución de mantenimiento' });
  }
}

export async function importExcel(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const { area } = req.body;

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const schedulesToInsert: any[] = [];

    for (const row of data) {
      const assetName = row['NOMBRE DEL ACTIVO'] || row['__EMPTY_4'];
      if (!assetName || assetName === 'NOMBRE DEL ACTIVO') continue;

      const scheduledDate = row['FECHA DE PROGRAMACION '] || row['__EMPTY_6'];
      
      // Intentar mapear fecha (el Excel tiene formatos variados como "Abril", "Enero a diciembre", o fechas reales)
      let finalDate = new Date().toISOString().split('T')[0]; // Default hoy si no se puede parsear
      if (scheduledDate instanceof Date) {
        finalDate = scheduledDate.toISOString().split('T')[0];
      }

      schedulesToInsert.push({
        activityName: assetName,
        maintenanceType: 'Preventivo', // Por defecto
        scheduledDate: finalDate,
        responsibleArea: area || 'General',
        status: 'PROGRAMADO',
        notes: row['DESCRIPCION DEL ACTIVO'] || row['OBSERVACIONES'] || '',
      });
    }

    const result = await maintenanceRepo.batchCreateSchedules(schedulesToInsert);
    res.json({ message: 'Importación exitosa', count: result.length });
  } catch (error: any) {
    console.error('Error importing excel:', error);
    res.status(500).json({ error: 'Error al procesar el archivo Excel', details: error.message });
  }
}
