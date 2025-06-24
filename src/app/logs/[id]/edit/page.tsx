'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConstructionDailyLogEdit from '@/components/ConstructionDailyLogEdit';

export default function EditLogPage() {
  const params = useParams();
  const logId = params.id as string;

  return <ConstructionDailyLogEdit logId={logId} />;
}
