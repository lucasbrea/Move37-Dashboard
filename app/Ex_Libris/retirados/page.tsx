'use client';

import TrainingView from '../components/TrainingView';
import RetiredDamsView from '../components/RetiredDamsView';

export default function RetiradosPage() {
  return (
    <>
      <div className="bg-[#0a192f] text-white px-4 sm:px-6 pt-8 sm:pt-12">
        <RetiredDamsView />
      </div>
      <TrainingView filter="retirado" />
    </>
  );
}
