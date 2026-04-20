// src/pages/Landing.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import EventCard from '../components/ui/EventCard';
import { getApiError, getEvents } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';
import useScrollReveal from '../hooks/useScrollReveal';

const PUBLIC_EVENT_STATUSES = new Set(['Published', 'Ongoing']);

export default function Landing() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [upcomingError, setUpcomingError] = useState('');

  useScrollReveal();

  // If already signed up → go straight to Dashboard
  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadUpcoming = async () => {
      setIsLoadingUpcoming(true);
      setUpcomingError('');

      try {
        const response = await getEvents();
        const apiEvents = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mapped = apiEvents
          .filter((event) => PUBLIC_EVENT_STATUSES.has(event.status))
          .map((event) => mapApiEvent(event))
          .slice(0, 3);

        if (!isMounted) {
          return;
        }

        setUpcoming(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load upcoming events');
        setUpcomingError(apiError.message);
        setUpcoming([]);
      } finally {
        if (isMounted) {
          setIsLoadingUpcoming(false);
        }
      }
    };

    loadUpcoming();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {/* HERO - id="home" */}
      <section id="home" className="relative min-h-svh sm:min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center px-4 py-14 sm:px-6 sm:py-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1661160055236-d5f87aafe87b?q=80&w=2200&auto=format&fit=crop')" }}>
        
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/50 to-black/70" />

        <div className="relative z-10 text-center w-full max-w-5xl mx-auto px-2 sm:px-6">
          <div data-scroll-reveal className="scroll-reveal reveal-delay-1 inline-flex items-center gap-2 bg-white/90 backdrop-blur-md text-slate-800 px-4 py-2 sm:px-6 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            🌟 Spring 2026 events are live
          </div>

          <h1 data-scroll-reveal className="scroll-reveal reveal-delay-2 text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight sm:leading-none mb-4 sm:mb-6 tracking-tight">
            Discover Campus Events<br className="hidden sm:block" /> <span className="sm:hidden"> </span>Easily
          </h1>
          
          <p data-scroll-reveal className="scroll-reveal reveal-delay-3 text-base sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Find, join, and create unforgettable campus events — from hackathons to open mics, all in one place.
          </p>

          <div data-scroll-reveal className="scroll-reveal reveal-delay-4 flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center">
            <Link 
              to="/login?mode=register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 sm:px-12 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg transition-all"
            >
             Explore Events →
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white text-white hover:bg-white/10 px-7 py-3.5 sm:px-12 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg transition-all"
            >
              Host an Event
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT IS CAMPUSVIBE - id="about" */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div data-scroll-reveal className="scroll-reveal">
            <p className="uppercase text-blue-600 font-semibold tracking-widest text-sm mb-3">WHAT IS CAMPUSVIBE?</p>
            <h2 className="text-5xl font-bold leading-tight mb-8">The heartbeat of your campus</h2>
            <p className="text-lg text-slate-600">CampusVibe is a student-powered platform that brings every campus event into one beautiful feed.</p>
          </div>

          <div className="space-y-6">
            {[
              { icon: "⚡", title: "Instant Discovery", desc: "Events are auto-tagged and sorted so you never miss what matters to you." },
              { icon: "❤️", title: "Community First", desc: "See who’s going, invite your crew, and build real connections." },
              { icon: "🌍", title: "Open to Every Campus", desc: "Whether your school has 500 or 50,000 students, it fits perfectly." }
            ].map((item, i) => (
              <div key={item.title} data-scroll-reveal className={`scroll-reveal reveal-delay-${Math.min(i + 1, 4)} flex gap-6 bg-slate-50 p-8 rounded-3xl`}>
                <div className="text-5xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-2xl mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS + UPCOMING EVENTS - id="events" */}
      <section id="events" className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-24">
        <div className="max-w-7xl mx-auto">
          <div data-scroll-reveal className="scroll-reveal text-center mb-10 sm:mb-16">
            <p className="uppercase text-blue-600 text-sm font-medium tracking-widest mb-3">SIMPLE &amp; EASY</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">How it works</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-10 mb-14 sm:mb-20">
            {[
              { n: "01", t: "Browse", d: "Explore events by category, date, or popularity" },
              { n: "02", t: "RSVP", d: "One tap to save your spot and invite friends" },
              { n: "03", t: "Show Up & Enjoy", d: "Arrive, connect, and make memories" }
            ].map((step, index) => (
              <div
                key={step.n}
                data-scroll-reveal
                className={`scroll-reveal reveal-delay-${Math.min(index + 1, 4)} group relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-6 md:rounded-3xl md:px-8 md:py-8 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.55)]`}
              >
                <div className="pointer-events-none absolute -top-14 -right-10 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl" />

                <div className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center">
                  <div className="shrink-0 w-12 h-12 md:w-20 md:h-20 bg-linear-to-br from-blue-600 to-cyan-500 text-white text-lg md:text-3xl font-bold rounded-2xl md:rounded-3xl flex items-center justify-center">
                    {step.n}
                  </div>

                  <div className="text-left md:text-center">
                    <h3 className="text-lg sm:text-xl md:text-3xl font-semibold mb-1 md:mb-3">{step.t}</h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{step.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div data-scroll-reveal className="scroll-reveal flex justify-between items-end mb-10">
              <h2 className="text-4xl font-bold">Don’t miss out</h2>
              <Link to="/login?redirect=/events" className="text-blue-600 font-medium">View all events →</Link>
            </div>

            {upcomingError ? (
              <div data-scroll-reveal className="scroll-reveal mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {upcomingError}
              </div>
            ) : null}

            {isLoadingUpcoming ? (
              <div data-scroll-reveal className="scroll-reveal rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500">
                Loading upcoming events...
              </div>
            ) : upcoming.length === 0 ? (
              <div data-scroll-reveal className="scroll-reveal rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500">
                Upcoming events will appear here soon.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {upcoming.map((event, index) => (
                  <div
                    key={event.id}
                    data-scroll-reveal
                    className={`scroll-reveal reveal-delay-${(index % 3) + 1}`}
                  >
                    <EventCard
                      event={event}
                      ctaTo={`/login?redirect=/event/${event.id}`}
                      ctaLabel="View Details"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="mx-6 mb-10">
        <div data-scroll-reveal className="scroll-reveal relative overflow-hidden rounded-4xl border border-slate-200 bg-white px-6 py-12 sm:px-10 sm:py-14 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.4)]">
          <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-blue-100/70 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-slate-100 blur-2xl" />

          <div className="relative max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 mb-4">CampusVibe</p>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 mb-4">Ready to vibe with your campus?</h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8">Join students already discovering events, communities, and moments that matter.</p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Student-led</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Fast RSVP</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Clean event feed</span>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-10 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}