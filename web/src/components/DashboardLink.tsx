import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function DashboardLink() {
    return (
        <div className="mb-6">
            <Link
                to="/app"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>
        </div>
    );
}
