import { ReportForm } from '@/components/report';

export function ReportFormPage() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report Beach Litter</h1>
        <p className="mt-2 text-gray-600">
          Help us track and combat beach pollution by reporting litter you find along Irish coastlines.
        </p>
      </div>
      <ReportForm />
    </div>
  );
}

export default ReportFormPage;
