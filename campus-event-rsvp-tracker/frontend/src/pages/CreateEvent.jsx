// src/pages/CreateEvent.jsx
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createEvent, getApiError, uploadEventImage } from '../services/api';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const isAdmin = user?.role === 'Admin';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    time: '',
    duration_hours: '1',
    duration_minutes: '0',
    capacity: '',
    category: 'Academic',
    is_free: true,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setErrorMessage('');
    setSuccessMessage('');
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let imageUrl;

      if (imageFile) {
        const uploadResponse = await uploadEventImage(imageFile);
        imageUrl = uploadResponse?.data?.data?.image_url;
      }

      const durationHours = Number(formData.duration_hours || 0);
      const durationMinutesPart = Number(formData.duration_minutes || 0);
      const totalDurationMinutes = durationHours * 60 + durationMinutesPart;

      if (!Number.isInteger(totalDurationMinutes) || totalDurationMinutes < 1 || totalDurationMinutes > 1440) {
        throw new Error('Please provide a valid duration between 1 minute and 24 hours');
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
        time: formData.time || undefined,
        duration_minutes: totalDurationMinutes,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        category: formData.category,
        status: isAdmin ? 'Published' : 'Pending',
        tags: [formData.category],
        image_url: imageUrl
      };

      const createResponse = await createEvent(payload);
      const createdEvent = createResponse?.data?.data;

      setSuccessMessage(
        isAdmin
          ? 'Event created and published successfully! Redirecting to details...'
          : 'Event submitted for admin review. It is visible to you while pending. Redirecting to details...'
      );

      const createdId = createdEvent?._id || createdEvent?.id;
      if (createdId) {
        navigate(`/event/${createdId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (!error?.response && error?.message) {
        setErrorMessage(error.message);
        return;
      }

      const apiError = getApiError(error, 'Failed to create event');
      setErrorMessage(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">Host an Event</h1>
          <p className="text-slate-600 mt-1">Create a new campus event and upload a beautiful poster</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow border border-slate-200 p-8 md:p-12">
          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          
          {/* Image Upload Section */}
          <div className="mb-12">
            <label className="block text-sm font-medium text-slate-700 mb-3">Event Poster / Image</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-3xl h-80 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden relative"
            >
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Event preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:bg-red-50"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                  <p className="font-medium text-slate-700">Click to upload event image</p>
                  <p className="text-sm text-slate-500 mt-1">PNG, JPG or JPEG • Max 5MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 text-lg"
                  placeholder="e.g. Spring Tech Hackathon 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 resize-y"
                  placeholder="Describe your event in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                  placeholder="Engineering Hall, Room 201"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Approximate Duration</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Hours</label>
                    <input
                      type="number"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      min="0"
                      max="24"
                      required
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Minutes</label>
                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      min="0"
                      max="59"
                      required
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity (max attendees)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600"
                >
                  <option value="Academic">Academic</option>
                  <option value="Sports">Sports</option>
                  <option value="Arts">Arts</option>
                  <option value="Social">Social</option>
                  <option value="Tech">Tech</option>
                  <option value="Free Food">Free Food</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_free"
                  checked={formData.is_free}
                  onChange={handleChange}
                  className="w-5 h-5 accent-blue-600"
                />
                <label className="text-slate-700 font-medium">This event is free for all students</label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-12">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-5 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  {isAdmin ? 'Creating Event...' : 'Submitting For Review...'}
                </>
              ) : (
                isAdmin ? 'Create & Publish Event' : 'Submit Event For Review'
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              {isAdmin
                ? 'Admin-created events are published immediately.'
                : 'Your event will be reviewed by an admin before going live.'}
            </p>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}