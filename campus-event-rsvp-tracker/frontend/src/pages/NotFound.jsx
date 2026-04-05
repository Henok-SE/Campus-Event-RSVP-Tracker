import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-5xl font-bold mb-8 shadow-sm">
        404
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">You seem lost...</h1>
      <p className="text-xl text-slate-500 mb-10 max-w-md">
        We couldn't find the page you're looking for. It might have been removed, or it simply doesn't exist!
      </p>
      <Link 
        to="/dashboard" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-md transition-all inline-flex items-center gap-2"
      >
        <span>Let's get you home</span> →
      </Link>
    </div>
  );
}
