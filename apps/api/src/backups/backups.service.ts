import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupsService {
  constructor(private prisma: PrismaService) {}

  async runBackup(tenantId: string): Promise<{ path: string; sizeBytes?: number; success: boolean }> {
    const backupDir = process.env.BACKUP_DIR || '/backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = `backup-${tenantId}-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`;
    const filePath = path.join(backupDir, fileName);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      await this.prisma.backupRun.create({
        data: { tenantId, path: filePath, success: false, errorMessage: 'DATABASE_URL não configurada' },
      });
      return { path: filePath, success: false };
    }

    try {
      const url = new URL(databaseUrl);
      const user = url.username;
      const pass = url.password;
      const host = url.hostname;
      const port = url.port || '5432';
      const db = url.pathname.slice(1);
      const env = { ...process.env, PGPASSWORD: pass };
      await execAsync(
        `pg_dump -h ${host} -p ${port} -U ${user} -d ${db} -F c -f "${filePath}"`,
        { env },
      );
      const stat = fs.statSync(filePath);
      await this.prisma.backupRun.create({
        data: { tenantId, path: filePath, sizeBytes: stat.size, success: true },
      });
      return { path: filePath, sizeBytes: stat.size, success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      await this.prisma.backupRun.create({
        data: {
          tenantId,
          path: filePath,
          success: false,
          errorMessage: errMsg,
        },
      });
      return { path: filePath, success: false };
    }
  }

  async listRuns(tenantId: string) {
    return this.prisma.backupRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
}
