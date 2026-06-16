import { NextResponse } from 'next/server';
import { ReliabilityCalculationService } from '../../../services/reliability.service';

export async function GET(request) {
  try {
    const aggregates = await ReliabilityCalculationService.calculateGlobalMetrics();

    return NextResponse.json({
      aggregates,
      // Leaving these empty as the frontend will fetch failures separately
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching reliability metrics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
