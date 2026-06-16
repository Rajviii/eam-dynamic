import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const prismaPath = path.resolve(process.cwd(), 'node_modules/prisma/build/index.js');
    const output = execSync(`"${process.execPath}" "${prismaPath}" db push --accept-data-loss --skip-generate`).toString();
    return NextResponse.json({ success: true, output });
  } catch (error) {
    const logPath = path.resolve(process.cwd(), 'migration-error.log');
    const logData = `Error: ${error.message}\nSTDOUT: ${error.stdout ? error.stdout.toString() : ''}\nSTDERR: ${error.stderr ? error.stderr.toString() : ''}`;
    fs.writeFileSync(logPath, logData);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      logPath
    }, { status: 500 });
  }
}
